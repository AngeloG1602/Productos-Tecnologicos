"use server";

import { revalidatePath } from "next/cache";
import { obtenerSocios, type SocioAdmin } from "@/lib/admin/datos";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type SocioEditable = { id: string | null; nombre: string; porcentaje: number; activo: boolean };
export type ResultadoGuardarSocios = { ok: true; socios: SocioAdmin[] } | { ok: false; error: string };

/**
 * Guarda la lista completa en una sola transacción (guardar_socios, migración 5)
 * y devuelve la lista ya guardada, con los ids de los socios nuevos.
 */
export async function guardarSocios(socios: SocioEditable[]): Promise<ResultadoGuardarSocios> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("guardar_socios", { p_socios: socios });
  if (error) {
    return {
      ok: false,
      error: ["22023", "P0002"].includes(error.code) ? error.message : "No pudimos guardar los socios. Inténtalo de nuevo.",
    };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, socios: await obtenerSocios() };
}
