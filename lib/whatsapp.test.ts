import { test } from "node:test";
import assert from "node:assert/strict";
import { enlaceWhatsApp, formatearTelefono, mensajePedido, normalizarNumero } from "./whatsapp.ts";

const n = (t: string) => t.replace(/ /g, " ");

test("normaliza el número a solo dígitos", () => {
  assert.equal(normalizarNumero("+57 300 123-4567"), "573001234567");
});

test("enlace wa.me con el mensaje codificado", () => {
  assert.equal(enlaceWhatsApp("+57 300", "Hola & chao?"), "https://wa.me/57300?text=Hola%20%26%20chao%3F");
  assert.equal(enlaceWhatsApp("57300"), "https://wa.me/57300");
});

test("mensaje del pedido con el formato de RN-08 y enlaces", () => {
  const mensaje = mensajePedido({
    codigo: "PED-0042",
    items: [
      { nombre: "Cargador USB-C 20W", cantidad: 2, subtotal: 33600, enlace: "https://tienda.co/producto/cargador" },
      { nombre: "Audífonos Bluetooth X", cantidad: 1, subtotal: 45000, enlace: "https://tienda.co/producto/audifonos" },
    ],
    total: 78600,
    cliente: { nombre: " Laura Gómez ", ciudad: "Bogotá - Chapinero", notas: "Entregar en la tarde" },
    textoEnvio: "(El costo de envío se confirma por este medio)",
  });
  assert.equal(
    n(mensaje),
    [
      "¡Hola! Quiero hacer este pedido 🛒",
      "Pedido: PED-0042",
      "",
      "• 2 x Cargador USB-C 20W — $ 33.600",
      "  https://tienda.co/producto/cargador",
      "• 1 x Audífonos Bluetooth X — $ 45.000",
      "  https://tienda.co/producto/audifonos",
      "",
      "Total productos: $ 78.600",
      "Nombre: Laura Gómez",
      "Ciudad/Barrio: Bogotá - Chapinero",
      "Notas: Entregar en la tarde",
      "",
      "(El costo de envío se confirma por este medio)",
    ].join("\n"),
  );
});

test("sin notas ni texto de envío, esas líneas no aparecen", () => {
  const mensaje = mensajePedido({
    codigo: "PED-0001",
    items: [{ nombre: "Cable", cantidad: 1, subtotal: 5600 }],
    total: 5600,
    cliente: { nombre: "Ana", ciudad: "Cali", notas: "  " },
  });
  assert.ok(!mensaje.includes("Notas:"));
  assert.ok(n(mensaje).endsWith("Ciudad/Barrio: Cali"));
});

test("formatea el teléfono para mostrarlo", () => {
  assert.equal(formatearTelefono("573001234567"), "+57 300 123 4567");
  assert.equal(formatearTelefono("+57 300 123 4567"), "+57 300 123 4567");
  assert.equal(formatearTelefono("5215512345678"), "+5215512345678");
});
