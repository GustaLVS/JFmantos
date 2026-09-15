import { createClient } from "npm:@supabase/supabase-js@2";

function getSecretKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS") || "";
  try {
    return JSON.parse(secretKeys).default;
  } catch {
    return secretKeys;
  }
}

Deno.serve(async (request) => {
  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!accessToken || !supabaseUrl) throw new Error("Secrets indisponiveis.");

    const url = new URL(request.url);
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const paymentId = body?.data?.id || body?.id || url.searchParams.get("data.id") || url.searchParams.get("id");
    if (!paymentId) return new Response("ok", { status: 200 });

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok) throw new Error("Pagamento nao encontrado no Mercado Pago.");

    const orderId = payment.external_reference || payment.metadata?.order_id;
    if (!orderId) return new Response("ok", { status: 200 });

    const statusMap: Record<string, string> = {
      approved: "paid",
      cancelled: "cancelled",
      rejected: "failed",
      refunded: "refunded",
      charged_back: "refunded",
      in_process: "pending",
      pending: "pending",
    };
    const orderStatus = statusMap[payment.status] || "pending";
    const admin = createClient(supabaseUrl, getSecretKey());

    await admin.from("orders").update({
      status: orderStatus,
      payment_provider_payment_id: String(payment.id),
      paid_at: orderStatus === "paid" ? payment.date_approved || new Date().toISOString() : null,
      cancelled_at: orderStatus === "cancelled" ? new Date().toISOString() : null,
    }).eq("id", orderId);

    await admin.from("payments").update({
      status: payment.status === "approved" ? "approved" : (["rejected", "cancelled", "refunded"].includes(payment.status) ? payment.status : "pending"),
      provider_payment_id: String(payment.id),
      provider_status: payment.status,
      provider_status_detail: payment.status_detail,
      raw_response: payment,
    }).eq("order_id", orderId);

    if (orderStatus === "paid") {
      const { data: order } = await admin
        .from("orders")
        .select("user_id, promotional_code_id, promo_discount")
        .eq("id", orderId)
        .single();

      if (order?.promotional_code_id) {
        const { error: redemptionError } = await admin.from("promo_redemptions").insert({
          promotional_code_id: order.promotional_code_id,
          order_id: orderId,
          user_id: order.user_id,
          discount_amount: order.promo_discount || 0,
        });

        if (!redemptionError) {
          const { data: promo } = await admin
            .from("promotional_codes")
            .select("used_count")
            .eq("id", order.promotional_code_id)
            .single();
          await admin.from("promotional_codes")
            .update({ used_count: Number(promo?.used_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq("id", order.promotional_code_id);
        }
      }
    }

    await admin.from("payment_events").insert({
      provider: "mercado_pago",
      event_type: body?.type || body?.action || "payment.updated",
      provider_payment_id: String(payment.id),
      order_id: orderId,
      payload: body,
      processed: true,
    });

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("error", { status: 500 });
  }
});
