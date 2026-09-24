import { createBrowserClient } from "@supabase/ssr";
import { envPublico } from "@/lib/env";
import type { Database } from "@/lib/supabase/tipos";

/** Cliente de Supabase para componentes de cliente. Usa solo la llave pública. */
export function crearClienteNavegador() {
  const { url, llaveAnonima } = envPublico();
  return createBrowserClient<Database>(url, llaveAnonima);
}
