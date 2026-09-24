import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaEstadoPedido } from "@/components/admin/EstadoPedido";
import { obtenerPedidos } from "@/lib/admin/datos";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearCOP } from "@/lib/formato";
import { DIAS_VENCIMIENTO, ESTADOS_PEDIDO, ETIQUETA_ESTADO, esEstadoPedido, pedidoVencido } from "@/lib/pedido";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false } };

export default async function PedidosAdmin({ searchParams }: PageProps<"/admin/pedidos">) {
  const { estado: estadoParam } = await searchParams;
  const estado = esEstadoPedido(estadoParam) ? estadoParam : undefined;
  const pedidos = await obtenerPedidos(estado);
  const ahora = new Date();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Pedidos</h1>

      <nav aria-label="Filtrar por estado" className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4">
        <Filtro href="/admin/pedidos" activo={!estado}>
          Todos
        </Filtro>
        {ESTADOS_PEDIDO.map((e) => (
          <Filtro key={e} href={`/admin/pedidos?estado=${e}`} activo={estado === e}>
            {ETIQUETA_ESTADO[e]}
          </Filtro>
        ))}
      </nav>

      {pedidos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-600">
          {estado ? `No hay pedidos en estado "${ETIQUETA_ESTADO[estado].toLowerCase()}".` : "Todavía no hay pedidos."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/pedidos/${p.id}`} className="flex items-start justify-between gap-3 p-3 hover:bg-neutral-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{p.codigo}</p>
                  <p className="truncate text-sm">{p.cliente_nombre}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {p.cliente_ciudad} · {formatearFechaHora(p.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold">{formatearCOP(p.total_venta)}</span>
                  <EtiquetaEstadoPedido estado={p.estado} vencido={pedidoVencido(p, ahora)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-neutral-500">
        &quot;Vencido&quot;: pendiente hace más de {DIAS_VENCIMIENTO} días. No se cancela solo; decide si lo confirmas o lo cancelas.
      </p>
    </div>
  );
}

function Filtro({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`h-9 shrink-0 rounded-full border px-4 text-sm leading-9 font-medium ${
        activo ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
      }`}
    >
      {children}
    </Link>
  );
}
