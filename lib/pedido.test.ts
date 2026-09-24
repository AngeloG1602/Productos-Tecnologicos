import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretarRespuestaPedido } from "./pedido.ts";

const item = { producto_id: "a", nombre: "Cable", cantidad: 2, precio_unitario: 5600, subtotal: 11200 };

test("pedido creado", () => {
  const r = interpretarRespuestaPedido({ ok: true, codigo: "PED-0001", total: 11200, items: [item] });
  assert.deepEqual(r, { ok: true, codigo: "PED-0001", total: 11200, items: [item] });
});

test("pedido con cambios", () => {
  const cambio = {
    producto_id: "a", nombre: "Cable", tipo: "precio", cantidad_solicitada: 2, cantidad: 2,
    precio_anterior: 5000, precio_actual: 5600,
  };
  const r = interpretarRespuestaPedido({ ok: false, motivo: "cambios", cambios: [cambio], items: [item], total: 11200 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.cambios, [cambio]);
});

test("rechaza respuestas con forma inesperada", () => {
  assert.throws(() => interpretarRespuestaPedido(null));
  assert.throws(() => interpretarRespuestaPedido({ ok: true, total: 1, items: [] }));
  assert.throws(() => interpretarRespuestaPedido({ ok: true, codigo: "X", total: 1, items: [{ nombre: 1 }] }));
});
