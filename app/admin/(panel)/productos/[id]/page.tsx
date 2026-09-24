import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { obtenerCategoriasAdmin, obtenerConfiguracionAdmin, obtenerProductoAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Editar producto", robots: { index: false } };

export default async function EditarProducto({ params }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  const [producto, categorias, configuracion] = await Promise.all([
    obtenerProductoAdmin(id),
    obtenerCategoriasAdmin(),
    obtenerConfiguracionAdmin(),
  ]);
  if (!producto) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Editar producto</h1>
      <FormularioProducto
        categorias={categorias}
        producto={producto}
        margenDefault={configuracion.margen_default}
        redondeo={configuracion.redondeo}
      />
    </div>
  );
}
