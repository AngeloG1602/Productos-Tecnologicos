import assert from "node:assert/strict";
import { test } from "node:test";
import { esNuevo } from "./nuevo.ts";

const ahora = new Date("2026-11-21T12:00:00Z");

test("producto reciente es nuevo y el viejo no", () => {
  assert.equal(esNuevo("2026-11-20T12:00:00Z", ahora), true);
  assert.equal(esNuevo("2026-11-07T12:00:00Z", ahora), true); // justo 14 días
  assert.equal(esNuevo("2026-11-06T11:59:00Z", ahora), false);
});

test("fechas futuras o inválidas no cuentan como nuevo", () => {
  assert.equal(esNuevo("2026-12-01T00:00:00Z", ahora), false);
  assert.equal(esNuevo("no-es-fecha", ahora), false);
});
