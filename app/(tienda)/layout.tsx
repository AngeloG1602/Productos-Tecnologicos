import { AvisoFlotante } from "@/components/carrito/AvisoFlotante";
import { BotonWhatsApp } from "@/components/tienda/BotonWhatsApp";
import { Encabezado } from "@/components/tienda/Encabezado";
import { Pie } from "@/components/tienda/Pie";
import { obtenerConfiguracionPublica } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";

export default async function LayoutTienda({ children }: LayoutProps<"/">) {
  const whatsapp = supabaseConfigurado() ? (await obtenerConfiguracionPublica()).whatsappNumero : null;
  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">{children}</main>
      <Pie />
      <AvisoFlotante />
      {whatsapp && <BotonWhatsApp numero={whatsapp} />}
    </>
  );
}
