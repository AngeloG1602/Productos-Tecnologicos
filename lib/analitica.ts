"use client";

import { crearClienteNavegador } from "@/lib/supabase/navegador";

// Métricas de uso sin datos personales: cada evento suma 1 a un contador por día (ver la función
// registrar_evento en la base). No se guarda IP, dispositivo, cookies ni identificadores.
// Nunca debe estorbar la tienda: todo es "dispara y olvida" y los errores se ignoran.

export type TipoEvento =
  | "vista_inicio"
  | "vista_producto"
  | "agregar_carrito"
  | "clic_whatsapp"
  | "ver_promocion"
  | "clic_promocion";

const CLAVE_SESION = "tienda:eventos-vistos";

function esNavegadorReal(): boolean {
  // Solo en producción (no ensuciar las cifras al desarrollar) y no en navegadores automatizados.
  return process.env.NODE_ENV === "production" && typeof navigator !== "undefined" && !navigator.webdriver;
}

function yaRegistradoEnSesion(clave: string): boolean {
  try {
    const vistos = new Set<string>(JSON.parse(window.sessionStorage.getItem(CLAVE_SESION) ?? "[]"));
    if (vistos.has(clave)) return true;
    vistos.add(clave);
    window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify([...vistos].slice(-200)));
    return false;
  } catch {
    return false; // sin almacenamiento: se cuenta igual
  }
}

/**
 * Registra un evento. Con `unaVezPorSesion`, el mismo evento (y producto) cuenta una sola vez por
 * visita: así "visitas" y "productos vistos" no se inflan al recargar o volver atrás.
 */
export function registrarEvento(tipo: TipoEvento, productoId?: string, unaVezPorSesion = false): void {
  if (!esNavegadorReal()) return;
  if (unaVezPorSesion && yaRegistradoEnSesion(`${tipo}:${productoId ?? ""}`)) return;
  try {
    void Promise.resolve(crearClienteNavegador().rpc("registrar_evento", { p_tipo: tipo, p_producto: productoId ?? null })).catch(() => {});
  } catch {
    // una métrica nunca debe romper la página
  }
}
