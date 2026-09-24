import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoStock } from "./stock.ts";

test("stock mayor al umbral → Disponible", () => {
  assert.deepEqual(estadoStock(6, 5), { tipo: "disponible", texto: "Disponible", puedeComprar: true });
});

test("stock entre 1 y el umbral → Últimas X unidades", () => {
  assert.equal(estadoStock(5, 5).texto, "¡Últimas 5 unidades!");
  assert.equal(estadoStock(2, 5).texto, "¡Últimas 2 unidades!");
  assert.equal(estadoStock(2, 5).tipo, "ultimas");
});

test("una sola unidad → Última unidad", () => {
  assert.equal(estadoStock(1, 5).texto, "¡Última unidad!");
});

test("stock 0 → Agotado y no se puede comprar", () => {
  assert.deepEqual(estadoStock(0, 5), { tipo: "agotado", texto: "Agotado", puedeComprar: false });
});

test("umbral 0 → todo lo que tenga stock está Disponible", () => {
  assert.equal(estadoStock(1, 0).tipo, "disponible");
});
