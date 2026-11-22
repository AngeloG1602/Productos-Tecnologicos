"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { registrarEvento } from "@/lib/analitica";

/**
 * Cuenta (de forma anónima) las visitas a la portada y los clics en enlaces de WhatsApp.
 * Las vistas de producto las registra la ficha (ver RegistrarVistaProducto).
 */
export function Analitica() {
  const ruta = usePathname();

  useEffect(() => {
    if (ruta === "/") registrarEvento("vista_inicio", undefined, true);
  }, [ruta]);

  useEffect(() => {
    const alHacerClic = (e: MouseEvent) => {
      const enlace = (e.target as Element | null)?.closest?.('a[href^="https://wa.me/"]');
      if (enlace) registrarEvento("clic_whatsapp");
    };
    document.addEventListener("click", alHacerClic);
    return () => document.removeEventListener("click", alHacerClic);
  }, []);

  return null;
}

/** Registra una vista de la ficha de un producto (una vez por visita). */
export function RegistrarVistaProducto({ productoId }: { productoId: string }) {
  useEffect(() => {
    registrarEvento("vista_producto", productoId, true);
  }, [productoId]);
  return null;
}
