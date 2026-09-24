import { test } from "node:test";
import assert from "node:assert/strict";
import { formatearCOP } from "./formato.ts";

// Intl usa un espacio duro (U+00A0) entre el signo y el número.
const normalizar = (texto: string) => texto.replace(/\s/g, " ");

test("formatea pesos con separador de miles y sin decimales", () => {
  assert.equal(normalizar(formatearCOP(16800)), "$ 16.800");
  assert.equal(normalizar(formatearCOP(1250000)), "$ 1.250.000");
});

test("formatea cero", () => {
  assert.equal(normalizar(formatearCOP(0)), "$ 0");
});
