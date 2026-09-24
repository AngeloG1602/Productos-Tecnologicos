import "server-only";
import { createClient } from "@supabase/supabase-js";
import { envPublico } from "@/lib/env";
import type { Database } from "@/lib/supabase/tipos";

/** Etiqueta de caché del catálogo. El admin la invalida con revalidateTag al editar (Bloque 4). */
export const ETIQUETA_CATALOGO = "catalogo";

/** Segundos que se reutiliza una respuesta del catálogo antes de volver a pedirla. */
export const REVALIDAR_CATALOGO_S = 60;

/**
 * Cliente de solo lectura para las páginas públicas: llave pública, sin sesión
 * ni cookies. Así las páginas se pueden cachear (ISR) y RLS limita lo visible.
 */
export function crearClientePublico() {
  const { url, llaveAnonima } = envPublico();
  return createClient<Database>(url, llaveAnonima, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (entrada, init) =>
        fetch(entrada, {
          ...init,
          next: { revalidate: REVALIDAR_CATALOGO_S, tags: [ETIQUETA_CATALOGO] },
        }),
    },
  });
}
