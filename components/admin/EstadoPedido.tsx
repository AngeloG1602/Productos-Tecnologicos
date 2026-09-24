import { ETIQUETA_ESTADO, type EstadoPedido } from "@/lib/pedido";

const COLORES: Record<EstadoPedido, string> = {
  pendiente: "bg-amber-50 text-amber-800",
  confirmado: "bg-blue-50 text-blue-800",
  entregado: "bg-green-50 text-green-800",
  cancelado: "bg-neutral-100 text-neutral-600",
};

export function EtiquetaEstadoPedido({ estado, vencido = false }: { estado: EstadoPedido; vencido?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLORES[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>
      {vencido && <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Vencido</span>}
    </span>
  );
}
