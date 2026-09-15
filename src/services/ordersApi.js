import { supabase } from "./supabaseClient.js";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase nao configurado.");
  return supabase;
}

export async function fetchAdminOrders() {
  const client = requireSupabase();
  const { data: orders, error: ordersError } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (ordersError) throw ordersError;
  if (!orders?.length) return [];

  const orderIds = orders.map((order) => order.id);
  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] = await Promise.all([
    client.from("order_items").select("*").in("order_id", orderIds),
    client.from("payments").select("*").in("order_id", orderIds).order("created_at", { ascending: false }),
  ]);

  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;

  return orders.map((order) => ({
    ...order,
    items: (items || []).filter((item) => item.order_id === order.id),
    payments: (payments || []).filter((payment) => payment.order_id === order.id),
  }));
}

export async function fetchUserOrders(userId) {
  const client = requireSupabase();
  if (!userId) return [];

  const { data: orders, error: ordersError } = await client
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (ordersError) throw ordersError;
  if (!orders?.length) return [];

  const orderIds = orders.map((order) => order.id);
  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] = await Promise.all([
    client.from("order_items").select("*").in("order_id", orderIds),
    client.from("payments").select("*").in("order_id", orderIds).order("created_at", { ascending: false }),
  ]);

  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;

  return orders.map((order) => ({
    ...order,
    items: (items || []).filter((item) => item.order_id === order.id),
    payments: (payments || []).filter((payment) => payment.order_id === order.id),
  }));
}

export async function updateOrderTracking(orderId, trackingCode) {
  const client = requireSupabase();
  const code = trackingCode?.trim().toUpperCase();
  if (!orderId) throw new Error("Pedido invalido.");
  if (!code) throw new Error("Informe o codigo de rastreio.");

  const { data, error } = await client
    .from("orders")
    .update({
      tracking_code: code,
      tracking_carrier: "Correios",
      tracking_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrder(orderId) {
  const client = requireSupabase();
  if (!orderId) throw new Error("Pedido invalido.");

  const { error } = await client
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (error) throw error;
  return true;
}
