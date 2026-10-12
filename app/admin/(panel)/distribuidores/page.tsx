import type { Metadata } from "next";
import { ListaDistribuidores } from "@/components/admin/ListaDistribuidores";
import { obtenerDistribuidoresAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Distribuidores", robots: { index: false } };

export default async function DistribuidoresAdmin() {
  const distribuidores = await obtenerDistribuidoresAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Distribuidores</h1>
      <p className="text-sm text-neutral-600">
        Para clasificar internamente quién les provee cada producto. Es solo para ustedes: nunca se muestra en la
        tienda ni al cliente.
      </p>
      <ListaDistribuidores distribuidores={distribuidores} />
    </div>
  );
}
