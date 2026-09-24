import type { Metadata } from "next";
import { FormularioConfiguracion } from "@/components/admin/FormularioConfiguracion";
import { obtenerConfiguracionAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Configuración", robots: { index: false } };

export default async function ConfiguracionAdmin() {
  const configuracion = await obtenerConfiguracionAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Configuración</h1>
      <FormularioConfiguracion configuracion={configuracion} />
    </div>
  );
}
