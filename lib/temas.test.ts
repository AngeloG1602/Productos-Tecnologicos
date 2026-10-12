import { test } from "node:test";
import assert from "node:assert/strict";
import { esTemaValido, obtenerTema, TEMA_POR_DEFECTO, TEMAS } from "./temas.ts";

test("el tema por defecto existe en el catálogo", () => {
  assert.ok(TEMAS.some((t) => t.slug === TEMA_POR_DEFECTO));
});

test("cada tema tiene un slug único y colores no vacíos", () => {
  const slugs = TEMAS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of TEMAS) {
    assert.match(t.marca, /^#[0-9a-f]{6}$/i);
    assert.match(t.marcaSuave, /^#[0-9a-f]{6}$/i);
  }
});

test("solo los temas de temporada traen franja; clásico y estilo no", () => {
  for (const t of TEMAS) {
    if (t.categoria === "temporada") assert.ok(t.banner && t.banner.length > 0, `${t.slug} debería tener franja`);
    else assert.equal(t.banner, null, `${t.slug} no debería tener franja`);
  }
});

test("cada tema tiene un ícono asignado", () => {
  for (const t of TEMAS) assert.ok(t.icono);
});

test("esTemaValido reconoce solo los slugs del catálogo", () => {
  assert.equal(esTemaValido("black-friday"), true);
  assert.equal(esTemaValido("no-existe"), false);
});

test("obtenerTema cae al tema por defecto si el slug no existe", () => {
  assert.equal(obtenerTema("no-existe").slug, TEMA_POR_DEFECTO);
  assert.equal(obtenerTema("navidad").slug, "navidad");
});
