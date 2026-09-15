import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const money = (value: number) => Math.round(value * 100) / 100;

function promoDiscount(code: Record<string, unknown>, subtotal: number) {
  let value = code.discount_type === "percent"
    ? subtotal * Number(code.value) / 100
    : Number(code.value);
  if (code.maximum_discount) value = Math.min(value, Number(code.maximum_discount));
  return money(Math.min(value, subtotal));
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    return String(value.message || value.error_description || value.details || value.hint || JSON.stringify(value));
  }
  return "Erro interno ao criar pagamento.";
}

function getSecretKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) throw new Error("Chave administrativa do Supabase indisponivel.");
  try {
    return JSON.parse(secretKeys).default;
  } catch {
    return secretKeys;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Metodo nao permitido." }, 405);

  let stage = "inicio";

  try {
    stage = "configuracao";
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const authorization = request.headers.get("Authorization");

    if (!accessToken || !supabaseUrl) throw new Error("Credenciais do pagamento nao configuradas.");
    if (!authorization) return json({ error: "Entre na sua conta antes de pagar." }, 401);

    const publicKey = Deno.env.get("SUPABASE_ANON_KEY")
      || JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default;
    if (!publicKey) throw new Error("Chave publica do Supabase indisponivel.");

    stage = "autenticacao";
    const supabaseUser = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData.user) return json({ error: "Sessao invalida. Entre novamente." }, 401);

    stage = "leitura-do-carrinho";
    const supabaseAdmin = createClient(supabaseUrl, getSecretKey());
    const body = await request.json();
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    if (!requestedItems.length) return json({ error: "O carrinho esta vazio." }, 400);

    const productIds = [...new Set(requestedItems.map((item) => String(item.productId || "")).filter(Boolean))];
    stage = "consulta-dos-produtos";
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, team, category, season, price, image_url, active")
      .in("id", productIds)
      .eq("active", true);

    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      return json({ error: "Um ou mais produtos nao estao disponiveis no catalogo." }, 400);
    }

    const productsById = new Map(products.map((product) => [String(product.id), product]));
    const orderItems = requestedItems.map((item) => {
      const product = productsById.get(String(item.productId));
      if (!product) throw new Error("Produto indisponivel.");

      const quantity = Math.max(1, Math.min(10, Number.parseInt(item.quantity, 10) || 1));
      const unitPrice = money(Number(product.price));
      return {
        product_id: String(product.id),
        product_name: product.name,
        team: product.team,
        category: product.category,
        season: product.season,
        size: String(item.size || "M").slice(0, 10),
        quantity,
        unit_price: unitPrice,
        total: money(unitPrice * quantity),
        total_price: money(unitPrice * quantity),
        image: product.image_url,
      };
    });

    const subtotal = money(orderItems.reduce((sum, item) => sum + item.total_price, 0));
    const shipping = subtotal > 0 ? 24.9 : 0;
    const baseDiscount = subtotal >= 500 ? 35 : 0;
    let promotionalCode = null;
    let promotionalDiscount = 0;
    const requestedPromoCode = String(body.promoCode || "").trim().toUpperCase();

    if (requestedPromoCode) {
      stage = "validacao-do-cupom";
      const { data: code, error: codeError } = await supabaseAdmin
        .from("promotional_codes")
        .select("*")
        .ilike("code", requestedPromoCode)
        .maybeSingle();
      if (codeError) throw codeError;
      if (!code || !code.active) return json({ error: "Cupom invalido ou inativo." }, 400);

      const now = new Date();
      if (code.starts_at && new Date(code.starts_at) > now) return json({ error: "Este cupom ainda nao esta disponivel." }, 400);
      if (code.expires_at && new Date(code.expires_at) < now) return json({ error: "Este cupom expirou." }, 400);
      if (code.usage_limit && code.used_count >= code.usage_limit) return json({ error: "Este cupom atingiu o limite de usos." }, 400);
      if (subtotal < Number(code.minimum_order || 0)) return json({ error: "O pedido nao atingiu o valor minimo do cupom." }, 400);

      promotionalCode = code;
      promotionalDiscount = promoDiscount(code, subtotal);
    }

    const discount = money(baseDiscount + promotionalDiscount);
    const total = money(subtotal + shipping - discount);
    const customer = body.customer || {};
    const paymentMethods: Record<string, string> = {
      Pix: "pix",
      "Cartao de credito": "credit_card",
      Boleto: "boleto",
    };
    const paymentMethod = paymentMethods[body.paymentMethod] || "pix";

    if (!customer.name || !customer.email) {
      return json({ error: "Informe nome e e-mail para continuar." }, 400);
    }

    stage = "criacao-do-pedido";
    const zip = String(customer.zip || "").trim();
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: authData.user.id,
        customer_name: String(customer.name).trim(),
        customer_email: String(customer.email).trim(),
        customer_phone: String(customer.phone || "").trim(),
        customer_document: String(customer.document || "").trim() || null,
        zip,
        zip_code: zip,
        address: String(customer.address || "").trim(),
        city: String(customer.city || "").trim(),
        state: String(customer.state || "").trim().toUpperCase().slice(0, 2),
        subtotal,
        shipping,
        discount,
        total,
        promotional_code_id: promotionalCode?.id || null,
        promo_code: promotionalCode?.code || null,
        promo_discount: promotionalDiscount,
        status: "pending",
        payment_method: paymentMethod,
        payment_provider: "mercado_pago",
      })
      .select("id, order_number")
      .single();

    if (orderError) throw orderError;

    stage = "criacao-dos-itens";
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) throw itemsError;

    const functionBaseUrl = `${supabaseUrl}/functions/v1`;
    const origin = typeof body.origin === "string" ? body.origin : "";
    const preference: Record<string, unknown> = {
      items: [{
        id: order.id,
        title: `Pedido JFMANTOS #${order.order_number}`,
        description: `${orderItems.reduce((sum, item) => sum + item.quantity, 0)} camisa(s) de futebol`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: total,
      }],
      external_reference: order.id,
      notification_url: `${functionBaseUrl}/mercado-pago-webhook`,
      statement_descriptor: "JFMANTOS",
      metadata: { order_id: order.id, preferred_method: paymentMethod },
    };

    if (paymentMethod === "credit_card") {
      preference.binary_mode = true;
    }

    preference.payer = {
      name: String(customer.name).trim(),
      email: String(customer.email).trim(),
    };

    if (origin.startsWith("https://")) {
      preference.back_urls = {
        success: `${origin}/#minha-conta`,
        pending: `${origin}/#minha-conta`,
        failure: `${origin}/#checkout`,
      };
      preference.auto_return = "approved";
    }

    stage = "mercado-pago";
    const mercadoPagoResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify(preference),
    });
    const mercadoPagoData = await mercadoPagoResponse.json();

    if (!mercadoPagoResponse.ok) {
      await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
      console.error("Mercado Pago preference error", mercadoPagoData);
      return json({ error: mercadoPagoData.message || "Mercado Pago recusou a preferencia." }, 502);
    }

    const paymentUrl = mercadoPagoData.init_point || mercadoPagoData.sandbox_init_point;
    stage = "atualizacao-do-pedido";
    await supabaseAdmin.from("orders").update({
      payment_provider_order_id: mercadoPagoData.id,
    }).eq("id", order.id);

    stage = "registro-do-pagamento";
    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "mercado_pago",
      method: paymentMethod,
      status: "pending",
      provider_preference_id: mercadoPagoData.id,
      payment_url: paymentUrl,
      amount: total,
      raw_response: mercadoPagoData,
    });
    if (paymentError) throw paymentError;

    return json({
      orderId: order.id,
      orderNumber: order.order_number,
      preferenceId: mercadoPagoData.id,
      checkoutUrl: paymentUrl,
    });
  } catch (error) {
    const message = errorMessage(error);
    console.error(`Falha em ${stage}:`, error);
    return json({ error: `Falha em ${stage}: ${message}` }, 500);
  }
});
