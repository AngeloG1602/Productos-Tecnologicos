import { formatearCOP } from "./formato.ts";
import type { CambioPedido, ItemPedido } from "./pedido.ts";

export type ItemCarrito = {
  productoId: string;
  slug: string;
  nombre: string;
  /** Precio que vio el cliente. Solo informativo: la BD recalcula todo al enviar. */
  precio: number;
  imagen: string | null;
  cantidad: number;
  /** Stock conocido al agregar; limita la cantidad (RN-04). La BD lo revalida al enviar. */
  stock: number;
};

export type ProductoParaCarrito = Omit<ItemCarrito, "cantidad">;

/** Tope de unidades por producto que acepta crear_pedido. */
export const MAXIMO_POR_PRODUCTO = 999;

const tope = (stock: number) => Math.max(0, Math.min(stock, MAXIMO_POR_PRODUCTO));

/**
 * Agrega unidades sin superar el stock. Devuelve el carrito nuevo y cuántas
 * unidades se agregaron de verdad (0 si ya estaba en el tope).
 */
export function agregarAlCarrito(
  items: ItemCarrito[],
  producto: ProductoParaCarrito,
  cantidad: number,
): { items: ItemCarrito[]; agregadas: number } {
  const existente = items.find((i) => i.productoId === producto.productoId);
  const actual = existente?.cantidad ?? 0;
  const nueva = Math.min(actual + Math.max(0, Math.floor(cantidad)), tope(producto.stock));
  const agregadas = Math.max(0, nueva - actual);
  if (agregadas === 0) return { items, agregadas: 0 };

  const item: ItemCarrito = { ...producto, cantidad: nueva };
  return {
    items: existente
      ? items.map((i) => (i.productoId === producto.productoId ? item : i))
      : [...items, item],
    agregadas,
  };
}

/** Cambia la cantidad (entre 1 y el stock). */
export function cambiarCantidad(items: ItemCarrito[], productoId: string, cantidad: number): ItemCarrito[] {
  return items.map((i) =>
    i.productoId === productoId
      ? { ...i, cantidad: Math.max(1, Math.min(Math.floor(cantidad), tope(i.stock))) }
      : i,
  );
}

export function quitarDelCarrito(items: ItemCarrito[], productoId: string): ItemCarrito[] {
  return items.filter((i) => i.productoId !== productoId);
}

export function totalCarrito(items: ItemCarrito[]): number {
  return items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
}

export function unidadesEnCarrito(items: ItemCarrito[]): number {
  return items.reduce((suma, i) => suma + i.cantidad, 0);
}

/**
 * Ajusta el carrito con la revisión de la BD (RN-04): quita lo que ya no está
 * disponible, baja cantidades al stock real y actualiza precios y nombres.
 */
export function aplicarRevision(
  items: ItemCarrito[],
  revisados: ItemPedido[],
  cambios: CambioPedido[],
): ItemCarrito[] {
  return items.flatMap((item) => {
    const revisado = revisados.find((r) => r.producto_id === item.productoId);
    if (!revisado || revisado.cantidad <= 0) return [];
    const cambioStock = cambios.find((c) => c.producto_id === item.productoId && c.tipo === "stock");
    return [
      {
        ...item,
        nombre: revisado.nombre,
        precio: revisado.precio_unitario,
        cantidad: revisado.cantidad,
        stock: cambioStock ? cambioStock.cantidad : item.stock,
      },
    ];
  });
}

/** Texto para avisarle al cliente qué cambió. */
export function describirCambio(cambio: CambioPedido, nombreRespaldo = "Un producto"): string {
  const nombre = cambio.nombre ?? nombreRespaldo;
  switch (cambio.tipo) {
    case "no_disponible":
      return `"${nombre}" ya no está disponible y lo quitamos del carrito.`;
    case "stock":
      return cambio.cantidad === 1
        ? `"${nombre}": solo queda 1 unidad, ajustamos la cantidad.`
        : `"${nombre}": solo quedan ${cambio.cantidad} unidades, ajustamos la cantidad.`;
    case "precio":
      return cambio.precio_anterior !== null && cambio.precio_actual !== null
        ? `"${nombre}" cambió de precio: ahora ${formatearCOP(cambio.precio_actual)} (antes ${formatearCOP(cambio.precio_anterior)}).`
        : `"${nombre}" cambió de precio.`;
  }
}

/** Lee el carrito guardado en localStorage, descartando lo que no tenga la forma esperada. */
export function leerCarritoGuardado(texto: string | null): ItemCarrito[] {
  if (!texto) return [];
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return [];
  }
  if (!Array.isArray(datos)) return [];
  return datos.filter(
    (i): i is ItemCarrito =>
      typeof i === "object" &&
      i !== null &&
      typeof i.productoId === "string" &&
      typeof i.slug === "string" &&
      typeof i.nombre === "string" &&
      Number.isInteger(i.precio) &&
      (i.imagen === null || typeof i.imagen === "string") &&
      Number.isInteger(i.cantidad) &&
      i.cantidad > 0 &&
      Number.isInteger(i.stock),
  );
}
