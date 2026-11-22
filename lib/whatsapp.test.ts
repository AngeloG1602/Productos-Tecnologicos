import { test } from "node:test";
import assert from "node:assert/strict";
import {
  textoPago,
  enlaceCompartirWhatsApp,
  enlaceWhatsApp,
  formatearTelefono,
  mensajeCompartirProducto,
  mensajeConsultaProducto,
  mensajePedido,
  normalizarNumero,
} from "./whatsapp.ts";

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
      "Pago: contra entrega",
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
  assert.ok(n(mensaje).endsWith("Ciudad/Barrio: Cali\nPago: contra entrega"));
});

test("formatea el teléfono para mostrarlo", () => {
  assert.equal(formatearTelefono("573001234567"), "+57 300 123 4567");
  assert.equal(formatearTelefono("+57 300 123 4567"), "+57 300 123 4567");
  assert.equal(formatearTelefono("5215512345678"), "+5215512345678");
});

test("consulta y compartir de un producto llevan nombre y enlace", () => {
  assert.equal(
    mensajeConsultaProducto("Cargador 20W", "https://t.co/producto/c"),
    "¡Hola! Me interesa este producto: Cargador 20W\nhttps://t.co/producto/c",
  );
  const compartir = mensajeCompartirProducto("Cargador 20W", 42000, "https://t.co/producto/c");
  assert.match(compartir, /Cargador 20W/);
  assert.match(compartir, /42\.000/);
  assert.match(compartir, /https:\/\/t\.co\/producto\/c$/);
  assert.equal(enlaceCompartirWhatsApp("Hola & chao"), "https://wa.me/?text=Hola%20%26%20chao");
});

test("pago contra entrega, salvo productos bajo pedido", () => {
  assert.equal(textoPago([{}, { bajoPedido: false }]), "Pago: contra entrega");
  assert.match(textoPago([{ bajoPedido: true }]), /lo acordamos por este medio.*anticipo/);
  assert.match(textoPago([{ bajoPedido: true }, {}]), /contra entrega.*bajo pedido.*anticipo/);
  const m = mensajePedido({
    codigo: "PED-9",
    items: [{ nombre: "Encargo", cantidad: 1, subtotal: 50000, bajoPedido: true }],
    total: 50000,
    cliente: { nombre: "Ana", ciudad: "Ocaña" },
  });
  assert.match(m, /• 1 x Encargo \(bajo pedido\) — /);
  assert.match(m, /Pago: lo acordamos por este medio/);
});
