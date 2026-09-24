"use client";

import Link from "next/link";
import { unidadesEnCarrito } from "@/lib/carrito";
import { useCarrito } from "./useCarrito";

export function BotonCarrito() {
  const { items } = useCarrito();
  const unidades = unidadesEnCarrito(items);
  return (
    <Link
      href="/carrito"
      className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-full"
      aria-label={unidades ? `Carrito, ${unidades} ${unidades === 1 ? "producto" : "productos"}` : "Carrito vacío"}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
        <circle cx="10" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
      </svg>
      {unidades > 0 && (
        <span className="absolute top-0.5 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-marca px-1 text-[11px] font-bold text-white">
          {unidades > 99 ? "99+" : unidades}
        </span>
      )}
    </Link>
  );
}
