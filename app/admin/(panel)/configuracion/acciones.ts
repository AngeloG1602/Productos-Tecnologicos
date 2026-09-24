"use server";

import { revalidatePath, updateTag } from "next/cache";
import { validarConfiguracion, type EntradaConfiguracion } from "@/lib/configuracion";
import { ETIQUETA_CATALOGO } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

export async function guardarConfiguracion(entrada: EntradaConfiguracion): Promise<ResultadoAccion> {
  // Se valida también en el servidor: el navegador no es de confianza.
  const r = validarConfiguracion(entrada);
  if (!r.ok) return r;

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("configuracion").update(r.valores).eq("id", 1).select("id");
  if (error || !data?.length) return { ok: false, error: "No pudimos guardar la configuración. Inténtalo de nuevo." };

  // El número de WhatsApp, el umbral y el texto de envío se ven en la tienda.
  updateTag(ETIQUETA_CATALOGO);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
