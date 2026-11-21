"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CategoriaAdmin, DistribuidorAdmin, ProductoAdmin } from "@/lib/admin/datos";
import { faltantes } from "@/lib/completitud";
import { formatearCOP } from "@/lib/formato";
import { margenReal, precioPorDebajoDelCosto } from "@/lib/precio";
import { coincideBusqueda } from "@/lib/texto";
import { BotonCopiarEnlace } from "@/components/admin/BotonCopiarEnlace";
import { ImagenProducto } from "@/components/tienda/ImagenProducto";
import {
  actualizarEnLote,
  actualizarStock,
  alternarActivo,
  duplicarProducto,
  eliminarProducto,
  type CambiosLote,
} from "@/app/admin/(panel)/productos/acciones";

type Props = { productos: ProductoAdmin[]; categorias: CategoriaAdmin[]; distribuidores: DistribuidorAdmin[] };

type Filtro = "todos" | "activos" | "inactivos" | "agotados" | "completar";

export function ListaProductos({ productos: iniciales, categorias, distribuidores }: Props) {
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
  const [distribuidorId, setDistribuidorId] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const router = useRouter();

  // Selección para cambios en lote
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [aplicando, iniciarLote] = useTransition();
  const [mensajeLote, setMensajeLote] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [categoriaLote, setCategoriaLote] = useState("");
  const [distribuidorLote, setDistribuidorLote] = useState("");

  const porCompletar = useMemo(() => productos.filter((p) => faltantes(p).length > 0).length, [productos]);

  const filtrados = useMemo(
    () =>
      productos
        .filter((p) => coincideBusqueda(p.nombre, busqueda))
        .filter((p) => !categoriaId || p.categoria_id === categoriaId)
        .filter((p) => !distribuidorId || p.distribuidor_id === distribuidorId)
        .filter((p) => {
          if (filtro === "activos") return p.activo;
          if (filtro === "inactivos") return !p.activo;
          if (filtro === "agotados") return p.stock <= 0;
          if (filtro === "completar") return faltantes(p).length > 0;
          return true;
        }),
    [productos, busqueda, categoriaId, distribuidorId, filtro],
  );

  const idsVisibles = filtrados.map((p) => p.id);
  const todosMarcados = idsVisibles.length > 0 && idsVisibles.every((id) => seleccion.has(id));

  function alternarSeleccion(id: string) {
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });
  }

  function alternarTodos() {
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (todosMarcados) idsVisibles.forEach((id) => nueva.delete(id));
      else idsVisibles.forEach((id) => nueva.add(id));
      return nueva;
    });
  }

  function aplicarLote(cambios: CambiosLote, descripcion: string) {
    const ids = [...seleccion];
    setMensajeLote(null);
    iniciarLote(async () => {
      const r = await actualizarEnLote(ids, cambios);
      if (!r.ok) {
        setMensajeLote({ tipo: "error", texto: r.error });
        return;
      }
      const hechos = new Set(r.actualizados);
      const categoria = cambios.categoriaId ? categorias.find((c) => c.id === cambios.categoriaId) : null;
      const distribuidor = cambios.distribuidorId ? distribuidores.find((d) => d.id === cambios.distribuidorId) : null;
      setProductos((ps) =>
        ps.map((p) => {
          if (!hechos.has(p.id)) return p;
          return {
            ...p,
            ...(cambios.activo !== undefined ? { activo: cambios.activo } : {}),
            ...(cambios.categoriaId !== undefined
              ? { categoria_id: cambios.categoriaId, categoria_nombre: categoria?.nombre ?? null }
              : {}),
            ...(cambios.distribuidorId !== undefined
              ? { distribuidor_id: cambios.distribuidorId, distribuidor_nombre: distribuidor?.nombre ?? null }
              : {}),
          };
        }),
      );
      const omitidos = r.omitidos.length;
      setMensajeLote({
        tipo: "ok",
        texto:
          `${descripcion}: ${r.actualizados.length} ${r.actualizados.length === 1 ? "producto" : "productos"}.` +
          (omitidos > 0
            ? ` ${omitidos} no se ${omitidos === 1 ? "activó" : "activaron"} porque ${omitidos === 1 ? "tiene" : "tienen"} precio $0: completa el precio primero.`
            : ""),
      });
      setSeleccion(new Set());
      setCategoriaLote("");
      setDistribuidorLote("");
      router.refresh();
    });
  }

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
        {distribuidores.length > 0 && (
          <select
            value={distribuidorId}
            onChange={(e) => setDistribuidorId(e.target.value)}
            className="h-11 rounded-xl border border-neutral-300 px-3 text-sm"
          >
            <option value="">Todos los distribuidores</option>
            {distribuidores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["todos", "activos", "agotados", "inactivos", "completar"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${
              filtro === f ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
            }`}
          >
            {
              {
                todos: "Todos",
                activos: "Activos",
                agotados: "Agotados",
                inactivos: "Inactivos",
                completar: `Por completar (${porCompletar})`,
              }[f]
            }
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-neutral-500">{filtrados.length} productos</p>
        {filtrados.length > 0 && (
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} className="h-4 w-4 accent-marca" />
            Seleccionar los {filtrados.length} visibles
          </label>
        )}
      </div>

      {mensajeLote && (
        <p
          role={mensajeLote.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${mensajeLote.tipo === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {mensajeLote.texto}
        </p>
      )}

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
              seleccionado={seleccion.has(producto.id)}
              onAlternarSeleccion={() => alternarSeleccion(producto.id)}
              onCambiar={(cambio) => setProductos((ps) => ps.map((p) => (p.id === producto.id ? { ...p, ...cambio } : p)))}
              onEliminar={() => setProductos((ps) => ps.filter((p) => p.id !== producto.id))}
            />
          ))}
        </ul>
      )}

      {seleccion.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-300 bg-white p-3 shadow-[0_-4px_16px_rgb(0_0_0/0.08)]">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2">
            <p className="mr-auto text-sm font-semibold">
              {seleccion.size} {seleccion.size === 1 ? "seleccionado" : "seleccionados"}
            </p>
            <button
              type="button"
              disabled={aplicando}
              onClick={() => aplicarLote({ activo: true }, "Activados")}
              className="rounded-lg bg-marca px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Activar
            </button>
            <button
              type="button"
              disabled={aplicando}
              onClick={() => aplicarLote({ activo: false }, "Desactivados")}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Desactivar
            </button>
            <select
              value={categoriaLote}
              disabled={aplicando}
              onChange={(e) => {
                const v = e.target.value;
                setCategoriaLote(v);
                if (v) aplicarLote({ categoriaId: v === "_ninguna" ? null : v }, "Categoría cambiada");
              }}
              className="h-10 rounded-lg border border-neutral-300 px-2 text-sm"
              aria-label="Cambiar categoría de los seleccionados"
            >
              <option value="">Cambiar categoría…</option>
              <option value="_ninguna">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {distribuidores.length > 0 && (
              <select
                value={distribuidorLote}
                disabled={aplicando}
                onChange={(e) => {
                  const v = e.target.value;
                  setDistribuidorLote(v);
                  if (v) aplicarLote({ distribuidorId: v === "_ninguno" ? null : v }, "Distribuidor cambiado");
                }}
                className="h-10 rounded-lg border border-neutral-300 px-2 text-sm"
                aria-label="Cambiar distribuidor de los seleccionados"
              >
                <option value="">Asignar distribuidor…</option>
                <option value="_ninguno">Sin distribuidor</option>
                {distribuidores.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => setSeleccion(new Set())} className="px-2 py-2 text-sm text-neutral-600 underline">
              Quitar selección
            </button>
          </div>
        </div>
      )}
      {seleccion.size > 0 && <div aria-hidden="true" className="h-28" />}
    </div>
  );
}

function FilaProducto({
  producto,
  seleccionado,
  onAlternarSeleccion,
  onCambiar,
  onEliminar,
}: {
  producto: ProductoAdmin;
  seleccionado: boolean;
  onAlternarSeleccion: () => void;
  onCambiar: (cambio: Partial<ProductoAdmin>) => void;
  onEliminar: () => void;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [stockTexto, setStockTexto] = useState(String(producto.stock));
  const [error, setError] = useState<string | null>(null);

  const pendientes = faltantes(producto);
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
      <div className="flex flex-1 items-center gap-3 sm:min-w-0">
      <input
        type="checkbox"
        checked={seleccionado}
        onChange={onAlternarSeleccion}
        aria-label={`Seleccionar ${producto.nombre}`}
        className="h-5 w-5 shrink-0 accent-marca"
      />
      <Link href={`/admin/productos/${producto.id}`} className="flex flex-1 items-center gap-3 sm:min-w-0">
        <div className="w-16 shrink-0 overflow-hidden rounded-lg">
          <ImagenProducto ruta={producto.imagenes[0]} alt="" sizes="64px" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{producto.nombre}</p>
          <p className="truncate text-xs text-neutral-500">
            {producto.categoria_nombre ?? "Sin categoría"}
            {producto.distribuidor_nombre && ` · ${producto.distribuidor_nombre}`}
          </p>
          {pendientes.length > 0 && (
            <p className="text-xs font-medium text-amber-800">Falta: {pendientes.join(", ")}</p>
          )}
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
      </div>

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
