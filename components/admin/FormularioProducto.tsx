"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CategoriaAdmin, ProductoAdmin } from "@/lib/admin/datos";
import { formatearCOP } from "@/lib/formato";
import { margenReal, precioPorDebajoDelCosto, precioSugerido } from "@/lib/precio";
import { generarSlug } from "@/lib/slug";
import { BotonCopiarEnlace } from "@/components/admin/BotonCopiarEnlace";
import { SubidaImagenes } from "@/components/admin/SubidaImagenes";
import { duplicarProducto, eliminarProducto, guardarProducto } from "@/app/admin/(panel)/productos/acciones";

type Props = {
  categorias: CategoriaAdmin[];
  producto: ProductoAdmin | null;
  margenDefault: number;
  redondeo: number;
};

/** Entero no negativo desde un campo de texto, o null si está vacío/ inválido. */
function leerEntero(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === "") return null;
  const n = Number(limpio);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function FormularioProducto({ categorias, producto, margenDefault, redondeo }: Props) {
  const router = useRouter();
  const esNuevo = producto === null;
  // El id se genera ANTES de guardar: así las fotos se pueden subir mientras se llena el formulario.
  const [productoId] = useState(() => producto?.id ?? crypto.randomUUID());

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [slug, setSlug] = useState(producto?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(!esNuevo);
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [imagenes, setImagenes] = useState<string[]>(producto?.imagenes ?? []);
  const [costoTexto, setCostoTexto] = useState(producto?.costo != null ? String(producto.costo) : "");
  const [margenTexto, setMargenTexto] = useState(String(producto?.margen_pct ?? margenDefault));
  const [precioTexto, setPrecioTexto] = useState(producto ? String(producto.precio_venta) : "");
  const [precioTocado, setPrecioTocado] = useState(!esNuevo);
  const [precioAnteriorTexto, setPrecioAnteriorTexto] = useState(
    producto?.precio_anterior != null ? String(producto.precio_anterior) : "",
  );
  const [stockTexto, setStockTexto] = useState(producto ? String(producto.stock) : "0");
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);

  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciarGuardado] = useTransition();
  const [enAccion, iniciarAccion] = useTransition();

  const costo = leerEntero(costoTexto);
  const margenPct = margenTexto.trim() === "" ? null : Number(margenTexto);
  const precioVenta = leerEntero(precioTexto);
  const precioAnterior = leerEntero(precioAnteriorTexto);

  const sugerido = useMemo(
    () => (costo != null && margenPct != null && margenPct >= 0 ? precioSugerido(costo, margenPct, redondeo) : null),
    [costo, margenPct, redondeo],
  );

  function alCambiarNombre(valor: string) {
    setNombre(valor);
    if (!slugTocado) setSlug(generarSlug(valor));
  }

  const margenMostrado =
    precioTocado && costo != null && precioVenta != null ? margenReal(costo, precioVenta) : margenPct;
  const bajoCosto = costo != null && precioVenta != null && precioPorDebajoDelCosto(costo, precioVenta);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const slugFinal = generarSlug(slug || nombre);
    if (nombre.trim().length === 0) return setError("Escribe el nombre del producto.");
    if (costo === null) return setError("Escribe el costo (puede ser 0).");
    if (margenPct === null || margenPct < 0) return setError("Escribe el margen (%).");
    const precioFinal = precioVenta ?? sugerido;
    if (precioFinal === null) return setError("Escribe el precio de venta.");
    if (precioAnteriorTexto.trim() !== "" && (precioAnterior === null || precioAnterior <= precioFinal)) {
      return setError("El precio anterior debe ser mayor que el precio actual.");
    }
    const stock = leerEntero(stockTexto);
    if (stock === null) return setError("Escribe el stock (puede ser 0).");

    iniciarGuardado(async () => {
      const r = await guardarProducto({
        id: productoId,
        categoriaId: categoriaId || null,
        nombre: nombre.trim(),
        slug: slugFinal,
        descripcion,
        imagenes,
        costo,
        margenPct,
        precioVenta: precioFinal,
        precioAnterior: precioAnteriorTexto.trim() === "" ? null : precioAnterior,
        stock,
        activo,
        destacado,
      });
      if (r.ok) router.push("/admin/productos");
      else setError(r.error);
    });
  }

  function duplicar() {
    if (!producto) return;
    iniciarAccion(async () => {
      const r = await duplicarProducto(producto.id);
      if (r.ok) router.push(`/admin/productos/${r.id}`);
      else setError(r.error);
    });
  }

  function eliminar() {
    if (!producto) return;
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Los pedidos ya hechos no se ven afectados.`)) return;
    iniciarAccion(async () => {
      const r = await eliminarProducto(producto.id);
      if (r.ok) router.push("/admin/productos");
      else setError(r.error);
    });
  }

  const ocupado = guardando || enAccion;

  return (
    <form onSubmit={guardar} className="flex flex-col gap-5 pb-10">
      {producto && (
        <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 p-3">
          <BotonCopiarEnlace slug={producto.slug} />
          <p className="text-xs text-neutral-500">
            Para Instagram o Facebook: quien toca el anuncio llega a este producto con él ya en el carrito.
            {!producto.activo && " Actívalo antes de anunciarlo."}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Fotos (hasta 4)</span>
        <SubidaImagenes productoId={productoId} imagenes={imagenes} onCambiar={setImagenes} />
      </div>

      <Campo etiqueta="Nombre">
        <input
          value={nombre}
          onChange={(e) => alCambiarNombre(e.target.value)}
          required
          maxLength={120}
          className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
        />
      </Campo>

      <Campo etiqueta="Dirección (slug)" ayuda="Se usa en el enlace del producto. Se genera sola desde el nombre.">
        <input
          value={slug}
          onChange={(e) => {
            setSlugTocado(true);
            setSlug(e.target.value);
          }}
          onBlur={() => setSlug(generarSlug(slug || nombre))}
          className="h-11 rounded-xl border border-neutral-300 px-3 font-mono text-sm"
        />
      </Campo>

      <Campo etiqueta="Categoría">
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Descripción">
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-base"
        />
      </Campo>

      <div className="rounded-xl border border-neutral-200 p-3">
        <p className="mb-3 text-sm font-semibold">Costo y precio</p>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Costo (COP)">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={costoTexto}
              onChange={(e) => setCostoTexto(e.target.value)}
              required
              className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
            />
          </Campo>
          <Campo etiqueta="Margen (%)">
            <input
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              value={margenTexto}
              onChange={(e) => setMargenTexto(e.target.value)}
              className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
            />
          </Campo>
        </div>

        <Campo etiqueta="Precio de venta (COP)">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={precioTexto || (precioTocado ? "" : (sugerido ?? ""))}
            onChange={(e) => {
              setPrecioTocado(true);
              setPrecioTexto(e.target.value);
            }}
            className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
          />
        </Campo>
        {!precioTocado && sugerido != null && (
          <p className="mt-1 text-xs text-neutral-500">Precio sugerido: {formatearCOP(sugerido)}</p>
        )}
        {precioTocado && margenMostrado != null && (
          <p className={`mt-1 text-xs ${bajoCosto ? "font-semibold text-red-700" : "text-neutral-500"}`}>
            Margen real: {margenMostrado.toFixed(1)}%{bajoCosto && " — ⚠️ el precio quedó por debajo del costo"}
          </p>
        )}
        {precioTocado && (
          <button
            type="button"
            onClick={() => {
              setPrecioTocado(false);
              setPrecioTexto("");
            }}
            className="mt-1 text-xs text-marca underline"
          >
            Usar el precio sugerido
          </button>
        )}

        <div className="mt-3">
          <Campo etiqueta="Precio anterior (COP)" ayuda="Opcional. Solo si de verdad se vendía a ese precio antes: se muestra tachado en la tienda.">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={precioAnteriorTexto}
              onChange={(e) => setPrecioAnteriorTexto(e.target.value)}
              className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
            />
          </Campo>
        </div>
      </div>

      <Campo etiqueta="Stock">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={stockTexto}
          onChange={(e) => setStockTexto(e.target.value)}
          required
          className="h-11 w-32 rounded-xl border border-neutral-300 px-3 text-base"
        />
      </Campo>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 accent-marca" />
          Activo (se muestra en la tienda)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} className="h-4 w-4 accent-marca" />
          Destacado
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={ocupado}
          className="h-12 flex-1 rounded-xl bg-marca text-base font-semibold text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        {!esNuevo && (
          <>
            <button
              type="button"
              onClick={duplicar}
              disabled={ocupado}
              className="h-12 rounded-xl border border-neutral-300 px-4 text-sm font-medium"
            >
              Duplicar
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={ocupado}
              className="h-12 rounded-xl border border-red-300 px-4 text-sm font-medium text-red-700"
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-neutral-500">{ayuda}</span>}
    </label>
  );
}
