"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { esOrden, leerMonto, type Orden } from "@/lib/orden";

// Los filtros del catálogo viven en la URL (?categoria=…&q=…&orden=…&min=…&max=…): así se
// conservan al volver desde la ficha de un producto y se pueden compartir.
// Se actualizan con history.replaceState (sin ir al servidor) y se avisa a los
// componentes suscritos.

const suscriptores = new Set<() => void>();

function suscribir(avisar: () => void) {
  suscriptores.add(avisar);
  window.addEventListener("popstate", avisar);
  return () => {
    suscriptores.delete(avisar);
    window.removeEventListener("popstate", avisar);
  };
}

const leerURL = () => window.location.search;
const leerURLServidor = () => "";

export type Cambios = {
  categoria?: string | null;
  busqueda?: string;
  orden?: Orden;
  min?: number | null;
  max?: number | null;
};

function poner(params: URLSearchParams, clave: string, valor: string | null) {
  if (valor) params.set(clave, valor);
  else params.delete(clave);
}

export function useFiltrosURL() {
  const query = useSyncExternalStore(suscribir, leerURL, leerURLServidor);

  const filtros = useMemo(() => {
    const params = new URLSearchParams(query);
    const orden = params.get("orden");
    return {
      categoria: params.get("categoria"),
      busqueda: params.get("q") ?? "",
      orden: esOrden(orden) ? orden : ("relevancia" as Orden),
      min: leerMonto(params.get("min")),
      max: leerMonto(params.get("max")),
    };
  }, [query]);

  const actualizar = useCallback((cambios: Cambios) => {
    const params = new URLSearchParams(window.location.search);
    if (cambios.categoria !== undefined) poner(params, "categoria", cambios.categoria);
    if (cambios.busqueda !== undefined) poner(params, "q", cambios.busqueda);
    if (cambios.orden !== undefined) poner(params, "orden", cambios.orden === "relevancia" ? null : cambios.orden);
    if (cambios.min !== undefined) poner(params, "min", cambios.min === null ? null : String(cambios.min));
    if (cambios.max !== undefined) poner(params, "max", cambios.max === null ? null : String(cambios.max));
    const nueva = params.toString();
    window.history.replaceState(null, "", nueva ? `?${nueva}` : window.location.pathname);
    suscriptores.forEach((avisar) => avisar());
  }, []);

  return { ...filtros, actualizar };
}
