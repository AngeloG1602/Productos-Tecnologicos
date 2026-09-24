import { test } from "node:test";
import assert from "node:assert/strict";
import { esFechaValida, fechaLocal, formatearFechaHora, rangoMesActual } from "./fechas.ts";

test("la fecha local usa la hora de Colombia (UTC-5)", () => {
  // 3 a. m. UTC del 1 de octubre = 10 p. m. del 30 de septiembre en Bogotá
  assert.equal(fechaLocal(new Date("2026-10-01T03:00:00Z")), "2026-09-30");
  assert.equal(fechaLocal(new Date("2026-10-01T05:00:00Z")), "2026-10-01");
});

test("rango por defecto: del 1 del mes a hoy", () => {
  assert.deepEqual(rangoMesActual(new Date("2026-09-24T15:00:00Z")), { desde: "2026-09-01", hasta: "2026-09-24" });
  // Todavía es 30 de septiembre en Bogotá
  assert.deepEqual(rangoMesActual(new Date("2026-10-01T03:00:00Z")), { desde: "2026-09-01", hasta: "2026-09-30" });
});

test("valida fechas de la URL", () => {
  assert.equal(esFechaValida("2026-09-24"), true);
  assert.equal(esFechaValida("2026-02-30"), false);
  assert.equal(esFechaValida("24/09/2026"), false);
  assert.equal(esFechaValida(undefined), false);
  assert.equal(esFechaValida(["2026-09-24"]), false);
});

test("formatea fecha y hora en español y hora de Colombia", () => {
  const texto = formatearFechaHora("2026-10-01T03:00:00Z").replace(/\s/g, " ");
  assert.match(texto, /30/);
  assert.match(texto, /sept?/);
  assert.match(texto, /10:00/);
});
