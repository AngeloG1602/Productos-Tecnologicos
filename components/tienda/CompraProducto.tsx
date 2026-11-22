"use client";

import { useEffect, useState } from "react";
import { leerParametroAgregar } from "@/lib/anuncio";
import { topeUnidades, type ProductoParaCarrito } from "@/lib/carrito";
import { NOTA_BAJO_PEDIDO } from "@/lib/tienda";
import { notificar } from "@/components/carrito/notificacion";
import { useCarrito } from "@/components/carrito/useCarrito";
import { SelectorCantidad } from "./SelectorCantidad";

/** Selector de cantidad + "Agregar al carrito", sin pasar del stock (RN-04) ni del máximo de un bajo pedido. */
export function CompraProducto({ producto }: { producto: ProductoParaCarrito }) {
  const { items, agregar, agregarSiNoEsta } = useCarrito();
  const [cantidad, setCantidad] = useState(1);

  // Enlace de anuncio (/producto/<slug>?agregar=1): agrega el producto una sola vez
  // y quita el parámetro de la URL para que recargar no lo vuelva a agregar.
  useEffect(() => {
    const { agregar: desdeAnuncio, busquedaLimpia } = leerParametroAgregar(window.location.search);
    if (!desdeAnuncio) return;
    window.history.replaceState(null, "", `${window.location.pathname}${busquedaLimpia}${window.location.hash}`);
    if ((producto.stock > 0 || producto.bajoPedido) && agregarSiNoEsta(producto)) notificar("Agregado al carrito", true);
  }, [producto, agregarSiNoEsta]);

  const enCarrito = items.find((i) => i.productoId === producto.productoId)?.cantidad ?? 0;
  const disponible = Math.max(0, topeUnidades(producto) - enCarrito);

  if (producto.stock <= 0 && !producto.bajoPedido) {
    return (
      <button type="button" disabled className="h-12 w-full rounded-xl bg-borde text-base font-semibold text-suave">
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
          <span className="text-sm text-suave">Cantidad</span>
          <SelectorCantidad valor={Math.min(cantidad, disponible)} maximo={disponible} onCambiar={setCantidad} />
        </div>
      )}

      <button
        type="button"
        onClick={alAgregar}
        disabled={disponible === 0}
        className="h-13 w-full rounded-xl bg-marca text-base font-bold text-sobre-marca shadow-md transition-transform active:scale-[0.99] disabled:bg-borde disabled:text-suave disabled:shadow-none"
      >
        {disponible === 0 ? "Ya tienes todas las unidades disponibles" : "Agregar al carrito"}
      </button>

      {producto.bajoPedido && <p className="rounded-xl bg-marca-suave p-3 text-xs leading-snug">{NOTA_BAJO_PEDIDO}</p>}

      {enCarrito > 0 && (
        <p className="text-center text-sm text-suave">
          Tienes {enCarrito} en el carrito
        </p>
      )}
    </div>
  );
}
