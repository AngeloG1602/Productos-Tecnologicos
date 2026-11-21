"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { totalCarrito, unidadesEnCarrito } from "@/lib/carrito";
import { formatearCOP } from "@/lib/formato";
import { useCarrito } from "./useCarrito";

/**
 * Barra fija abajo con el total y el acceso al carrito, para que el cliente no tenga que subir
 * al encabezado. Deja libre la esquina derecha (botón de WhatsApp) y no sale en el carrito.
 */
export function BarraCarrito() {
  const { items } = useCarrito();
  const ruta = usePathname();
  const unidades = unidadesEnCarrito(items);
  if (unidades === 0 || ruta.startsWith("/carrito")) return null;

  return (
    <Link
      href="/carrito"
      className="aparece fixed bottom-4 left-4 z-30 flex h-14 items-center justify-between gap-3 rounded-2xl bg-marca px-4 text-sobre-marca shadow-xl ring-1 ring-black/10 active:scale-[0.99]"
      style={{ right: "5.5rem" }}
    >
      <span className="flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(255_255_255/0.18)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
            <circle cx="10" cy="20" r="1.3" />
            <circle cx="17" cy="20" r="1.3" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-acento px-1 text-[11px] font-bold text-sobre-acento">
            {unidades > 99 ? "99+" : unidades}
          </span>
        </span>
        <span className="text-sm leading-tight font-bold">Ver carrito</span>
      </span>
      <span className="text-base font-extrabold tracking-tight">{formatearCOP(totalCarrito(items))}</span>
    </Link>
  );
}
