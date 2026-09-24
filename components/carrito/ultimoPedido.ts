"use client";

import { useSyncExternalStore } from "react";

// Recuerda el último pedido enviado durante la sesión del navegador, para que
// al volver desde WhatsApp (o si no se abrió) el cliente pueda abrirlo de nuevo.

const CLAVE = "tienda:ultimo-pedido";
const VIGENCIA_MS = 30 * 60 * 1000;
const suscriptores = new Set<() => void>();

export type UltimoPedido = { codigo: string; enlace: string };

export function guardarUltimoPedido(pedido: UltimoPedido) {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify({ ...pedido, en: Date.now() }));
  } catch {
    // sin almacenamiento: solo se pierde este atajo
  }
  suscriptores.forEach((avisar) => avisar());
}

export function olvidarUltimoPedido() {
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {}
  suscriptores.forEach((avisar) => avisar());
}

/** Devuelve el texto guardado si sigue vigente (el mismo string mientras no cambie). */
function leerCrudo(): string | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const { en } = JSON.parse(crudo) as { en?: unknown };
    return typeof en === "number" && Date.now() - en <= VIGENCIA_MS ? crudo : null;
  } catch {
    return null;
  }
}

export function useUltimoPedido(): UltimoPedido | null {
  const crudo = useSyncExternalStore(
    (avisar) => {
      suscriptores.add(avisar);
      return () => suscriptores.delete(avisar);
    },
    leerCrudo,
    () => null,
  );
  if (!crudo) return null;
  try {
    const datos = JSON.parse(crudo) as Partial<UltimoPedido>;
    if (typeof datos.codigo !== "string" || typeof datos.enlace !== "string") return null;
    if (!datos.enlace.startsWith("https://wa.me/")) return null;
    return { codigo: datos.codigo, enlace: datos.enlace };
  } catch {
    return null;
  }
}
