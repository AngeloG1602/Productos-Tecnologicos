"use client";

import { useState } from "react";
import type { ProductoParaCarrito } from "@/lib/carrito";
import { notificar } from "@/components/carrito/notificacion";
import { useCarrito } from "@/components/carrito/useCarrito";
import { SelectorCantidad } from "./SelectorCantidad";

/** Selector de cantidad + "Agregar al carrito", sin pasar del stock (RN-04). */
export function CompraProducto({ producto }: { producto: ProductoParaCarrito }) {
  const { items, agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);

  const enCarrito = items.find((i) => i.productoId === producto.productoId)?.cantidad ?? 0;
  const disponible = Math.max(0, producto.stock - enCarrito);

  if (producto.stock <= 0) {
    return (
      <button type="button" disabled className="h-12 w-full rounded-xl bg-neutral-200 text-base font-semibold text-neutral-500">
        Agotado
      </button>
    );
  }

  const alAgregar = () => {
    const agregadas = agregar(producto, Math.min(cantidad, disponible));
    if (agregadas > 0) {
      notificar(agregadas === 1 ? "Agregado al carrito" : `${agregadas} unidades agregadas al carrito`, true);
      setCantidad(1);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {disponible > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600">Cantidad</span>
          <SelectorCantidad valor={Math.min(cantidad, disponible)} maximo={disponible} onCambiar={setCantidad} />
        </div>
      )}

      <button
        type="button"
        onClick={alAgregar}
        disabled={disponible === 0}
        className="h-12 w-full rounded-xl bg-marca text-base font-semibold text-white active:opacity-90 disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {disponible === 0 ? "Ya tienes todas las unidades disponibles" : "Agregar al carrito"}
      </button>

      {enCarrito > 0 && (
        <p className="text-center text-sm text-neutral-600">
          Tienes {enCarrito} en el carrito
        </p>
      )}
    </div>
  );
}
