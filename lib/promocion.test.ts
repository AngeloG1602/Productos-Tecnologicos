import assert from "node:assert/strict";
import { test } from "node:test";
import { isoALocal, localAIso, validarPromocion, type EntradaPromocion } from "./promocion.ts";

const base: EntradaPromocion = {
  activa: true,
  titulo: "Oferta",
  texto: "Solo esta semana",
  boton_texto: "Ver ahora",
  producto_id: null,
  desde: "",
  hasta: "",
};

test("las fechas se interpretan en hora de Colombia y vuelven iguales", () => {
  assert.equal(localAIso("2026-11-27T08:00"), "2026-11-27T08:00:00-05:00");
  assert.equal(new Date(localAIso("2026-11-27T08:00")!).toISOString(), "2026-11-27T13:00:00.000Z");
  assert.equal(isoALocal("2026-11-27T13:00:00+00:00"), "2026-11-27T08:00");
  assert.equal(isoALocal(null), "");
  assert.equal(localAIso("mañana"), null);
});

test("promoción válida con título", () => {
  const r = validarPromocion(base);
  assert.equal(r.ok, true);
});

test("activa necesita producto o título", () => {
  assert.equal(validarPromocion({ ...base, titulo: "" }).ok, false);
  assert.equal(validarPromocion({ ...base, titulo: "", producto_id: "3e9747c0-bc16-4d49-bcd3-bace7632f5ec" }).ok, true);
  // apagada puede estar vacía
  assert.equal(validarPromocion({ ...base, activa: false, titulo: "" }).ok, true);
});

test("fin debe ser posterior al inicio", () => {
  assert.equal(validarPromocion({ ...base, desde: "2026-11-27T08:00", hasta: "2026-11-26T08:00" }).ok, false);
  assert.equal(validarPromocion({ ...base, desde: "2026-11-27T08:00", hasta: "2026-11-30T23:59" }).ok, true);
});

test("límites de largo y producto inválido", () => {
  assert.equal(validarPromocion({ ...base, titulo: "x".repeat(81) }).ok, false);
  assert.equal(validarPromocion({ ...base, texto: "x".repeat(241) }).ok, false);
  assert.equal(validarPromocion({ ...base, boton_texto: " " }).ok, false);
  assert.equal(validarPromocion({ ...base, producto_id: "no-es-uuid" }).ok, false);
});
