import { test } from "node:test";
import assert from "node:assert/strict";
import { coincideBusqueda, normalizar } from "./texto.ts";

test("normalizar quita tildes y mayúsculas", () => {
  assert.equal(normalizar("  Audífonos Bluetooth "), "audifonos bluetooth");
  assert.equal(normalizar("Batería ÑANDÚ"), "bateria nandu");
});

test("búsqueda vacía coincide con todo", () => {
  assert.equal(coincideBusqueda("Cargador USB-C 20W", "   "), true);
});

test("búsqueda sin importar tildes, mayúsculas ni orden", () => {
  assert.equal(coincideBusqueda("Audífonos Bluetooth X", "audifonos"), true);
  assert.equal(coincideBusqueda("Audífonos Bluetooth X", "BLUETOOTH audíf"), true);
  assert.equal(coincideBusqueda("Cargador USB-C 20W", "usb-c 20"), true);
});

test("todas las palabras deben aparecer", () => {
  assert.equal(coincideBusqueda("Cargador USB-C 20W", "cargador lightning"), false);
});
