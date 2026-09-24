import { normalizarNumero } from "./whatsapp.ts";

export type EntradaConfiguracion = {
  whatsappNumero: string;
  margenDefault: string;
  redondeo: string;
  umbralStockBajo: string;
  textoEnvio: string;
};

export type ConfiguracionValida = {
  whatsapp_numero: string;
  margen_default: number;
  redondeo: number;
  umbral_stock_bajo: number;
  texto_envio: string;
};

const esEnteroNoNegativo = (t: string) => /^\d{1,7}$/.test(t.trim());

/** Valida lo que se escribió en el formulario de configuración (RF-19). Mismas reglas que la tabla. */
export function validarConfiguracion(
  e: EntradaConfiguracion,
): { ok: true; valores: ConfiguracionValida } | { ok: false; error: string } {
  const numero = normalizarNumero(e.whatsappNumero);
  if (!/^\d{8,15}$/.test(numero)) {
    return { ok: false, error: "El WhatsApp debe tener entre 8 y 15 dígitos, con indicativo (ej. 57 300 123 4567)." };
  }
  const margen = e.margenDefault.trim().replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(margen)) {
    return { ok: false, error: "El margen por defecto debe ser un número de 0 en adelante (máximo 2 decimales)." };
  }
  if (!esEnteroNoNegativo(e.redondeo) || Number(e.redondeo) < 1) {
    return { ok: false, error: "El redondeo debe ser un número entero de 1 en adelante (ej. 100)." };
  }
  if (!esEnteroNoNegativo(e.umbralStockBajo)) {
    return { ok: false, error: "El umbral de stock bajo debe ser un número entero, 0 o más." };
  }
  const texto = e.textoEnvio.trim();
  if (texto.length > 300) {
    return { ok: false, error: "El texto de envío puede tener máximo 300 caracteres." };
  }
  return {
    ok: true,
    valores: {
      whatsapp_numero: numero,
      margen_default: Number(margen),
      redondeo: Number(e.redondeo),
      umbral_stock_bajo: Number(e.umbralStockBajo),
      texto_envio: texto,
    },
  };
}
