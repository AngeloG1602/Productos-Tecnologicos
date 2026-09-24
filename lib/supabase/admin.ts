import "server-only";
import { createClient } from "@supabase/supabase-js";
import { envPublico } from "@/lib/env";

/**
 * Cliente con la llave service_role: IGNORA RLS.
 * Solo para tareas de servidor muy puntuales. Nunca importarlo desde código de cliente.
 */
export function crearClienteAdmin() {
  const { url } = envPublico();
  const llaveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!llaveServicio) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (solo en el servidor).");
  }
  return createClient(url, llaveServicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
