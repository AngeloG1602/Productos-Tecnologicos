import { test } from "node:test";
import assert from "node:assert/strict";
import { enlaceAnuncio, leerParametroAgregar } from "./anuncio.ts";

test("arma el enlace del anuncio", () => {
  assert.equal(
    enlaceAnuncio("https://productos-tecnologicos.vercel.app/", "cargador-usb-c-20w"),
    "https://productos-tecnologicos.vercel.app/producto/cargador-usb-c-20w?agregar=1",
  );
});

test("detecta el parámetro y lo quita conservando los demás", () => {
  assert.deepEqual(leerParametroAgregar("?agregar=1&utm_source=instagram&fbclid=abc"), {
    agregar: true,
    busquedaLimpia: "?utm_source=instagram&fbclid=abc",
  });
  assert.deepEqual(leerParametroAgregar("?agregar=1"), { agregar: true, busquedaLimpia: "" });
});

test("sin el parámetro no agrega nada", () => {
  assert.deepEqual(leerParametroAgregar(""), { agregar: false, busquedaLimpia: "" });
  assert.deepEqual(leerParametroAgregar("?agregar=0&q=x"), { agregar: false, busquedaLimpia: "?q=x" });
});
