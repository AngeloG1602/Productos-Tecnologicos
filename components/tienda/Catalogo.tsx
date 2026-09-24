"use client";

import { useMemo } from "react";
import type { Categoria, ProductoResumen } from "@/lib/catalogo";
import { coincideBusqueda } from "@/lib/texto";
import { TarjetaProducto } from "./TarjetaProducto";
import { useFiltrosURL } from "./useFiltrosURL";

type Props = {
  categorias: Categoria[];
  productos: ProductoResumen[];
  umbral: number;
};

/**
 * Catálogo con chips de categoría y buscador. El catálogo es pequeño (< 50
 * productos), así que se filtra en el navegador: respuesta instantánea en 4G.
 */
export function Catalogo({ categorias, productos, umbral }: Props) {
  const { categoria, busqueda, actualizar } = useFiltrosURL();

  // Solo categorías que tienen productos a la venta
  const categoriasVisibles = useMemo(() => {
    const conProductos = new Set(productos.map((p) => p.categoria_id));
    return categorias.filter((c) => conProductos.has(c.id));
  }, [categorias, productos]);

  const categoriaActual = categoriasVisibles.find((c) => c.slug === categoria) ?? null;

  const filtrados = useMemo(
    () =>
      productos
        .filter((p) => !categoriaActual || p.categoria_id === categoriaActual.id)
        .filter((p) => coincideBusqueda(p.nombre, busqueda))
        // Presentación: los agotados al final
        .sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0)),
    [productos, categoriaActual, busqueda],
  );

  const sinFiltros = !categoriaActual && !busqueda.trim();
  const destacados = sinFiltros ? productos.filter((p) => p.destacado && p.stock > 0) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400"
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
            placeholder="Buscar productos"
            value={busqueda}
            onChange={(e) => actualizar({ busqueda: e.target.value })}
            className="h-11 w-full rounded-xl border border-neutral-300 bg-white pr-3 pl-10 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
          />
        </label>

        {categoriasVisibles.length > 0 && (
          <div className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Categorías">
            <Chip activo={!categoriaActual} onClick={() => actualizar({ categoria: null })}>
              Todos
            </Chip>
            {categoriasVisibles.map((c) => (
              <Chip
                key={c.id}
                activo={categoriaActual?.id === c.id}
                onClick={() => actualizar({ categoria: c.slug })}
              >
                {c.nombre}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {destacados.length > 0 && (
        <section aria-labelledby="titulo-destacados" className="flex flex-col gap-3">
          <h2 id="titulo-destacados" className="text-base font-semibold">
            Destacados
          </h2>
          <div className="sin-barra -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
            {destacados.map((p, i) => (
              <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
                <TarjetaProducto producto={p} umbral={umbral} sizes="192px" preload={i < 2} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-productos" className="flex flex-col gap-3">
        <h2 id="titulo-productos" className="text-base font-semibold">
          {categoriaActual ? categoriaActual.nombre : "Todos los productos"}
          <span className="ml-2 text-sm font-normal text-neutral-500">({filtrados.length})</span>
        </h2>

        {filtrados.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => (
              <li key={p.id} className="flex">
                <TarjetaProducto producto={p} umbral={umbral} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center">
            <p className="text-sm text-neutral-600">
              {productos.length === 0
                ? "Pronto tendremos productos disponibles."
                : "No encontramos productos con esos filtros."}
            </p>
            {!sinFiltros && (
              <button
                type="button"
                onClick={() => actualizar({ categoria: null, busqueda: "" })}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors ${
        activo
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 bg-white text-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}
