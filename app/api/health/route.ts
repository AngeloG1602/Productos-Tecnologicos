import { createClient } from "@supabase/supabase-js";
import { envPublico, supabaseConfigurado } from "@/lib/env";
import type { Database } from "@/lib/supabase/tipos";

// Chequeo de estado (RNF-03): consulta la base de datos en cada llamada, sin caché.
// Lo visitan el cron diario de Vercel (vercel.json) y el monitor externo (UptimeRobot).
// Esa actividad también evita que Supabase pause el proyecto gratuito por inactividad.
// No devuelve datos de la tienda ni detalles de errores.

export const dynamic = "force-dynamic";

export async function GET() {
  const inicio = Date.now();
  const sinCache = { "Cache-Control": "no-store" };

  if (!supabaseConfigurado()) {
    return Response.json({ estado: "error", bd: "sin configurar" }, { status: 503, headers: sinCache });
  }

  const { url, llaveAnonima } = envPublico();
  const supabase = createClient<Database>(url, llaveAnonima, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (entrada, init) => fetch(entrada, { ...init, cache: "no-store" }) },
  });

  const { error } = await supabase.from("categorias").select("id").limit(1);
  const ms = Date.now() - inicio;

  if (error) {
    return Response.json({ estado: "error", bd: "sin respuesta", ms }, { status: 503, headers: sinCache });
  }
  return Response.json({ estado: "ok", bd: "ok", ms }, { headers: sinCache });
}
