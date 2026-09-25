import type { Metadata } from "next";
import { FormularioConfiguracion } from "@/components/admin/FormularioConfiguracion";
import { FormularioDatosLegales } from "@/components/admin/FormularioDatosLegales";
import { obtenerConfiguracionAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Configuración", robots: { index: false } };

export default async function ConfiguracionAdmin() {
  const configuracion = await obtenerConfiguracionAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Configuración</h1>
      <FormularioConfiguracion configuracion={configuracion} />

      <section id="datos-legales" aria-labelledby="titulo-legales" className="flex scroll-mt-20 flex-col gap-3">
        <h2 id="titulo-legales" className="border-t border-neutral-200 pt-6 text-lg font-bold">
          Datos legales de la tienda
        </h2>
        <FormularioDatosLegales configuracion={configuracion} />
      </section>

      <section id="respaldo" aria-labelledby="titulo-respaldo" className="flex scroll-mt-20 flex-col gap-3 pb-10">
        <h2 id="titulo-respaldo" className="border-t border-neutral-200 pt-6 text-lg font-bold">
          Copia de seguridad
        </h2>
        <p className="text-sm text-neutral-600">
          Descarga un archivo con los productos, costos, pedidos, socios y configuración. Guárdalo en tu
          computador o en Google Drive una vez por semana: el plan gratuito de Supabase no guarda copias. Las fotos
          no se incluyen (siguen en Supabase).
        </p>
        <a
          href="/admin/respaldo"
          download
          className="flex h-12 items-center justify-center rounded-xl border border-marca text-base font-semibold text-marca"
        >
          Descargar copia de seguridad
        </a>
      </section>
    </div>
  );
}
