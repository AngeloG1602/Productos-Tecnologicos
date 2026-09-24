import type { Metadata } from "next";
import Link from "next/link";
import { ListaProductos } from "@/components/admin/ListaProductos";
import { obtenerCategoriasAdmin, obtenerProductosAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Productos", robots: { index: false } };

export default async function ProductosAdmin() {
  const [productos, categorias] = await Promise.all([obtenerProductosAdmin(), obtenerCategoriasAdmin()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Productos</h1>
        <Link href="/admin/productos/nuevo" className="rounded-xl bg-marca px-4 py-2 text-sm font-semibold text-white">
          + Nuevo
        </Link>
      </div>
      <ListaProductos productos={productos} categorias={categorias} />
    </div>
  );
}
