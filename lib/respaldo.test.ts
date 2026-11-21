import assert from "node:assert/strict";
import { test } from "node:test";
import { diasDesdeRespaldo, necesitaRespaldo, textoUltimoRespaldo } from "./respaldo.ts";

const ahora = new Date("2026-11-21T12:00:00Z");

test("nunca hubo copia: la necesita y lo dice", () => {
  assert.equal(diasDesdeRespaldo(null, ahora), null);
  assert.equal(necesitaRespaldo(null, ahora), true);
  assert.match(textoUltimoRespaldo(null, ahora), /Todavía no/);
});

test("copia reciente no se recuerda; a los 7 días sí", () => {
  assert.equal(necesitaRespaldo("2026-11-20T12:00:00Z", ahora), false);
  assert.equal(necesitaRespaldo("2026-11-15T12:00:00Z", ahora), false); // 6 días
  assert.equal(necesitaRespaldo("2026-11-14T12:00:00Z", ahora), true); // 7 días
});

test("textos en singular, plural y hoy", () => {
  assert.equal(textoUltimoRespaldo("2026-11-21T08:00:00Z", ahora), "Última copia: hoy.");
  assert.equal(textoUltimoRespaldo("2026-11-20T08:00:00Z", ahora), "Última copia: hace 1 día.");
  assert.equal(textoUltimoRespaldo("2026-11-16T12:00:00Z", ahora), "Última copia: hace 5 días.");
});

test("fecha inválida cuenta como sin copia", () => {
  assert.equal(diasDesdeRespaldo("basura", ahora), null);
});
