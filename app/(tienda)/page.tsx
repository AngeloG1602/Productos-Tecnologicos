import { AvisoSinConfigurar } from "@/components/tienda/AvisoSinConfigurar";
import { Catalogo } from "@/components/tienda/Catalogo";
import { FranjaConfianza } from "@/components/tienda/FranjaConfianza";
import { HeroPortada } from "@/components/tienda/HeroPortada";
import { obtenerCategorias, obtenerConfiguracionPublica, obtenerProductos } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerTema } from "@/lib/temas";

// Se regenera como máximo cada 60 s (y al instante cuando el admin edite, Bloque 4).
export const revalidate = 60;

export default async function Inicio() {
  if (!supabaseConfigurado()) return <AvisoSinConfigurar />;

  const [categorias, productos, configuracion] = await Promise.all([
    obtenerCategorias(),
    obtenerProductos(),
    obtenerConfiguracionPublica(),
  ]);

  const tema = obtenerTema(configuracion.temaActivo);

  return (
    <div className="flex flex-col gap-6">
      <HeroPortada tema={tema} whatsappNumero={configuracion.whatsappNumero} />
      <FranjaConfianza configuracion={configuracion} />
      <Catalogo categorias={categorias} productos={productos} umbral={configuracion.umbralStockBajo} tema={tema} />
    </div>
  );
}
