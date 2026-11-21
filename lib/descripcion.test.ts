import assert from "node:assert/strict";
import { test } from "node:test";
import { parsearDescripcion } from "./descripcion.ts";

test("texto simple es un párrafo", () => {
  assert.deepEqual(parsearDescripcion("Cargador de 20 W."), [{ tipo: "parrafo", texto: "Cargador de 20 W." }]);
});

test("sección con título y viñetas, con etiqueta antes de los dos puntos", () => {
  const r = parsearDescripcion("Introducción.\n\nPantalla\n• Tamaño: 32 pulgadas\n• Wi-Fi integrado");
  assert.deepEqual(r, [
    { tipo: "parrafo", texto: "Introducción." },
    {
      tipo: "lista",
      titulo: "Pantalla",
      items: [
        { etiqueta: "Tamaño", texto: "32 pulgadas" },
        { etiqueta: null, texto: "Wi-Fi integrado" },
      ],
    },
  ]);
});

test("lista sin título y espacios sobrantes", () => {
  const r = parsearDescripcion("  • uno\n  • dos  \n\n\n");
  assert.deepEqual(r, [
    {
      tipo: "lista",
      titulo: null,
      items: [
        { etiqueta: null, texto: "uno" },
        { etiqueta: null, texto: "dos" },
      ],
    },
  ]);
});

test("texto vacío no genera bloques", () => {
  assert.deepEqual(parsearDescripcion("  \n "), []);
});
