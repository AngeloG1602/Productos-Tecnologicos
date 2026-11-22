import assert from "node:assert/strict";
import { test } from "node:test";
import { armarEmbudo } from "./metricas.ts";

test("embudo con conversión de visitas a pedidos", () => {
  const e = armarEmbudo({ vista_inicio: 200, vista_producto: 150, agregar_carrito: 30 }, 9);
  assert.deepEqual(e, { visitas: 200, productosVistos: 150, agregados: 30, pedidos: 9, conversionPct: 4.5 });
});

test("sin visitas no hay conversión (evita dividir por cero)", () => {
  const e = armarEmbudo({}, 3);
  assert.equal(e.conversionPct, null);
  assert.equal(e.visitas, 0);
});
