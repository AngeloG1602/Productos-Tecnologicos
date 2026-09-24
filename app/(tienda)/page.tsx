import { AvisoSinConfigurar } from "@/components/tienda/AvisoSinConfigurar";
import { Catalogo } from "@/components/tienda/Catalogo";
import { obtenerCategorias, obtenerConfiguracionPublica, obtenerProductos } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";

// Se regenera como máximo cada 60 s (y al instante cuando el admin edite, Bloque 4).
export const revalidate = 60;

export default async function Inicio() {
  if (!supabaseConfigurado()) return <AvisoSinConfigurar />;

  const [categorias, productos, configuracion] = await Promise.all([
    obtenerCategorias(),
    obtenerProductos(),
    obtenerConfiguracionPublica(),
  ]);

  return (
    <Catalogo categorias={categorias} productos={productos} umbral={configuracion.umbralStockBajo} />
  );
}
