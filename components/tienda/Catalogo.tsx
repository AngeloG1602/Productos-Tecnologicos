"use client";

import { useMemo, useState } from "react";
import type { Categoria, ProductoResumen } from "@/lib/catalogo";
import { formatearCOP } from "@/lib/formato";
import { filtrarPorPrecio, ORDENES, ordenarProductos, RANGOS_PRECIO, type Orden } from "@/lib/orden";
import type { Tema } from "@/lib/temas";
import { coincideBusqueda } from "@/lib/texto";
import { IconoCategoria } from "./IconoCategoria";
import { IconoTema } from "./IconoTema";
import { TarjetaProducto } from "./TarjetaProducto";
import { useFiltrosURL } from "./useFiltrosURL";

type Props = {
  categorias: Categoria[];
  productos: ProductoResumen[];
  umbral: number;
  tema: Tema;
};

/**
 * Catálogo con categorías, buscador, orden y filtro de precio. El catálogo es pequeño
 * (< 100 productos), así que se filtra en el navegador: respuesta instantánea en 4G.
 */
export function Catalogo({ categorias, productos, umbral, tema }: Props) {
  const { categoria, busqueda, orden, min, max, actualizar } = useFiltrosURL();
  const [panelPrecio, setPanelPrecio] = useState(false);

  // Solo categorías que tienen productos a la venta
  const categoriasVisibles = useMemo(() => {
    const conProductos = new Set(productos.map((p) => p.categoria_id));
    return categorias.filter((c) => conProductos.has(c.id));
  }, [categorias, productos]);

  const categoriaActual = categoriasVisibles.find((c) => c.slug === categoria) ?? null;
  const hayPrecio = min !== null || max !== null;

  const filtrados = useMemo(() => {
    const base = productos
      .filter((p) => !categoriaActual || p.categoria_id === categoriaActual.id)
      .filter((p) => coincideBusqueda(p.nombre, busqueda));
    return ordenarProductos(filtrarPorPrecio(base, min, max), orden);
  }, [productos, categoriaActual, busqueda, min, max, orden]);

  const sinFiltros = !categoriaActual && !busqueda.trim() && !hayPrecio;
  const destacados = sinFiltros ? productos.filter((p) => p.destacado && p.stock > 0) : [];
  const limpiar = () => actualizar({ categoria: null, busqueda: "", min: null, max: null, orden: "relevancia" });

  return (
    <div className="flex flex-col gap-6">
      <div id="catalogo" className="flex scroll-mt-20 flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-suave"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="¿Qué estás buscando?"
            value={busqueda}
            onChange={(e) => actualizar({ busqueda: e.target.value })}
            className="h-12 w-full rounded-2xl border border-borde bg-superficie pr-4 pl-11 text-base text-texto shadow-sm outline-none placeholder:text-suave focus:border-marca focus:ring-2 focus:ring-marca/25"
          />
        </label>

        {categoriasVisibles.length > 0 && (
          <div className="sin-barra -mx-4 flex gap-3 overflow-x-auto px-4 pb-1" role="group" aria-label="Categorías">
            <TarjetaCategoria activa={!categoriaActual} onClick={() => actualizar({ categoria: null })} etiqueta="Todo">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
              </svg>
            </TarjetaCategoria>
            {categoriasVisibles.map((c) => (
              <TarjetaCategoria
                key={c.id}
                activa={categoriaActual?.id === c.id}
                onClick={() => actualizar({ categoria: c.slug })}
                etiqueta={c.nombre}
              >
                <IconoCategoria slug={c.slug} className="h-6 w-6" />
              </TarjetaCategoria>
            ))}
          </div>
        )}
      </div>

      {destacados.length > 0 && (
        <section aria-labelledby="titulo-destacados" className="flex flex-col gap-3">
          <h2 id="titulo-destacados" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            {tema.categoria !== "clasico" ? (
              <IconoTema nombre={tema.icono} className="h-5 w-5" style={{ color: tema.marca }} />
            ) : (
              <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-acento" />
            )}
            Destacados
          </h2>
          <div className="sin-barra -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-1 pb-3">
            {destacados.map((p, i) => (
              <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
                <TarjetaProducto producto={p} umbral={umbral} tema={tema} sizes="192px" preload={i < 2} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-productos" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 id="titulo-productos" className="text-lg font-extrabold tracking-tight">
            {categoriaActual ? categoriaActual.nombre : "Todos los productos"}
            <span className="ml-2 text-sm font-medium text-suave">({filtrados.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={panelPrecio}
              aria-controls="panel-precio"
              onClick={() => setPanelPrecio((v) => !v)}
              className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                hayPrecio || panelPrecio ? "border-marca bg-marca text-sobre-marca" : "border-borde bg-superficie"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Precio
            </button>
            <label className="relative">
              <span className="sr-only">Ordenar por</span>
              <select
                value={orden}
                onChange={(e) => actualizar({ orden: e.target.value as Orden })}
                className="h-10 appearance-none rounded-xl border border-borde bg-superficie py-0 pr-8 pl-3 text-sm font-semibold text-texto outline-none focus:border-marca"
              >
                {ORDENES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-suave" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </label>
          </div>
        </div>

        {panelPrecio && (
          <div id="panel-precio" className="aparece flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-3.5">
            <div className="flex flex-wrap gap-2">
              {RANGOS_PRECIO.map((r) => {
                const activo = min === r.min && max === r.max;
                return (
                  <button
                    key={r.etiqueta}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => actualizar(activo ? { min: null, max: null } : { min: r.min, max: r.max })}
                    className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                      activo ? "border-marca bg-marca text-sobre-marca" : "border-borde"
                    }`}
                  >
                    {r.etiqueta}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <CampoPrecio etiqueta="Mínimo" valor={min} onCambio={(v) => actualizar({ min: v })} />
              <span className="text-suave" aria-hidden="true">–</span>
              <CampoPrecio etiqueta="Máximo" valor={max} onCambio={(v) => actualizar({ max: v })} />
              {hayPrecio && (
                <button type="button" onClick={() => actualizar({ min: null, max: null })} className="ml-auto text-sm font-semibold text-acento underline">
                  Quitar
                </button>
              )}
            </div>
          </div>
        )}

        {hayPrecio && !panelPrecio && (
          <p className="text-sm text-suave">
            Precio {min !== null && `desde ${formatearCOP(min)}`}
            {min !== null && max !== null && " "}
            {max !== null && `hasta ${formatearCOP(max)}`}
          </p>
        )}

        {filtrados.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => (
              <li key={p.id} className="flex">
                <TarjetaProducto producto={p} umbral={umbral} tema={tema} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-borde px-4 py-12 text-center">
            <p className="text-sm text-suave">
              {productos.length === 0
                ? "Pronto tendremos productos disponibles."
                : "No encontramos productos con esos filtros."}
            </p>
            {!sinFiltros && (
              <button type="button" onClick={limpiar} className="rounded-xl bg-marca px-4 py-2.5 text-sm font-bold text-sobre-marca">
                Ver todos los productos
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function CampoPrecio({ etiqueta, valor, onCambio }: { etiqueta: string; valor: number | null; onCambio: (v: number | null) => void }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-suave">
      {etiqueta}
      <input
        type="text"
        inputMode="numeric"
        placeholder="$ 0"
        value={valor === null ? "" : String(valor)}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
          onCambio(digitos ? Number(digitos) : null);
        }}
        className="h-10 w-full rounded-xl border border-borde bg-fondo px-3 text-base text-texto outline-none focus:border-marca"
      />
    </label>
  );
}

function TarjetaCategoria({
  activa,
  onClick,
  etiqueta,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 text-center"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all group-active:scale-95 ${
          activa ? "border-marca bg-marca text-sobre-marca shadow-md" : "border-borde bg-superficie text-marca"
        }`}
      >
        {children}
      </span>
      <span className={`line-clamp-2 text-[11px] leading-tight font-semibold ${activa ? "text-texto" : "text-suave"}`}>{etiqueta}</span>
    </button>
  );
}
