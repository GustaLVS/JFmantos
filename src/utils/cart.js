import { normalizePersonalization } from "../../supabase/functions/_shared/personalization.js";

export function getCartItemKey(item) {
  const personalization = normalizePersonalization(item.personalization);
  return JSON.stringify([item.productId, item.size, personalization?.name || "", personalization?.number || ""]);
}

export function addCartItem(cart, item) {
  const normalizedItem = { ...item, personalization: normalizePersonalization(item.personalization) };
  const key = getCartItemKey(normalizedItem);
  const existing = cart.find((entry) => getCartItemKey(entry) === key);
  return existing
    ? cart.map((entry) => entry === existing ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
    : [...cart, normalizedItem];
}

export function changeCartItemQuantity(cart, key, delta) {
  return cart
    .map((item) => getCartItemKey(item) === key ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0);
}

export function removeCartItem(cart, key) {
  return cart.filter((item) => getCartItemKey(item) !== key);
}
