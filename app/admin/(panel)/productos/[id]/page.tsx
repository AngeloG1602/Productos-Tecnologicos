import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { HistorialProducto } from "@/components/admin/HistorialProducto";
import {
  obtenerCategoriasAdmin,
  obtenerConfiguracionAdmin,
  obtenerDistribuidoresAdmin,
  obtenerHistorialProducto,
  obtenerProductoAdmin,
} from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Editar producto", robots: { index: false } };

export default async function EditarProducto({ params }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  const [producto, categorias, configuracion, distribuidores, historial] = await Promise.all([
    obtenerProductoAdmin(id),
    obtenerCategoriasAdmin(),
    obtenerConfiguracionAdmin(),
    obtenerDistribuidoresAdmin(),
    obtenerHistorialProducto(id),
  ]);
  if (!producto) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Editar producto</h1>
      <FormularioProducto
        categorias={categorias}
        distribuidores={distribuidores}
        producto={producto}
        margenDefault={configuracion.margen_default}
        redondeo={configuracion.redondeo}
      />
      <HistorialProducto cambios={historial} />
    </div>
  );
}
