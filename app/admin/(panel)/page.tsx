import type { Metadata } from "next";
import Link from "next/link";
import { obtenerConfiguracionAdmin, obtenerProductosAdmin, obtenerResumenVentas } from "@/lib/admin/datos";
import { esFechaValida, fechaLocal, rangoMesActual } from "@/lib/fechas";
import { formatearCOP } from "@/lib/formato";
import { datosLegalesFaltantes } from "@/lib/legal";

export const metadata: Metadata = { title: "Inicio", robots: { index: false } };

function rangoDesdeUrl(params: Record<string, string | string[] | undefined>, ahora: Date) {
  const porDefecto = rangoMesActual(ahora);
  const desde = esFechaValida(params.desde) ? params.desde : porDefecto.desde;
  const hasta = esFechaValida(params.hasta) ? params.hasta : porDefecto.hasta;
  return desde <= hasta ? { desde, hasta } : porDefecto;
}

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const ahora = new Date();
  const { desde, hasta } = rangoDesdeUrl(await searchParams, ahora);
  const hoy = fechaLocal(ahora);
  const haceSeisDias = fechaLocal(new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [resumen, configuracion, productos] = await Promise.all([
    obtenerResumenVentas(desde, hasta),
    obtenerConfiguracionAdmin(),
    obtenerProductosAdmin(),
  ]);
  const stockBajo = productos
    .filter((p) => p.activo && p.stock <= configuracion.umbral_stock_bajo)
    .sort((a, b) => a.stock - b.stock);
  const faltanLegales = datosLegalesFaltantes(configuracion);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Inicio</h1>

      {(resumen.pendientes > 0 || stockBajo.length > 0 || faltanLegales.length > 0) && (
        <section aria-labelledby="titulo-alertas" className="flex flex-col gap-2">
          <h2 id="titulo-alertas" className="sr-only">
            Alertas
          </h2>
          {resumen.pendientes > 0 && (
            <Link
              href="/admin/pedidos?estado=pendiente"
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <span>
                <strong>
                  {resumen.pendientes} {resumen.pendientes === 1 ? "pedido pendiente" : "pedidos pendientes"}
                </strong>
                {resumen.vencidos > 0 && ` · ${resumen.vencidos} con más de 7 días`}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
          {faltanLegales.length > 0 && (
            <Link
              href="/admin/configuracion#datos-legales"
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <span>
                <strong>Completa los datos legales de la tienda</strong> · falta: {faltanLegales.join(", ")}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
          {stockBajo.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold">
                Stock bajo ({stockBajo.length}) — umbral: {configuracion.umbral_stock_bajo}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {stockBajo.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <Link href={`/admin/productos/${p.id}`} className="truncate underline">
                      {p.nombre}
                    </Link>
                    <span className="shrink-0 font-medium">{p.stock === 0 ? "Agotado" : `${p.stock} und.`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="titulo-ventas" className="flex flex-col gap-3">
        <h2 id="titulo-ventas" className="text-base font-semibold">
          Ventas
        </h2>
        <form className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Desde
            <input type="date" name="desde" defaultValue={desde} max={hoy} className="h-10 rounded-lg border border-neutral-300 px-2" />
          </label>
          <label className="flex flex-col gap-1">
            Hasta
            <input type="date" name="hasta" defaultValue={hasta} max={hoy} className="h-10 rounded-lg border border-neutral-300 px-2" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-neutral-900 px-4 font-medium text-white">
            Ver
          </button>
        </form>
        <div className="flex flex-wrap gap-2 text-xs">
          <AtajoRango desde={hoy} hasta={hoy} actual={{ desde, hasta }}>
            Hoy
          </AtajoRango>
          <AtajoRango desde={haceSeisDias} hasta={hoy} actual={{ desde, hasta }}>
            Últimos 7 días
          </AtajoRango>
          <AtajoRango desde={rangoMesActual(ahora).desde} hasta={hoy} actual={{ desde, hasta }}>
            Este mes
          </AtajoRango>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Cifra etiqueta="Ventas" valor={formatearCOP(resumen.ventas)} />
          <Cifra etiqueta="Ganancia" valor={formatearCOP(resumen.ganancia)} destacada />
          <Cifra etiqueta="Costo" valor={formatearCOP(resumen.costo)} />
          <Cifra etiqueta="Pedidos vendidos" valor={String(resumen.pedidos)} />
        </dl>
        <p className="text-xs text-neutral-500">
          Cuentan los pedidos confirmados o entregados, según la fecha en que se confirmaron (hora de Colombia).
        </p>
      </section>

      <section aria-labelledby="titulo-reparto" className="flex flex-col gap-3">
        <h2 id="titulo-reparto" className="text-base font-semibold">
          Reparto de la ganancia
        </h2>
        {resumen.reparto.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay ventas confirmadas en estas fechas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
            {resumen.reparto.map((r) => (
              <li key={r.socio} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>{r.socio}</span>
                <span className="font-semibold">{formatearCOP(r.monto)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-neutral-500">
          Cada pedido guarda el porcentaje de cada socio del día en que se confirmó: si los cambias en{" "}
          <Link href="/admin/socios" className="underline">
            Socios
          </Link>
          , los pedidos anteriores no cambian.
        </p>
      </section>
    </div>
  );
}

function Cifra({ etiqueta, valor, destacada = false }: { etiqueta: string; valor: string; destacada?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${destacada ? "border-green-200 bg-green-50" : "border-neutral-200"}`}>
      <dt className="text-xs text-neutral-500">{etiqueta}</dt>
      <dd className="mt-1 text-lg font-bold">{valor}</dd>
    </div>
  );
}

function AtajoRango({
  desde,
  hasta,
  actual,
  children,
}: {
  desde: string;
  hasta: string;
  actual: { desde: string; hasta: string };
  children: React.ReactNode;
}) {
  const activo = actual.desde === desde && actual.hasta === hasta;
  return (
    <Link
      href={`/admin?desde=${desde}&hasta=${hasta}`}
      aria-current={activo ? "true" : undefined}
      className={`rounded-full border px-3 py-1 font-medium ${
        activo ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
      }`}
    >
      {children}
    </Link>
  );
}
