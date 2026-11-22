import assert from "node:assert/strict";
import { test } from "node:test";
import { hayExistencia } from "./disponibilidad.ts";

test("con stock o bajo pedido se puede pedir; sin stock normal, no", () => {
  assert.equal(hayExistencia({ stock: 3 }), true);
  assert.equal(hayExistencia({ stock: 0 }), false);
  assert.equal(hayExistencia({ stock: 0, bajo_pedido: false }), false);
  assert.equal(hayExistencia({ stock: 0, bajo_pedido: true }), true);
});
