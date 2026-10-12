import "server-only";
import { obtenerConfiguracionPublica, type ConfiguracionPublica } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";
import { GARANTIA_POR_DEFECTO_MESES } from "@/lib/legal";
import { TEMA_POR_DEFECTO } from "@/lib/temas";

const SIN_CONFIGURAR: ConfiguracionPublica = {
  whatsappNumero: null,
  umbralStockBajo: 5,
  textoEnvio: "",
  legal: {
    legal_nombre: "",
    legal_documento: "",
    legal_direccion: "",
    legal_ciudad: "",
    legal_correo: "",
    garantia_meses: GARANTIA_POR_DEFECTO_MESES,
    metodos_pago: "",
    tiempo_entrega: "",
  },
  temaActivo: TEMA_POR_DEFECTO,
};

/** Configuración pública para páginas que deben verse aunque Supabase aún no esté conectado. */
export async function obtenerDatosTienda(): Promise<ConfiguracionPublica> {
  return supabaseConfigurado() ? obtenerConfiguracionPublica() : SIN_CONFIGURAR;
}
