import type { Metadata } from "next";
import { FormularioPromocion } from "@/components/admin/FormularioPromocion";
import { obtenerProductosParaPromocion, obtenerPromocionAdmin } from "@/lib/admin/datos";

export const metadata: Metadata = { title: "Promoción", robots: { index: false } };

export default async function PromocionAdmin() {
  const [promocion, productos] = await Promise.all([obtenerPromocionAdmin(), obtenerProductosParaPromocion()]);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Promoción emergente</h1>
      <p className="text-sm text-neutral-600">
        Una ventana que aparece una vez cuando el cliente entra a la tienda: para destacar un producto estrella o avisar de
        una oferta. Pon fechas de inicio y fin para que se prenda y se apague sola.
      </p>
      <FormularioPromocion promocion={promocion} productos={productos} />
    </div>
  );
}
