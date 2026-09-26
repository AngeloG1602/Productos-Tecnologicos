import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diaSemana,
  esFechaValida,
  fechaHoraLocal,
  fechaLocal,
  formatearFechaHora,
  formatearFechaLarga,
  limitesRango,
  rangoMesActual,
} from "./fechas.ts";

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

test("límites de un rango en hora de Colombia", () => {
  assert.deepEqual(limitesRango("2026-09-01", "2026-09-30"), {
    inicio: "2026-09-01T05:00:00.000Z",
    fin: "2026-10-01T05:00:00.000Z",
  });
  // Un solo día; cruce de año
  assert.deepEqual(limitesRango("2026-12-31", "2026-12-31"), {
    inicio: "2026-12-31T05:00:00.000Z",
    fin: "2027-01-01T05:00:00.000Z",
  });
});

test("fecha y hora para hojas de cálculo", () => {
  assert.equal(fechaHoraLocal("2026-10-01T03:05:00Z"), "2026-09-30 22:05");
  assert.equal(fechaHoraLocal("2026-10-01T05:00:00Z"), "2026-10-01 00:00");
});

test("día de la semana y fecha larga", () => {
  assert.equal(diaSemana("2026-09-26"), "sábado");
  assert.equal(diaSemana("2026-09-28"), "lunes");
  assert.equal(formatearFechaLarga("2026-09-26"), "26 de septiembre de 2026");
});
