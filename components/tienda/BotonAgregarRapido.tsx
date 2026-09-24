"use client";

import type { ProductoParaCarrito } from "@/lib/carrito";
import { notificar } from "@/components/carrito/notificacion";
import { useCarrito } from "@/components/carrito/useCarrito";

/** Botón "+" sobre la tarjeta: agrega 1 unidad sin entrar a la ficha. */
export function BotonAgregarRapido({ producto }: { producto: ProductoParaCarrito }) {
  const { agregar } = useCarrito();
  return (
    <button
      type="button"
      aria-label={`Agregar ${producto.nombre} al carrito`}
      onClick={() => {
        const agregadas = agregar(producto, 1);
        notificar(agregadas ? "Agregado al carrito" : "Ya tienes todas las unidades disponibles", agregadas > 0);
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-marca text-white shadow-md active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
