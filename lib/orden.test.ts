import assert from "node:assert/strict";
import { test } from "node:test";
import { esOrden, filtrarPorPrecio, leerMonto, ordenarProductos } from "./orden.ts";

const p = (nombre: string, precio_venta: number, stock = 5, destacado = false) => ({ nombre, precio_venta, stock, destacado });
const lista = [p("a", 30000), p("b", 10000, 0), p("c", 20000, 5, true), p("d", 5000)];

test("precio ascendente: agotados al final", () => {
  assert.deepEqual(ordenarProductos(lista, "precio-asc").map((x) => x.nombre), ["d", "c", "a", "b"]);
});

test("precio descendente: agotados al final", () => {
  assert.deepEqual(ordenarProductos(lista, "precio-desc").map((x) => x.nombre), ["a", "c", "d", "b"]);
});

test("relevancia: destacados primero y conserva el orden original", () => {
  assert.deepEqual(ordenarProductos(lista, "relevancia").map((x) => x.nombre), ["c", "a", "d", "b"]);
});

test("no modifica la lista original", () => {
  const copia = [...lista];
  ordenarProductos(lista, "precio-asc");
  assert.deepEqual(lista, copia);
});

test("filtro de precio inclusivo y con extremos abiertos", () => {
  assert.deepEqual(filtrarPorPrecio(lista, 10000, 20000).map((x) => x.nombre), ["b", "c"]);
  assert.deepEqual(filtrarPorPrecio(lista, null, 5000).map((x) => x.nombre), ["d"]);
  assert.deepEqual(filtrarPorPrecio(lista, 25000, null).map((x) => x.nombre), ["a"]);
  assert.equal(filtrarPorPrecio(lista, null, null).length, 4);
});

test("leerMonto y esOrden validan la entrada", () => {
  assert.equal(leerMonto("15000"), 15000);
  assert.equal(leerMonto("-5"), null);
  assert.equal(leerMonto("abc"), null);
  assert.equal(leerMonto(null), null);
  assert.equal(esOrden("precio-asc"), true);
  assert.equal(esOrden("otro"), false);
});
