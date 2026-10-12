import { AvisoFlotante } from "@/components/carrito/AvisoFlotante";
import { BotonWhatsApp } from "@/components/tienda/BotonWhatsApp";
import { Encabezado } from "@/components/tienda/Encabezado";
import { Pie } from "@/components/tienda/Pie";
import { obtenerConfiguracionPublica } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";
import { TEMA_POR_DEFECTO } from "@/lib/temas";

export default async function LayoutTienda({ children }: LayoutProps<"/">) {
  const configuracion = supabaseConfigurado() ? await obtenerConfiguracionPublica() : null;
  return (
    // data-tema: ver lib/temas.ts y los bloques [data-tema="..."] en app/globals.css.
    // flex flex-1 flex-col: reemplaza aquí el mismo rol que tenían estos hijos
    // directamente sobre <body> (que también es flex-col), para que el pie siga quedando abajo.
    <div data-tema={configuracion?.temaActivo ?? TEMA_POR_DEFECTO} className="flex flex-1 flex-col">
      <Encabezado />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">{children}</main>
      <Pie />
      <AvisoFlotante />
      {configuracion?.whatsappNumero && <BotonWhatsApp numero={configuracion.whatsappNumero} />}
    </div>
  );
}
