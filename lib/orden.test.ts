import assert from "node:assert/strict";
import { test } from "node:test";
import { esOrden, filtrarPorPrecio, leerMonto, ordenarProductos } from "./orden.ts";

const p = (nombre: string, precio_venta: number, stock = 5, destacado = false, created_at = "2026-11-01T00:00:00Z") => ({
  nombre,
  precio_venta,
  stock,
  destacado,
  created_at,
});
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

test("recientes: lo último creado primero, agotados al final", () => {
  const l = [p("viejo", 1, 5, false, "2026-10-01T00:00:00Z"), p("nuevo", 1, 5, false, "2026-11-20T00:00:00Z"), p("agotado-nuevo", 1, 0, false, "2026-11-21T00:00:00Z")];
  assert.deepEqual(ordenarProductos(l, "recientes").map((x) => x.nombre), ["nuevo", "viejo", "agotado-nuevo"]);
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

test("un bajo pedido sin stock no se manda al final como agotado", () => {
  const l = [
    { nombre: "agotado", precio_venta: 1, stock: 0, destacado: false, created_at: "2026-11-01T00:00:00Z" },
    { nombre: "encargo", precio_venta: 2, stock: 0, destacado: false, created_at: "2026-11-01T00:00:00Z", bajo_pedido: true },
  ];
  assert.deepEqual(ordenarProductos(l, "precio-asc").map((x) => x.nombre), ["encargo", "agotado"]);
});
