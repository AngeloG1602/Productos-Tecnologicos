"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CategoriaAdmin, ProductoAdmin } from "@/lib/admin/datos";
import { formatearCOP } from "@/lib/formato";
import { margenReal, precioPorDebajoDelCosto } from "@/lib/precio";
import { coincideBusqueda } from "@/lib/texto";
import { BotonCopiarEnlace } from "@/components/admin/BotonCopiarEnlace";
import { ImagenProducto } from "@/components/tienda/ImagenProducto";
import { actualizarStock, alternarActivo, duplicarProducto, eliminarProducto } from "@/app/admin/(panel)/productos/acciones";

type Props = { productos: ProductoAdmin[]; categorias: CategoriaAdmin[] };

type Filtro = "todos" | "activos" | "inactivos" | "agotados";

export function ListaProductos({ productos: iniciales, categorias }: Props) {
  const [productos, setProductos] = useState(iniciales);
  // router.refresh() le pasa a este componente ya montado un arreglo nuevo de props;
  // como no hay remount, hay que ajustar el estado durante el render (patrón de React
  // para "derivar estado de props que cambian", en vez de un useEffect con setState).
  const [inicialesPrevios, setInicialesPrevios] = useState(iniciales);
  if (iniciales !== inicialesPrevios) {
    setInicialesPrevios(iniciales);
    setProductos(iniciales);
  }
  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = useMemo(
    () =>
      productos
        .filter((p) => coincideBusqueda(p.nombre, busqueda))
        .filter((p) => !categoriaId || p.categoria_id === categoriaId)
        .filter((p) => {
          if (filtro === "activos") return p.activo;
          if (filtro === "inactivos") return !p.activo;
          if (filtro === "agotados") return p.stock <= 0;
          return true;
        }),
    [productos, busqueda, categoriaId, filtro],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          placeholder="Buscar productos"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-neutral-300 px-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
        />
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="h-11 rounded-xl border border-neutral-300 px-3 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["todos", "activos", "agotados", "inactivos"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${
              filtro === f ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
            }`}
          >
            {{ todos: "Todos", activos: "Activos", agotados: "Agotados", inactivos: "Inactivos" }[f]}
          </button>
        ))}
      </div>

      <p className="text-sm text-neutral-500">{filtrados.length} productos</p>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-600">
          No hay productos con esos filtros.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {filtrados.map((producto) => (
            <FilaProducto
              key={producto.id}
              producto={producto}
              onCambiar={(cambio) => setProductos((ps) => ps.map((p) => (p.id === producto.id ? { ...p, ...cambio } : p)))}
              onEliminar={() => setProductos((ps) => ps.filter((p) => p.id !== producto.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaProducto({
  producto,
  onCambiar,
  onEliminar,
}: {
  producto: ProductoAdmin;
  onCambiar: (cambio: Partial<ProductoAdmin>) => void;
  onEliminar: () => void;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [stockTexto, setStockTexto] = useState(String(producto.stock));
  const [error, setError] = useState<string | null>(null);

  const margen = producto.costo != null ? margenReal(producto.costo, producto.precio_venta) : null;
  const bajoCosto = producto.costo != null && precioPorDebajoDelCosto(producto.costo, producto.precio_venta);

  function guardarStock() {
    const valor = Number(stockTexto);
    setError(null);
    if (!Number.isInteger(valor) || valor < 0) {
      setError("Debe ser un número entero, 0 o más.");
      setStockTexto(String(producto.stock));
      return;
    }
    if (valor === producto.stock) return;
    iniciarTransicion(async () => {
      const r = await actualizarStock(producto.id, valor);
      if (r.ok) {
        onCambiar({ stock: valor });
        router.refresh();
      } else {
        setError(r.error);
        setStockTexto(String(producto.stock));
      }
    });
  }

  function cambiarActivo(activo: boolean) {
    iniciarTransicion(async () => {
      const r = await alternarActivo(producto.id, activo);
      if (r.ok) {
        onCambiar({ activo });
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function duplicar() {
    iniciarTransicion(async () => {
      const r = await duplicarProducto(producto.id);
      if (r.ok) router.push(`/admin/productos/${r.id}`);
      else setError(r.error);
    });
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Los pedidos ya hechos no se ven afectados.`)) return;
    iniciarTransicion(async () => {
      const r = await eliminarProducto(producto.id);
      if (r.ok) {
        onEliminar();
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <Link href={`/admin/productos/${producto.id}`} className="flex flex-1 items-center gap-3 sm:min-w-0">
        <div className="w-16 shrink-0 overflow-hidden rounded-lg">
          <ImagenProducto ruta={producto.imagenes[0]} alt="" sizes="64px" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{producto.nombre}</p>
          <p className="truncate text-xs text-neutral-500">{producto.categoria_nombre ?? "Sin categoría"}</p>
          <p className="text-sm">
            {formatearCOP(producto.precio_venta)}{" "}
            {margen != null && (
              <span className={bajoCosto ? "font-semibold text-red-700" : "text-neutral-500"}>
                · margen {margen.toFixed(0)}%{bajoCosto && " ⚠️ bajo costo"}
              </span>
            )}
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <label className="flex items-center gap-1 text-sm">
          Stock
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={stockTexto}
            disabled={pendiente}
            onChange={(e) => setStockTexto(e.target.value)}
            onBlur={guardarStock}
            className="h-9 w-16 rounded-lg border border-neutral-300 px-2 text-center"
          />
        </label>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={producto.activo}
            disabled={pendiente}
            onChange={(e) => cambiarActivo(e.target.checked)}
            className="h-4 w-4 accent-marca"
          />
          Activo
        </label>

        <BotonCopiarEnlace slug={producto.slug} compacto />
        <button type="button" onClick={duplicar} disabled={pendiente} className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs font-medium">
          Duplicar
        </button>
        <button
          type="button"
          onClick={eliminar}
          disabled={pendiente}
          className="rounded-lg border border-red-300 px-2 py-1.5 text-xs font-medium text-red-700"
        >
          Eliminar
        </button>
      </div>

      {error && (
        <p role="alert" className="w-full text-xs text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}
