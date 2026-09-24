import { test } from "node:test";
import assert from "node:assert/strict";
import { productosRelacionados } from "./relacionados.ts";

const p = (id: string, categoria_id: string | null, stock = 5, destacado = false) => ({ id, categoria_id, stock, destacado });

test("primero la misma categoría, luego destacados, luego el resto", () => {
  const actual = p("a", "audio");
  const todos = [p("x", "cables"), p("y", "cables", 5, true), p("b", "audio"), actual, p("c", "audio", 5, true)];
  assert.deepEqual(productosRelacionados(todos, actual).map((q) => q.id), ["c", "b", "y", "x"]);
});

test("excluye el producto actual y los agotados, y respeta el máximo", () => {
  const actual = p("a", "audio");
  const todos = [actual, p("b", "audio", 0), p("c", null), p("d", null), p("e", null)];
  assert.deepEqual(productosRelacionados(todos, actual, 2).map((q) => q.id), ["c", "d"]);
});
