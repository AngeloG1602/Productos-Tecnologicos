"use client";

import { useSyncExternalStore } from "react";

// Aviso breve en la parte baja de la pantalla ("Agregado al carrito").

export type Notificacion = { id: number; texto: string; conEnlaceCarrito: boolean } | null;

let actual: Notificacion = null;
let temporizador: ReturnType<typeof setTimeout> | undefined;
const suscriptores = new Set<() => void>();

function emitir(n: Notificacion) {
  actual = n;
  suscriptores.forEach((avisar) => avisar());
}

export function notificar(texto: string, conEnlaceCarrito = false) {
  clearTimeout(temporizador);
  emitir({ id: Date.now(), texto, conEnlaceCarrito });
  temporizador = setTimeout(() => emitir(null), 3000);
}

export function cerrarNotificacion() {
  clearTimeout(temporizador);
  emitir(null);
}

export function useNotificacion(): Notificacion {
  return useSyncExternalStore(
    (avisar) => {
      suscriptores.add(avisar);
      return () => suscriptores.delete(avisar);
    },
    () => actual,
    () => null,
  );
}
