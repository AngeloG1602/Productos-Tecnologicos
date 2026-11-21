"use server";

import { revalidatePath, updateTag } from "next/cache";
import { validarPromocion, type EntradaPromocion } from "@/lib/promocion";
import { ETIQUETA_CATALOGO } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

export async function guardarPromocion(entrada: EntradaPromocion): Promise<ResultadoAccion> {
  // Se valida también en el servidor: el navegador no es de confianza.
  const r = validarPromocion(entrada);
  if (!r.ok) return r;

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("promocion").update(r.valores).eq("id", 1).select("id");
  if (error || !data?.length) return { ok: false, error: "No pudimos guardar la promoción. Inténtalo de nuevo." };

  // Se muestra en toda la tienda pública.
  updateTag(ETIQUETA_CATALOGO);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
