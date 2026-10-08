import assert from "node:assert/strict";
import test from "node:test";
import { addCartItem, changeCartItemQuantity, getCartItemKey, removeCartItem } from "../src/utils/cart.js";

const shirt = { productId: "shirt-1", size: "M", quantity: 1 };

test("keeps different names, numbers and plain shirts as separate items", () => {
  let cart = addCartItem([], shirt);
  cart = addCartItem(cart, { ...shirt, personalization: { name: "Ana", number: "10" } });
  cart = addCartItem(cart, { ...shirt, personalization: { name: "Bia", number: "10" } });
  cart = addCartItem(cart, { ...shirt, personalization: { name: "Ana", number: "11" } });
  cart = addCartItem(cart, { ...shirt, size: "G", personalization: { name: "Ana", number: "10" } });
  assert.equal(cart.length, 5);
  assert.equal(new Set(cart.map(getCartItemKey)).size, 5);
});

test("merges only identical customization and supports legacy cart items", () => {
  let cart = [shirt];
  cart = addCartItem(cart, { ...shirt, personalization: null });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);
  cart = addCartItem(cart, { ...shirt, personalization: { name: "Ana", number: "00" } });
  cart = addCartItem(cart, { ...shirt, quantity: 2, personalization: { name: " ANA ", number: "00" } });
  assert.equal(cart.length, 2);
  assert.equal(cart[1].quantity, 3);
});

test("quantity updates and removal affect only the chosen personalized line", () => {
  let cart = addCartItem([], shirt);
  cart = addCartItem(cart, { ...shirt, personalization: { name: "Ana", number: "10" } });
  const key = getCartItemKey(cart[1]);
  cart = changeCartItemQuantity(cart, key, 1);
  assert.deepEqual(cart.map((item) => item.quantity), [1, 2]);
  const remaining = removeCartItem(cart, key);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].personalization, null);
  assert.equal(changeCartItemQuantity(cart, key, -2).length, 1);
});

test("cart persistence retains customization exactly", () => {
  const cart = addCartItem([], { ...shirt, personalization: { name: "ANA", number: "07" } });
  const restored = JSON.parse(JSON.stringify(cart));
  assert.equal(getCartItemKey(restored[0]), getCartItemKey(cart[0]));
  assert.equal(restored[0].personalization.number, "07");
});
