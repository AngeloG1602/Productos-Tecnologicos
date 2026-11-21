"use client";

import { useSyncExternalStore } from "react";

// Recuerda nombre y barrio en ESTE dispositivo (localStorage) para el siguiente pedido.
// No se envía a ningún servidor; las notas del pedido no se guardan.

const CLAVE = "tienda:datos-cliente";
const suscriptores = new Set<() => void>();

export type DatosCliente = { nombre: string; ciudad: string };

export function guardarDatosCliente(datos: DatosCliente) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({ nombre: datos.nombre.slice(0, 80), ciudad: datos.ciudad.slice(0, 120) }));
  } catch {
    // sin almacenamiento: solo se pierde la comodidad
  }
  suscriptores.forEach((avisar) => avisar());
}

export function olvidarDatosCliente() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {}
  suscriptores.forEach((avisar) => avisar());
}

function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

/** Datos guardados (o vacíos). Devuelve el mismo objeto mientras no cambien. */
export function useDatosCliente(): DatosCliente {
  const crudo = useSyncExternalStore(
    (avisar) => {
      suscriptores.add(avisar);
      return () => suscriptores.delete(avisar);
    },
    leerCrudo,
    () => null,
  );
  if (!crudo) return { nombre: "", ciudad: "" };
  try {
    const d = JSON.parse(crudo) as Partial<DatosCliente>;
    return { nombre: typeof d.nombre === "string" ? d.nombre : "", ciudad: typeof d.ciudad === "string" ? d.ciudad : "" };
  } catch {
    return { nombre: "", ciudad: "" };
  }
}
