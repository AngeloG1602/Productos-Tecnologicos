import type { Metadata } from "next";
import { EditorSocios } from "@/components/admin/EditorSocios";
import { obtenerSocios } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Socios", robots: { index: false } };

export default async function SociosAdmin() {
  const socios = await obtenerSocios();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Socios</h1>
      <p className="text-sm text-neutral-600">
        La ganancia de cada pedido se reparte según estos porcentajes al momento de confirmarlo. Cambiarlos no
        altera los pedidos ya confirmados.
      </p>
      <EditorSocios socios={socios} />
    </div>
  );
}
