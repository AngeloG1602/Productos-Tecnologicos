"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };
export type ResultadoConId = { ok: true; id: string } | { ok: false; error: string };

const MENSAJE_GENERICO = "No pudimos guardar el cambio. Inténtalo de nuevo.";
const MENSAJE_REPETIDO = "Ya existe un distribuidor con ese nombre.";

/**
 * Crea un distribuidor, o reutiliza el que ya exista con ese nombre (sin
 * distinguir mayúsculas ni espacios de más). Así el "+ Agregar otro" del
 * formulario de producto nunca choca con uno que ya estaba creado.
 */
export async function crearOBuscarDistribuidor(nombre: string): Promise<ResultadoConId> {
  const limpio = nombre.trim();
  if (limpio.length < 1 || limpio.length > 80) {
    return { ok: false, error: "El nombre del distribuidor debe tener entre 1 y 80 caracteres." };
  }
  const supabase = await crearClienteServidor();

  const { data: existente, error: errorBusqueda } = await supabase
    .from("distribuidores")
    .select("id")
    .ilike("nombre", limpio)
    .maybeSingle();
  if (errorBusqueda) return { ok: false, error: MENSAJE_GENERICO };
  if (existente) return { ok: true, id: existente.id };

  const { data, error } = await supabase.from("distribuidores").insert({ nombre: limpio }).select("id").single();
  if (error) {
    // Alguien más lo creó justo entre la búsqueda y el insert: se reutiliza igual.
    if (error.code === "23505") {
      const { data: otraVez } = await supabase.from("distribuidores").select("id").ilike("nombre", limpio).maybeSingle();
      if (otraVez) return { ok: true, id: otraVez.id };
      return { ok: false, error: MENSAJE_REPETIDO };
    }
    return { ok: false, error: MENSAJE_GENERICO };
  }
  revalidatePath("/admin/distribuidores");
  return { ok: true, id: data.id };
}

export async function renombrarDistribuidor(id: string, nombre: string): Promise<ResultadoAccion> {
  const limpio = nombre.trim();
  if (limpio.length < 1 || limpio.length > 80) {
    return { ok: false, error: "El nombre del distribuidor debe tener entre 1 y 80 caracteres." };
  }
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("distribuidores").update({ nombre: limpio }).eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? MENSAJE_REPETIDO : MENSAJE_GENERICO };
  revalidatePath("/admin/distribuidores");
  revalidatePath("/admin/productos");
  return { ok: true };
}

/** Borrar un distribuidor no borra sus productos: solo quedan sin distribuidor asignado. */
export async function eliminarDistribuidor(id: string): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("distribuidores").delete().eq("id", id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };
  revalidatePath("/admin/distribuidores");
  revalidatePath("/admin/productos");
  return { ok: true };
}
