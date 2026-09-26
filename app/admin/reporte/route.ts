import type { NextRequest } from "next/server";
import {
  contarPedidosRecibidos,
  obtenerCategoriasDeProductos,
  obtenerSocios,
  obtenerVentasDetalle,
} from "@/lib/admin/datos";
import { esFechaValida } from "@/lib/fechas";
import { hojasReporte, nombreArchivoReporte } from "@/lib/reporte-excel";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { NOMBRE_TIENDA } from "@/lib/tienda";
import { crearXlsx } from "@/lib/xlsx";

// Reporte de ventas en Excel para un rango de fechas: /admin/reporte?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
// proxy.ts ya exige sesión de admin en /admin; aquí se vuelve a comprobar.
// Usa la sesión del admin (RLS), no la llave service_role.

export const dynamic = "force-dynamic";

// Máximo ~3 años por reporte, para no pedir demasiado de una vez.
const MAXIMO_DIAS = 1100;

export async function GET(request: NextRequest) {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return new Response("No autorizado", { status: 403 });

  const desde = request.nextUrl.searchParams.get("desde");
  const hasta = request.nextUrl.searchParams.get("hasta");
  if (!esFechaValida(desde) || !esFechaValida(hasta) || hasta < desde) {
    return new Response("Rango de fechas no válido.", { status: 400 });
  }
  if ((Date.parse(hasta) - Date.parse(desde)) / 86_400_000 > MAXIMO_DIAS) {
    return new Response("El rango es demasiado largo: máximo 3 años por reporte.", { status: 400 });
  }

  try {
    const [pedidos, recibidos, socios, categorias] = await Promise.all([
      obtenerVentasDetalle(desde, hasta),
      contarPedidosRecibidos(desde, hasta),
      obtenerSocios(),
      obtenerCategoriasDeProductos(),
    ]);

    const archivo = crearXlsx(
      hojasReporte({
        nombreTienda: NOMBRE_TIENDA,
        desde,
        hasta,
        generado: new Date(),
        pedidos,
        recibidos,
        socios: socios.map((s) => ({ ...s, porcentaje: Number(s.porcentaje) })),
        categoriaDe: (id) => categorias.get(id),
      }),
    );

    return new Response(archivo, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivoReporte(desde, hasta)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("No se pudo generar el reporte. Inténtalo de nuevo.", { status: 500 });
  }
}
