import { fechaLocal } from "@/lib/fechas";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Copia de seguridad (RNF-06): descarga todas las tablas en un archivo JSON.
// proxy.ts ya exige sesión de admin en /admin; aquí se vuelve a comprobar por si acaso.
// Usa la sesión del admin (RLS), no la llave service_role.

export const dynamic = "force-dynamic";

const TABLAS = [
  ["configuracion", "id"],
  ["categorias", "id"],
  ["productos", "id"],
  ["producto_costos", "producto_id"],
  ["socios", "id"],
  ["pedidos", "id"],
  ["pedido_items", "id"],
  ["pedido_reparto", "id"],
  ["administradores", "user_id"],
] as const;

type NombreTabla = (typeof TABLAS)[number][0];

// Supabase entrega máximo 1000 filas por consulta: se pide por páginas.
const TAMANO_PAGINA = 1000;

export async function GET() {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return new Response("No autorizado", { status: 403 });

  const tablas: Partial<Record<NombreTabla, unknown[]>> = {};
  for (const [tabla, orden] of TABLAS) {
    const filas: unknown[] = [];
    for (let desde = 0; ; desde += TAMANO_PAGINA) {
      const { data, error } = await supabase
        .from(tabla)
        .select("*")
        .order(orden)
        .range(desde, desde + TAMANO_PAGINA - 1);
      if (error) return new Response(`No se pudo leer ${tabla}. Inténtalo de nuevo.`, { status: 500 });
      filas.push(...data);
      if (data.length < TAMANO_PAGINA) break;
    }
    tablas[tabla] = filas;
  }

  const ahora = new Date();
  const respaldo = {
    generado: ahora.toISOString(),
    nota: "Copia de las tablas de la tienda. Las fotos están en Supabase Storage (bucket productos) y no se incluyen.",
    tablas,
  };

  return new Response(JSON.stringify(respaldo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="respaldo-tienda-${fechaLocal(ahora)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
