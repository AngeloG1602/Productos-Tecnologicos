"use server";

import { revalidatePath, updateTag } from "next/cache";
import { BUCKET_PRODUCTOS, MAXIMO_IMAGENES_PRODUCTO, rutaImagenProducto } from "@/lib/imagenes";
import { ETIQUETA_CATALOGO } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Database } from "@/lib/supabase/tipos";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };
export type ResultadoConId = { ok: true; id: string } | { ok: false; error: string };

const MENSAJE_GENERICO = "No pudimos guardar el cambio. Inténtalo de nuevo.";

function actualizarCatalogoPublico() {
  updateTag(ETIQUETA_CATALOGO);
  revalidatePath("/admin/productos");
}

export type DatosProducto = {
  id: string;
  categoriaId: string | null;
  nombre: string;
  slug: string;
  descripcion: string;
  imagenes: string[];
  costo: number;
  margenPct: number;
  precioVenta: number;
  precioAnterior: number | null;
  stock: number;
  activo: boolean;
  destacado: boolean;
  distribuidorId: string | null;
};

/** Crea o actualiza un producto (guardar_producto es una sola transacción, ver migración 4). */
export async function guardarProducto(datos: DatosProducto): Promise<ResultadoConId> {
  const supabase = await crearClienteServidor();
  const args: Database["public"]["Functions"]["guardar_producto"]["Args"] = {
    p_id: datos.id,
    p_categoria_id: datos.categoriaId,
    p_nombre: datos.nombre,
    p_slug: datos.slug,
    p_descripcion: datos.descripcion,
    p_imagenes: datos.imagenes,
    p_costo: datos.costo,
    p_margen_pct: datos.margenPct,
    p_precio_venta: datos.precioVenta,
    p_precio_anterior: datos.precioAnterior,
    p_stock: datos.stock,
    p_activo: datos.activo,
    p_destacado: datos.destacado,
    p_distribuidor_id: datos.distribuidorId,
  };
  const { data, error } = await supabase.rpc("guardar_producto", args);
  if (error) return { ok: false, error: error.code === "22023" ? error.message : MENSAJE_GENERICO };

  actualizarCatalogoPublico();
  if (datos.id) revalidatePath(`/producto/${datos.slug}`);
  return { ok: true, id: data };
}

export async function actualizarStock(id: string, stock: number): Promise<ResultadoAccion> {
  if (!Number.isInteger(stock) || stock < 0) return { ok: false, error: "El stock debe ser un número entero, 0 o más." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("productos").update({ stock }).eq("id", id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };
  actualizarCatalogoPublico();
  return { ok: true };
}

export async function alternarActivo(id: string, activo: boolean): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("productos").update({ activo }).eq("id", id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };
  actualizarCatalogoPublico();
  return { ok: true };
}

export async function duplicarProducto(id: string): Promise<ResultadoConId> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("duplicar_producto", { p_producto_id: id });
  if (error) return { ok: false, error: MENSAJE_GENERICO };
  revalidatePath("/admin/productos");
  return { ok: true, id: data };
}

export async function eliminarProducto(id: string): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();

  // Primero las imágenes del bucket (borrar la fila del producto no borra los archivos).
  const rutas = Array.from({ length: MAXIMO_IMAGENES_PRODUCTO }, (_, i) => rutaImagenProducto(id, i + 1));
  await supabase.storage.from(BUCKET_PRODUCTOS).remove(rutas);

  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };

  actualizarCatalogoPublico();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Cambios en lote (varios productos a la vez)
// ─────────────────────────────────────────────────────────────

export type CambiosLote = {
  activo?: boolean;
  /** uuid de la categoría, o null para dejarlos sin categoría. */
  categoriaId?: string | null;
  /** uuid del distribuidor, o null para quitarlo. */
  distribuidorId?: string | null;
};

export type ResultadoLote =
  | { ok: true; actualizados: string[]; omitidos: string[] }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAXIMO_LOTE = 300;

/**
 * Aplica el mismo cambio a varios productos. Al ACTIVAR, los productos con precio 0 se omiten
 * (no se publican a $0): se devuelven en "omitidos" para avisar al admin.
 */
export async function actualizarEnLote(ids: string[], cambios: CambiosLote): Promise<ResultadoLote> {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: "No hay productos seleccionados." };
  if (ids.length > MAXIMO_LOTE) return { ok: false, error: `Máximo ${MAXIMO_LOTE} productos por vez.` };
  if (!ids.every((id) => typeof id === "string" && UUID.test(id))) return { ok: false, error: "Selección inválida." };
  for (const v of [cambios.categoriaId, cambios.distribuidorId]) {
    if (typeof v === "string" && !UUID.test(v)) return { ok: false, error: "Selección inválida." };
  }

  const supabase = await crearClienteServidor();
  let activables = ids;
  let omitidos: string[] = [];

  if (cambios.activo === true) {
    const { data, error } = await supabase.from("productos").select("id, precio_venta").in("id", ids);
    if (error) return { ok: false, error: MENSAJE_GENERICO };
    activables = data.filter((p) => p.precio_venta > 0).map((p) => p.id);
    omitidos = data.filter((p) => p.precio_venta <= 0).map((p) => p.id);
  }

  if (cambios.activo !== undefined && activables.length > 0) {
    const { error } = await supabase.from("productos").update({ activo: cambios.activo }).in("id", activables);
    if (error) return { ok: false, error: MENSAJE_GENERICO };
  }
  if (cambios.categoriaId !== undefined) {
    const { error } = await supabase.from("productos").update({ categoria_id: cambios.categoriaId }).in("id", ids);
    if (error) return { ok: false, error: MENSAJE_GENERICO };
  }
  if (cambios.distribuidorId !== undefined) {
    const { error } = await supabase.from("producto_costos").update({ distribuidor_id: cambios.distribuidorId }).in("producto_id", ids);
    if (error) return { ok: false, error: MENSAJE_GENERICO };
  }

  actualizarCatalogoPublico();
  // La pantalla envía un tipo de cambio por vez: al activar, solo se actualizaron los "activables".
  return { ok: true, actualizados: cambios.activo !== undefined ? activables : ids, omitidos };
}
