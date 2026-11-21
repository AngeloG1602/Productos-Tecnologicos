import type { Metadata } from "next";
import { PaginaCarrito } from "@/components/carrito/PaginaCarrito";
import { AvisoSinConfigurar } from "@/components/tienda/AvisoSinConfigurar";
import { obtenerConfiguracionPublica } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };
export const revalidate = 60;

export default async function Carrito() {
  if (!supabaseConfigurado()) return <AvisoSinConfigurar />;
  const { whatsappNumero, textoEnvio, legal } = await obtenerConfiguracionPublica();
  return (
    <PaginaCarrito
      whatsappNumero={whatsappNumero}
      textoEnvio={textoEnvio}
      tiempoEntrega={legal.tiempo_entrega}
      metodosPago={legal.metodos_pago}
    />
  );
}
