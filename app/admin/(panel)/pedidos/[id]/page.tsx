import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesPedido } from "@/components/admin/AccionesPedido";
import { EtiquetaEstadoPedido } from "@/components/admin/EstadoPedido";
import { obtenerPedido } from "@/lib/admin/datos";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearCOP } from "@/lib/formato";
import { pedidoVencido } from "@/lib/pedido";

export const metadata: Metadata = { title: "Pedido", robots: { index: false } };

export default async function DetallePedido({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  const pedido = await obtenerPedido(id);
  if (!pedido) notFound();

  return (
    <div className="flex flex-col gap-5 pb-10">
      <Link href="/admin/pedidos" className="text-sm text-neutral-600 hover:underline">
        ← Pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{pedido.codigo}</h1>
        <EtiquetaEstadoPedido estado={pedido.estado} vencido={pedidoVencido(pedido, new Date())} />
      </div>

      <section className="rounded-xl border border-neutral-200 p-3 text-sm">
        <h2 className="mb-2 font-semibold">Cliente</h2>
        <p>{pedido.cliente_nombre}</p>
        <p className="text-neutral-600">{pedido.cliente_ciudad}</p>
        {pedido.notas && <p className="mt-2 rounded-lg bg-neutral-50 p-2 text-neutral-700">Notas: {pedido.notas}</p>}
        <p className="mt-2 text-xs text-neutral-500">
          El teléfono del cliente está en tu chat de WhatsApp (busca el código {pedido.codigo}).
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 text-sm">
        <h2 className="p-3 pb-0 font-semibold">Productos</h2>
        <ul className="divide-y divide-neutral-200">
          {pedido.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 p-3">
              <span>
                {item.cantidad} × {item.nombre_snapshot}
                <span className="block text-xs text-neutral-500">
                  {formatearCOP(item.precio_unitario)} c/u · costo {formatearCOP(item.costo_unitario)}
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatearCOP(item.precio_unitario * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-3 gap-2 border-t border-neutral-200 p-3 text-center">
          <div>
            <dt className="text-xs text-neutral-500">Venta</dt>
            <dd className="font-semibold">{formatearCOP(pedido.total_venta)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Costo</dt>
            <dd className="font-semibold">{formatearCOP(pedido.total_costo)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Ganancia</dt>
            <dd className="font-semibold text-green-700">{formatearCOP(pedido.ganancia)}</dd>
          </div>
        </dl>
      </section>

      {pedido.reparto.length > 0 && (
        <section className="rounded-xl border border-neutral-200 p-3 text-sm">
          <h2 className="mb-2 font-semibold">Reparto (congelado al confirmar)</h2>
          <ul className="flex flex-col gap-1">
            {pedido.reparto.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>
                  {r.socio_nombre} <span className="text-neutral-500">({Number(r.porcentaje)}%)</span>
                </span>
                <span className="font-medium">{formatearCOP(r.monto)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-1 text-xs text-neutral-500">
        <p>Creado: {formatearFechaHora(pedido.created_at)}</p>
        {pedido.confirmado_at && <p>Confirmado: {formatearFechaHora(pedido.confirmado_at)}</p>}
        {pedido.entregado_at && <p>Entregado: {formatearFechaHora(pedido.entregado_at)}</p>}
        {pedido.cancelado_at && <p>Cancelado: {formatearFechaHora(pedido.cancelado_at)}</p>}
      </section>

      <AccionesPedido id={pedido.id} codigo={pedido.codigo} estado={pedido.estado} />
    </div>
  );
}
