import type { Metadata } from "next";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { obtenerCategoriasAdmin, obtenerConfiguracionAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Nuevo producto", robots: { index: false } };

export default async function NuevoProducto() {
  const [categorias, configuracion] = await Promise.all([obtenerCategoriasAdmin(), obtenerConfiguracionAdmin()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Nuevo producto</h1>
      <FormularioProducto
        categorias={categorias}
        producto={null}
        margenDefault={configuracion.margen_default}
        redondeo={configuracion.redondeo}
      />
    </div>
  );
}
