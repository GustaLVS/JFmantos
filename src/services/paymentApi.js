import { supabase } from "./supabaseClient.js";

async function invokePaymentFunction(name, body) {
  if (!supabase) throw new Error("Supabase nao configurado.");

  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const details = await error.context?.json();
      message = details?.error || message;
    } catch {
      // Mantem a mensagem original quando a resposta nao e JSON.
    }
    throw new Error(message || "Nao foi possivel concluir a solicitacao.");
  }
  return data;
}

export async function validatePromotionalCode(code, subtotal) {
  const data = await invokePaymentFunction("validate-promotional-code", { code, subtotal });
  if (!data?.valid) throw new Error(data?.error || "Cupom invalido.");
  return data;
}

export async function createMercadoPagoCheckout({ cartItems, customer, paymentMethod, promoCode }) {
  const data = await invokePaymentFunction("create-mercado-pago-preference", {
      items: cartItems.map(({ product, size, quantity }) => ({
        productId: product.id,
        size,
        quantity,
      })),
      customer,
      paymentMethod,
      promoCode,
      origin: window.location.origin,
    });

  if (!data?.checkoutUrl) throw new Error(data?.error || "Link de pagamento nao recebido.");
  return data;
}
