"use server";

import { revalidatePath, updateTag } from "next/cache";
import { ETIQUETA_CATALOGO } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

const MENSAJE_GENERICO = "No pudimos guardar el cambio. Inténtalo de nuevo.";

function actualizarCatalogoPublico() {
  updateTag(ETIQUETA_CATALOGO);
  revalidatePath("/admin/categorias");
}

export async function crearCategoria(nombre: string, slug: string): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { data: ultima } = await supabase.from("categorias").select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("categorias").insert({ nombre, slug, orden: (ultima?.orden ?? 0) + 1 });
  if (error) return { ok: false, error: error.code === "23505" ? "Ya existe una categoría con esa dirección." : MENSAJE_GENERICO };
  actualizarCatalogoPublico();
  return { ok: true };
}

export async function renombrarCategoria(id: string, nombre: string): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("categorias").update({ nombre }).eq("id", id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };
  actualizarCatalogoPublico();
  return { ok: true };
}

export async function eliminarCategoria(id: string): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };
  actualizarCatalogoPublico();
  return { ok: true };
}

/** Intercambia el orden con la categoría vecina (subir/bajar en la lista). */
export async function moverCategoria(id: string, direccion: "subir" | "bajar"): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { data: categorias, error: errorLista } = await supabase.from("categorias").select("id, orden").order("orden").order("nombre");
  if (errorLista || !categorias) return { ok: false, error: MENSAJE_GENERICO };

  const indice = categorias.findIndex((c) => c.id === id);
  if (indice === -1) return { ok: true };
  const actual = categorias[indice];
  const vecino = direccion === "subir" ? categorias[indice - 1] : categorias[indice + 1];
  if (!actual || !vecino) return { ok: true }; // ya está en el extremo, no hay nada que mover

  const { error } = await supabase.from("categorias").update({ orden: vecino.orden }).eq("id", actual.id);
  if (!error) await supabase.from("categorias").update({ orden: actual.orden }).eq("id", vecino.id);
  if (error) return { ok: false, error: MENSAJE_GENERICO };

  actualizarCatalogoPublico();
  return { ok: true };
}
