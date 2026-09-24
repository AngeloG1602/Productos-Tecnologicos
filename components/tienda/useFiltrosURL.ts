"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Los filtros del catálogo viven en la URL (?categoria=…&q=…): así se conservan
// al volver desde la ficha de un producto y se pueden compartir.
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

export function useFiltrosURL() {
  const query = useSyncExternalStore(suscribir, leerURL, leerURLServidor);

  const { categoria, busqueda } = useMemo(() => {
    const params = new URLSearchParams(query);
    return { categoria: params.get("categoria"), busqueda: params.get("q") ?? "" };
  }, [query]);

  const actualizar = useCallback((cambios: { categoria?: string | null; busqueda?: string }) => {
    const params = new URLSearchParams(window.location.search);
    if (cambios.categoria !== undefined) {
      if (cambios.categoria) params.set("categoria", cambios.categoria);
      else params.delete("categoria");
    }
    if (cambios.busqueda !== undefined) {
      if (cambios.busqueda) params.set("q", cambios.busqueda);
      else params.delete("q");
    }
    const nueva = params.toString();
    window.history.replaceState(null, "", nueva ? `?${nueva}` : window.location.pathname);
    suscriptores.forEach((avisar) => avisar());
  }, []);

  return { categoria, busqueda, actualizar };
}
