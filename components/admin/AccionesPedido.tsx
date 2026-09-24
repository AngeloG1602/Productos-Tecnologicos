"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EstadoPedido } from "@/lib/pedido";
import { cancelarPedido, confirmarPedido, entregarPedido } from "@/app/admin/(panel)/pedidos/acciones";

type Props = { id: string; codigo: string; estado: EstadoPedido };

/** Botones según el estado (RN-05): pendiente → confirmar/cancelar; confirmado → entregar/cancelar. */
export function AccionesPedido({ id, codigo, estado }: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (estado === "entregado" || estado === "cancelado") {
    return <p className="text-sm text-neutral-500">Este pedido está cerrado; ya no cambia de estado.</p>;
  }

  function ejecutar(accion: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>, confirmacion?: string) {
    if (confirmacion && !window.confirm(confirmacion)) return;
    setError(null);
    iniciar(async () => {
      const r = await accion(id);
      if (r.ok) router.refresh();
      else setError(r.error);
    });
  }

  return (
    <section className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {estado === "pendiente" && (
        <>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => ejecutar(confirmarPedido)}
            className="h-12 rounded-xl bg-marca text-base font-semibold text-white disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : "Confirmar venta (descuenta stock)"}
          </button>
          <p className="text-xs text-neutral-500">Confírmalo cuando ya acordaste la venta con el cliente por WhatsApp.</p>
        </>
      )}
      {estado === "confirmado" && (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => ejecutar(entregarPedido)}
          className="h-12 rounded-xl bg-green-700 text-base font-semibold text-white disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Marcar como entregado y pagado"}
        </button>
      )}
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          ejecutar(
            cancelarPedido,
            estado === "confirmado"
              ? `¿Cancelar ${codigo}? El stock de sus productos se devuelve.`
              : `¿Cancelar ${codigo}?`,
          )
        }
        className="h-11 rounded-xl border border-red-300 text-sm font-medium text-red-700 disabled:opacity-60"
      >
        Cancelar pedido
      </button>
    </section>
  );
}
