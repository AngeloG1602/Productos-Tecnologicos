import { test } from "node:test";
import assert from "node:assert/strict";
import { margenReal, porcentajeDescuento, precioPorDebajoDelCosto, precioSugerido, redondearArriba } from "./precio.ts";

test("redondea hacia arriba al múltiplo", () => {
  assert.equal(redondearArriba(16750, 100), 16800);
  assert.equal(redondearArriba(16800, 100), 16800);
  assert.equal(redondearArriba(1, 100), 100);
  assert.equal(redondearArriba(1234, 1), 1234);
});

test("precio sugerido: ejemplo de la especificación (costo 12.000, margen 40% → 16.800)", () => {
  assert.equal(precioSugerido(12000, 40, 100), 16800);
});

test("precio sugerido con otros márgenes y redondeos", () => {
  assert.equal(precioSugerido(5000, 40, 100), 7000);
  assert.equal(precioSugerido(5000, 0, 100), 5000);
  assert.equal(precioSugerido(4321, 10, 500), 5000);
});

test("margen real a partir de un precio ajustado a mano", () => {
  assert.equal(margenReal(12000, 16800), 40);
  assert.equal(margenReal(10000, 9000), -10);
  assert.equal(margenReal(0, 5000), null);
});

test("advertencia cuando el precio queda por debajo del costo", () => {
  assert.equal(precioPorDebajoDelCosto(12000, 11000), true);
  assert.equal(precioPorDebajoDelCosto(12000, 12000), false);
  assert.equal(precioPorDebajoDelCosto(12000, 16800), false);
});

test("porcentaje de descuento con precio anterior", () => {
  assert.equal(porcentajeDescuento(20000, 17000), 15);
  assert.equal(porcentajeDescuento(20000, 15000), 25);
});

test("sin descuento cuando no hay precio anterior o no es mayor", () => {
  assert.equal(porcentajeDescuento(null, 17000), null);
  assert.equal(porcentajeDescuento(undefined, 17000), null);
  assert.equal(porcentajeDescuento(17000, 17000), null);
  assert.equal(porcentajeDescuento(15000, 17000), null);
});
