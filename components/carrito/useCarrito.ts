"use client";

import { useSyncExternalStore } from "react";
import {
  agregarAlCarrito,
  cambiarCantidad,
  leerCarritoGuardado,
  quitarDelCarrito,
  type ItemCarrito,
  type ProductoParaCarrito,
} from "@/lib/carrito";

// Carrito en el navegador (RF-05): se guarda en localStorage y se comparte
// entre pestañas. En el servidor siempre está vacío.

const CLAVE = "tienda:carrito:v1";
const VACIO: ItemCarrito[] = [];

let items: ItemCarrito[] = VACIO;
let cargado = false;
const suscriptores = new Set<() => void>();

function cargar() {
  if (cargado) return;
  cargado = true;
  try {
    items = leerCarritoGuardado(window.localStorage.getItem(CLAVE));
  } catch {
    items = VACIO; // localStorage bloqueado (modo privado, etc.): carrito solo en memoria
  }
}

function guardar(nuevos: ItemCarrito[]) {
  items = nuevos;
  try {
    if (nuevos.length) window.localStorage.setItem(CLAVE, JSON.stringify(nuevos));
    else window.localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento: sigue funcionando en memoria
  }
  suscriptores.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  const alCambiarOtraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    cargado = false;
    cargar();
    avisar();
  };
  suscriptores.add(avisar);
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    suscriptores.delete(avisar);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

function leer() {
  cargar();
  return items;
}

const acciones = {
  /** Devuelve cuántas unidades se agregaron de verdad (0 si ya estaba en el tope de stock). */
  agregar(producto: ProductoParaCarrito, cantidad: number): number {
    cargar();
    const r = agregarAlCarrito(items, producto, cantidad);
    if (r.agregadas > 0) guardar(r.items);
    return r.agregadas;
  },
  /** Para los enlaces de anuncios: agrega 1 unidad solo si el producto aún no está en el carrito. */
  agregarSiNoEsta(producto: ProductoParaCarrito): boolean {
    cargar();
    if (items.some((i) => i.productoId === producto.productoId)) return false;
    const r = agregarAlCarrito(items, producto, 1);
    if (r.agregadas > 0) guardar(r.items);
    return r.agregadas > 0;
  },
  cambiarCantidad(productoId: string, cantidad: number) {
    cargar();
    guardar(cambiarCantidad(items, productoId, cantidad));
  },
  quitar(productoId: string) {
    cargar();
    guardar(quitarDelCarrito(items, productoId));
  },
  reemplazar(nuevos: ItemCarrito[]) {
    guardar(nuevos);
  },
  vaciar() {
    guardar(VACIO);
  },
};

export function useCarrito() {
  const actuales = useSyncExternalStore(suscribir, leer, () => VACIO);
  return { items: actuales, ...acciones };
}
