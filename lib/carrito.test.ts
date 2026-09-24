import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agregarAlCarrito,
  aplicarRevision,
  cambiarCantidad,
  describirCambio,
  leerCarritoGuardado,
  quitarDelCarrito,
  totalCarrito,
  unidadesEnCarrito,
  type ItemCarrito,
} from "./carrito.ts";
import type { CambioPedido } from "./pedido.ts";

const cable = { productoId: "a", slug: "cable", nombre: "Cable", precio: 5600, imagen: null, stock: 3 };
const parlante = { productoId: "b", slug: "parlante", nombre: "Parlante", precio: 53200, imagen: "b/1.webp", stock: 10 };
const n = (t: string) => t.replace(/ /g, " ");

test("agregar suma unidades sin pasar el stock", () => {
  let r = agregarAlCarrito([], cable, 2);
  assert.equal(r.agregadas, 2);
  r = agregarAlCarrito(r.items, cable, 5);
  assert.equal(r.agregadas, 1);
  assert.equal(r.items[0]?.cantidad, 3);
  const otra = agregarAlCarrito(r.items, cable, 1);
  assert.equal(otra.agregadas, 0);
  assert.equal(otra.items, r.items);
});

test("no se puede agregar un producto agotado", () => {
  assert.equal(agregarAlCarrito([], { ...cable, stock: 0 }, 1).agregadas, 0);
});

test("cambiar cantidad queda entre 1 y el stock; quitar elimina", () => {
  const { items } = agregarAlCarrito([], cable, 1);
  assert.equal(cambiarCantidad(items, "a", 10)[0]?.cantidad, 3);
  assert.equal(cambiarCantidad(items, "a", 0)[0]?.cantidad, 1);
  assert.deepEqual(quitarDelCarrito(items, "a"), []);
});

test("totales", () => {
  let items = agregarAlCarrito([], cable, 2).items;
  items = agregarAlCarrito(items, parlante, 1).items;
  assert.equal(totalCarrito(items), 2 * 5600 + 53200);
  assert.equal(unidadesEnCarrito(items), 3);
});

test("aplicar la revisión de la BD ajusta cantidades, precios y quita lo no disponible", () => {
  const items: ItemCarrito[] = [
    { ...cable, cantidad: 3 },
    { ...parlante, cantidad: 1 },
  ];
  const cambios: CambioPedido[] = [
    { producto_id: "a", nombre: "Cable", tipo: "stock", cantidad_solicitada: 3, cantidad: 2, precio_anterior: 5600, precio_actual: 5600 },
    { producto_id: "b", nombre: "Parlante", tipo: "no_disponible", cantidad_solicitada: 1, cantidad: 0, precio_anterior: 53200, precio_actual: 53200 },
  ];
  const revisado = aplicarRevision(
    items,
    [{ producto_id: "a", nombre: "Cable 1 m", cantidad: 2, precio_unitario: 5900, subtotal: 11800 }],
    cambios,
  );
  assert.deepEqual(revisado, [{ ...cable, nombre: "Cable 1 m", precio: 5900, cantidad: 2, stock: 2 }]);
});

test("describir cambios en español", () => {
  const base = { producto_id: "a", nombre: "Cable", cantidad_solicitada: 3, precio_anterior: 5000, precio_actual: 5600 };
  assert.equal(describirCambio({ ...base, tipo: "stock", cantidad: 1 }), '"Cable": solo queda 1 unidad, ajustamos la cantidad.');
  assert.equal(describirCambio({ ...base, tipo: "stock", cantidad: 2 }), '"Cable": solo quedan 2 unidades, ajustamos la cantidad.');
  assert.equal(n(describirCambio({ ...base, tipo: "precio", cantidad: 3 })), '"Cable" cambió de precio: ahora $ 5.600 (antes $ 5.000).');
  assert.equal(
    describirCambio({ ...base, nombre: null, tipo: "no_disponible", cantidad: 0 }, "Hub"),
    '"Hub" ya no está disponible y lo quitamos del carrito.',
  );
});

test("leer carrito guardado descarta datos corruptos", () => {
  assert.deepEqual(leerCarritoGuardado(null), []);
  assert.deepEqual(leerCarritoGuardado("{no es json"), []);
  assert.deepEqual(leerCarritoGuardado('{"a":1}'), []);
  const bueno = { ...cable, cantidad: 2 };
  assert.deepEqual(leerCarritoGuardado(JSON.stringify([bueno, { productoId: 1 }, { ...bueno, cantidad: 0 }])), [bueno]);
});
