import assert from "node:assert/strict";
import test from "node:test";
import { normalizePersonalization } from "../supabase/functions/_shared/personalization.js";
import { createOrdersCsv } from "../src/utils/exportOrdersCsv.js";

test("normalizes names and preserves zero and leading zeros", () => {
  assert.deepEqual(normalizePersonalization({ name: "  jos\u00e9   silva ", number: "00" }), { name: "JOS\u00c9 SILVA", number: "00" });
  assert.deepEqual(normalizePersonalization({ number: 0 }), { name: "", number: "0" });
  assert.deepEqual(normalizePersonalization({ name: "Ana" }), { name: "ANA", number: "" });
  assert.deepEqual(normalizePersonalization({ number: "99" }), { name: "", number: "99" });
});

test("keeps personalization optional for old carts and requests", () => {
  assert.equal(normalizePersonalization(undefined), null);
  assert.equal(normalizePersonalization(null), null);
  assert.equal(normalizePersonalization({ name: "   ", number: "" }), null);
});

test("rejects invalid or oversized personalization on both client and server", () => {
  for (const number of ["100", "-1", "1.5", "AB", "1e1", "  "]) {
    if (number.trim()) assert.throws(() => normalizePersonalization({ number }));
  }
  for (const value of ["name", [], { name: 1 }, { name: "A".repeat(21) }, { name: "ANA\nSILVA" }, { number: {} }]) {
    assert.throws(() => normalizePersonalization(value));
  }
  assert.equal(normalizePersonalization({ name: "A".repeat(20) }).name.length, 20);
});

test("exports personalization per order item and leaves old orders compatible", () => {
  const csv = createOrdersCsv([{
    id: "order-1",
    items: [
      { product_name: "Camisa", personalization_name: "ANA", personalization_number: "00" },
      { product_name: "Camisa sem personalizacao" },
    ],
  }]);
  const [header, personalized, plain] = csv.split("\r\n");
  const labels = header.replace(/^\uFEFF/, "").split(";");
  assert.equal(personalized.split(";")[labels.indexOf('"Nome na camisa"')], '"ANA"');
  assert.equal(personalized.split(";")[labels.indexOf('"Numero na camisa"')], '"00"');
  assert.equal(plain.split(";")[labels.indexOf('"Nome na camisa"')], '""');
});
