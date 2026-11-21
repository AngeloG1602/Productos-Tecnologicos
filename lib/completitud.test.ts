import assert from "node:assert/strict";
import { test } from "node:test";
import { faltantes } from "./completitud.ts";

const completo = { precio_venta: 42000, imagenes: ["a/1.jpg"], descripcion: "Texto", costo: 30000 };

test("producto completo no tiene faltantes", () => {
  assert.deepEqual(faltantes(completo), []);
});

test("detecta precio, costo, foto y descripción", () => {
  assert.deepEqual(faltantes({ precio_venta: 0, imagenes: [], descripcion: "  ", costo: 0 }), ["precio", "costo", "foto", "descripción"]);
});

test("costo desconocido (null) no cuenta como faltante", () => {
  assert.deepEqual(faltantes({ ...completo, costo: null }), []);
});
