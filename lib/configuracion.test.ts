import { test } from "node:test";
import assert from "node:assert/strict";
import { validarConfiguracion } from "./configuracion.ts";

const base = {
  whatsappNumero: "+57 311 222 3344",
  margenDefault: "40",
  redondeo: "100",
  umbralStockBajo: "5",
  textoEnvio: "(El costo de envío se confirma por este medio)",
};

test("normaliza y acepta una configuración válida", () => {
  assert.deepEqual(validarConfiguracion(base), {
    ok: true,
    valores: {
      whatsapp_numero: "573112223344",
      margen_default: 40,
      redondeo: 100,
      umbral_stock_bajo: 5,
      texto_envio: "(El costo de envío se confirma por este medio)",
    },
  });
});

test("acepta margen con coma decimal", () => {
  const r = validarConfiguracion({ ...base, margenDefault: "37,5" });
  assert.equal(r.ok && r.valores.margen_default, 37.5);
});

test("rechaza datos inválidos", () => {
  assert.equal(validarConfiguracion({ ...base, whatsappNumero: "300" }).ok, false);
  assert.equal(validarConfiguracion({ ...base, margenDefault: "-5" }).ok, false);
  assert.equal(validarConfiguracion({ ...base, redondeo: "0" }).ok, false);
  assert.equal(validarConfiguracion({ ...base, redondeo: "50.5" }).ok, false);
  assert.equal(validarConfiguracion({ ...base, umbralStockBajo: "" }).ok, false);
  assert.equal(validarConfiguracion({ ...base, textoEnvio: "x".repeat(301) }).ok, false);
});
