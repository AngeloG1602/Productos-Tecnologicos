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

import { esEstadoPedido, pedidoVencido } from "./pedido.ts";

test("un pendiente con más de 7 días está vencido", () => {
  const ahora = new Date("2026-09-24T12:00:00Z");
  assert.equal(pedidoVencido({ estado: "pendiente", created_at: "2026-09-17T11:59:00Z" }, ahora), true);
  assert.equal(pedidoVencido({ estado: "pendiente", created_at: "2026-09-17T12:01:00Z" }, ahora), false);
});

test("solo los pendientes se marcan como vencidos", () => {
  const ahora = new Date("2026-09-24T12:00:00Z");
  assert.equal(pedidoVencido({ estado: "confirmado", created_at: "2026-01-01T00:00:00Z" }, ahora), false);
  assert.equal(pedidoVencido({ estado: "cancelado", created_at: "2026-01-01T00:00:00Z" }, ahora), false);
});

test("reconoce los estados válidos", () => {
  assert.equal(esEstadoPedido("confirmado"), true);
  assert.equal(esEstadoPedido("pagado"), false);
  assert.equal(esEstadoPedido(undefined), false);
});
