"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PromocionPublica } from "@/lib/catalogo";
import { registrarEvento } from "@/lib/analitica";
import { ContenidoPromocion } from "./ContenidoPromocion";

const ESPERA_MS = 5000; // no aparece de golpe: el cliente primero ve la tienda
const SILENCIO_MS = 24 * 3600 * 1000; // tras cerrarla, no vuelve en 24 horas
const RUTAS_SIN_VENTANA = ["/carrito"]; // nunca interrumpe el armado del pedido

function clave(version: string) {
  return `promo-cerrada:${version}`;
}

function yaCerrada(version: string): boolean {
  try {
    const t = Number(window.localStorage.getItem(clave(version)));
    return Number.isFinite(t) && t > 0 && Date.now() - t < SILENCIO_MS;
  } catch {
    // Sin almacenamiento (modo privado): se muestra una vez por visita gracias al estado del componente.
    return false;
  }
}

function recordarCierre(version: string) {
  try {
    window.localStorage.setItem(clave(version), String(Date.now()));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/**
 * Ventana emergente de promoción (una por visita). Aparece a los 5 s, se cierra con la X,
 * "Ahora no", Escape o tocando fuera, y no vuelve en 24 h. No aparece en el carrito.
 */
export function PromoEmergente({ promo }: { promo: PromocionPublica }) {
  const ruta = usePathname();
  const [abierta, setAbierta] = useState(false);
  const [yaMostrada, setYaMostrada] = useState(false);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const permitida = !RUTAS_SIN_VENTANA.some((r) => ruta.startsWith(r));

  useEffect(() => {
    if (yaMostrada || !permitida || yaCerrada(promo.version)) return;
    const id = window.setTimeout(() => {
      setAbierta(true);
      setYaMostrada(true);
      registrarEvento("ver_promocion");
    }, ESPERA_MS);
    return () => window.clearTimeout(id);
  }, [promo.version, permitida, yaMostrada]);

  const cerrar = () => {
    setAbierta(false);
    recordarCierre(promo.version);
  };

  useEffect(() => {
    if (!abierta) return;
    botonCerrar.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierta(false);
        recordarCierre(promo.version);
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierta, promo.version]);

  if (!abierta || !permitida) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={promo.titulo ? "titulo-promocion" : undefined}
        aria-label={promo.titulo ? undefined : "Promoción"}
        className="aparece relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-superficie text-texto shadow-2xl"
      >
        <button
          ref={botonCerrar}
          type="button"
          onClick={cerrar}
          aria-label="Cerrar promoción"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-[#ffffff] backdrop-blur"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <ContenidoPromocion
          promo={promo}
          alAbrir={() => {
            registrarEvento("clic_promocion");
            cerrar();
          }}
          alRechazar={cerrar}
        />
      </div>
    </div>
  );
}
