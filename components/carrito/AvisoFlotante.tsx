"use client";

import Link from "next/link";
import { cerrarNotificacion, useNotificacion } from "./notificacion";

export function AvisoFlotante() {
  const aviso = useNotificacion();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
      {aviso && (
        <div
          key={aviso.id}
          className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{aviso.texto}</span>
          {aviso.conEnlaceCarrito && (
            <Link href="/carrito" onClick={cerrarNotificacion} className="shrink-0 font-semibold text-sky-300">
              Ver carrito
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
