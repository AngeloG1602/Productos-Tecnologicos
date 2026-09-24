"use client";

import { useState } from "react";

/**
 * Selector de cantidad (limitado al stock, RN-04) y botón "Agregar".
 * El carrito se conecta en el Bloque 3; por ahora el botón está deshabilitado.
 */
export function CompraProducto({ stock }: { stock: number }) {
  const [cantidad, setCantidad] = useState(1);
  const agotado = stock <= 0;

  if (agotado) {
    return (
      <button
        type="button"
        disabled
        className="h-12 w-full rounded-xl bg-neutral-200 text-base font-semibold text-neutral-500"
      >
        Agotado
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span id="etiqueta-cantidad" className="text-sm text-neutral-600">
          Cantidad
        </span>
        <div className="flex items-center rounded-xl border border-neutral-300" role="group" aria-labelledby="etiqueta-cantidad">
          <BotonCantidad
            etiqueta="Quitar una unidad"
            disabled={cantidad <= 1}
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
          >
            −
          </BotonCantidad>
          <output className="w-10 text-center text-base font-semibold" aria-live="polite">
            {cantidad}
          </output>
          <BotonCantidad
            etiqueta="Agregar una unidad"
            disabled={cantidad >= stock}
            onClick={() => setCantidad((c) => Math.min(stock, c + 1))}
          >
            +
          </BotonCantidad>
        </div>
      </div>

      <button
        type="button"
        disabled
        title="Disponible muy pronto"
        className="h-12 w-full rounded-xl bg-marca text-base font-semibold text-white disabled:opacity-50"
      >
        Agregar al carrito
      </button>
    </div>
  );
}

function BotonCantidad({
  etiqueta,
  disabled,
  onClick,
  children,
}: {
  etiqueta: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={disabled}
      onClick={onClick}
      className="h-11 w-11 text-xl text-neutral-800 disabled:text-neutral-300"
    >
      {children}
    </button>
  );
}
