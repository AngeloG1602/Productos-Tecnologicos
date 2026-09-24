import { test } from "node:test";
import assert from "node:assert/strict";
import { generarSlug } from "./slug.ts";

test("genera un slug legible a partir del nombre", () => {
  assert.equal(generarSlug("Cargador USB-C 20W"), "cargador-usb-c-20w");
  assert.equal(generarSlug("  Audífonos Bluetooth X  "), "audifonos-bluetooth-x");
});

test("quita tildes y símbolos", () => {
  assert.equal(generarSlug("Ñandú & Cía. (10%)"), "nandu-cia-10");
});

test("un texto sin letras ni números da un valor por defecto", () => {
  assert.equal(generarSlug("···"), "producto");
  assert.equal(generarSlug(""), "producto");
});
