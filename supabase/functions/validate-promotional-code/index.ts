import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function getSecretKey() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEYS") || "";
  try {
    return JSON.parse(key).default;
  } catch {
    return key;
  }
}

function calculateDiscount(code: Record<string, unknown>, subtotal: number) {
  let discount = code.discount_type === "percent"
    ? subtotal * Number(code.value) / 100
    : Number(code.value);
  if (code.maximum_discount) discount = Math.min(discount, Number(code.maximum_discount));
  return Math.round(Math.min(discount, subtotal) * 100) / 100;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code: rawCode, subtotal: rawSubtotal } = await request.json();
    const code = String(rawCode || "").trim().toUpperCase();
    const subtotal = Number(rawSubtotal || 0);
    if (!code) return json({ error: "Digite um codigo promocional." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, getSecretKey());
    const { data, error } = await admin
      .from("promotional_codes")
      .select("*")
      .ilike("code", code)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.active) return json({ error: "Cupom invalido ou inativo." }, 400);

    const now = new Date();
    if (data.starts_at && new Date(data.starts_at) > now) return json({ error: "Este cupom ainda nao esta disponivel." }, 400);
    if (data.expires_at && new Date(data.expires_at) < now) return json({ error: "Este cupom expirou." }, 400);
    if (data.usage_limit && data.used_count >= data.usage_limit) return json({ error: "Este cupom atingiu o limite de usos." }, 400);
    if (subtotal < Number(data.minimum_order || 0)) {
      return json({ error: `Pedido minimo de R$ ${Number(data.minimum_order).toFixed(2).replace(".", ",")}.` }, 400);
    }

    return json({
      valid: true,
      code: data.code,
      description: data.description,
      discount: calculateDiscount(data, subtotal),
    });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Nao foi possivel validar o cupom." }, 500);
  }
});
