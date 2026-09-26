import { test } from "node:test";
import assert from "node:assert/strict";
import { textoGarantia, validarDatosLegales } from "./legal.ts";

const base = {
  nombre: "  Juan Pérez  ",
  documento: "CC 1.234.567",
  direccion: "Calle 1 # 2-3",
  ciudad: "Medellín",
  correo: " Ventas@MiTienda.com ",
  garantiaMeses: "12",
  metodosPago: "Nequi, transferencia o contraentrega",
  tiempoEntrega: "1 a 3 días hábiles en Medellín",
};

test("acepta y limpia datos legales válidos", () => {
  const r = validarDatosLegales(base);
  assert.ok(r.ok);
  assert.equal(r.valores.legal_nombre, "Juan Pérez");
  assert.equal(r.valores.legal_correo, "ventas@mitienda.com");
  assert.equal(r.valores.garantia_meses, 12);
});

test("permite dejar campos vacíos (se completan después)", () => {
  const r = validarDatosLegales({ ...base, nombre: "", correo: "", metodosPago: "" });
  assert.ok(r.ok);
  assert.equal(r.valores.legal_nombre, "");
});

test("rechaza correo, garantía y textos inválidos", () => {
  assert.equal(validarDatosLegales({ ...base, correo: "ventas@" }).ok, false);
  assert.equal(validarDatosLegales({ ...base, garantiaMeses: "0" }).ok, false);
  assert.equal(validarDatosLegales({ ...base, garantiaMeses: "61" }).ok, false);
  assert.equal(validarDatosLegales({ ...base, garantiaMeses: "6.5" }).ok, false);
  assert.equal(validarDatosLegales({ ...base, nombre: "x".repeat(121) }).ok, false);
  assert.equal(validarDatosLegales({ ...base, metodosPago: "x".repeat(301) }).ok, false);
});

test("texto de la garantía", () => {
  assert.equal(textoGarantia(1), "1 mes");
  assert.equal(textoGarantia(6), "6 meses");
  assert.equal(textoGarantia(12), "12 meses (1 año)");
  assert.equal(textoGarantia(24), "24 meses (2 años)");
});
