import type { Metadata } from "next";
import { ListaCategorias } from "@/components/admin/ListaCategorias";
import { obtenerCategoriasAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Categorías", robots: { index: false } };

export default async function CategoriasAdmin() {
  const categorias = await obtenerCategoriasAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Categorías</h1>
      <ListaCategorias categorias={categorias} />
    </div>
  );
}
