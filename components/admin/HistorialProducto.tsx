import type { CambioHistorial } from "@/lib/admin/datos";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearCOP } from "@/lib/formato";

const CAMPO: Record<string, string> = {
  precio_venta: "Precio",
  costo: "Costo",
  stock: "Stock",
  activo: "Estado",
  bajo_pedido: "Bajo pedido",
};

function valor(campo: string, v: string | null): string {
  if (v === null) return "—";
  if (campo === "precio_venta" || campo === "costo") return formatearCOP(Number(v));
  if (campo === "activo") return v === "true" ? "Activo" : "Inactivo";
  if (campo === "bajo_pedido") return v === "true" ? "Sí" : "No";
  return v;
}

/** Últimos cambios del producto: qué cambió, de cuánto a cuánto, cuándo y quién. */
export function HistorialProducto({ cambios }: { cambios: CambioHistorial[] }) {
  return (
    <details className="rounded-xl border border-neutral-200 p-3">
      <summary className="cursor-pointer text-sm font-semibold">Historial de cambios ({cambios.length})</summary>
      {cambios.length === 0 ? (
        <p className="pt-2 text-sm text-neutral-500">Todavía no hay cambios registrados.</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-neutral-200 text-sm">
          {cambios.map((c) => (
            <li key={c.id} className="flex flex-col gap-0.5 py-2">
              <span>
                <strong>{CAMPO[c.campo] ?? c.campo}:</strong> {valor(c.campo, c.anterior)} → {valor(c.campo, c.nuevo)}
              </span>
              <span className="text-xs text-neutral-500">
                {formatearFechaHora(c.created_at)}
                {c.quien ? ` · ${c.quien}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
