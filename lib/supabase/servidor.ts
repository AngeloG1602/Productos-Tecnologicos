import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { envPublico } from "@/lib/env";
import type { Database } from "@/lib/supabase/tipos";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Usa la llave pública y la sesión del usuario (cookies), así que respeta RLS.
 * Crear uno nuevo por petición.
 */
export async function crearClienteServidor() {
  const { url, llaveAnonima } = envPublico();
  const almacenCookies = await cookies();

  return createServerClient<Database>(url, llaveAnonima, {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesPorGuardar) {
        try {
          for (const { name, value, options } of cookiesPorGuardar) {
            almacenCookies.set(name, value, options);
          }
        } catch {
          // Desde un Server Component no se pueden escribir cookies;
          // la sesión se refresca en proxy.ts (Bloque 4).
        }
      },
    },
  });
}
