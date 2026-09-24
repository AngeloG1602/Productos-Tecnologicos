"use client";

import { useState } from "react";
import { enlaceAnuncio } from "@/lib/anuncio";

/**
 * Copia el enlace para anuncios de un producto: quien lo abre llega a la ficha
 * con el producto ya en el carrito.
 */
export function BotonCopiarEnlace({ slug, compacto = false }: { slug: string; compacto?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const enlace = enlaceAnuncio(window.location.origin, slug);
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: se muestra para copiarlo a mano.
      window.prompt("Copia este enlace para tu anuncio:", enlace);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={
        compacto
          ? "rounded-lg border border-neutral-300 px-2 py-1.5 text-xs font-medium"
          : "h-11 rounded-xl border border-neutral-300 px-4 text-sm font-medium"
      }
    >
      {copiado ? "¡Enlace copiado!" : compacto ? "Enlace anuncio" : "Copiar enlace para anuncio"}
    </button>
  );
}
