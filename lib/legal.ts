// Datos legales de la tienda (Ley 1480 de 2011 art. 50, Ley 1581 de 2012, Decreto 1377 de 2013 art. 13).
// Se editan en Admin → Configuración y se muestran en /terminos y /politica-de-datos.

export type DatosLegales = {
  legal_nombre: string;
  legal_documento: string;
  legal_direccion: string;
  legal_ciudad: string;
  legal_correo: string;
  garantia_meses: number;
  metodos_pago: string;
  tiempo_entrega: string;
};

export type EntradaDatosLegales = {
  nombre: string;
  documento: string;
  direccion: string;
  ciudad: string;
  correo: string;
  garantiaMeses: string;
  metodosPago: string;
  tiempoEntrega: string;
};

/** Fecha de la última revisión de /terminos y /politica-de-datos. Cambiarla al editar esos textos. */
export const ACTUALIZACION_TEXTOS_LEGALES = "25 de septiembre de 2026";

/** Garantía si no se anuncia otra: 1 año para productos nuevos (Ley 1480 art. 8). */
export const GARANTIA_POR_DEFECTO_MESES = 12;

const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Valida el formulario de datos legales. Mismas reglas que la tabla configuracion. */
export function validarDatosLegales(
  e: EntradaDatosLegales,
): { ok: true; valores: DatosLegales } | { ok: false; error: string } {
  const nombre = e.nombre.trim();
  const documento = e.documento.trim();
  const direccion = e.direccion.trim();
  const ciudad = e.ciudad.trim();
  const correo = e.correo.trim().toLowerCase();
  const metodosPago = e.metodosPago.trim();
  const tiempoEntrega = e.tiempoEntrega.trim();

  if (nombre.length > 120) return { ok: false, error: "El nombre puede tener máximo 120 caracteres." };
  if (documento.length > 40) return { ok: false, error: "La cédula o NIT puede tener máximo 40 caracteres." };
  if (direccion.length > 160) return { ok: false, error: "La dirección puede tener máximo 160 caracteres." };
  if (ciudad.length > 80) return { ok: false, error: "La ciudad puede tener máximo 80 caracteres." };
  if (correo !== "" && (correo.length > 120 || !CORREO.test(correo))) {
    return { ok: false, error: "El correo no es válido (ej. ventas@mitienda.com)." };
  }
  if (!/^\d{1,2}$/.test(e.garantiaMeses.trim()) || Number(e.garantiaMeses) < 1 || Number(e.garantiaMeses) > 60) {
    return { ok: false, error: "La garantía debe ser un número de meses entre 1 y 60." };
  }
  if (metodosPago.length > 300) return { ok: false, error: "Los medios de pago pueden tener máximo 300 caracteres." };
  if (tiempoEntrega.length > 300) return { ok: false, error: "El tiempo de entrega puede tener máximo 300 caracteres." };

  return {
    ok: true,
    valores: {
      legal_nombre: nombre,
      legal_documento: documento,
      legal_direccion: direccion,
      legal_ciudad: ciudad,
      legal_correo: correo,
      garantia_meses: Number(e.garantiaMeses),
      metodos_pago: metodosPago,
      tiempo_entrega: tiempoEntrega,
    },
  };
}

/** Campos que la ley exige publicar y aún están vacíos (para avisar en el panel). */
export function datosLegalesFaltantes(d: DatosLegales): string[] {
  const faltan: string[] = [];
  if (!d.legal_nombre.trim()) faltan.push("nombre o razón social");
  if (!d.legal_documento.trim()) faltan.push("cédula o NIT");
  if (!d.legal_direccion.trim()) faltan.push("dirección");
  if (!d.legal_ciudad.trim()) faltan.push("ciudad");
  if (!d.legal_correo.trim()) faltan.push("correo");
  if (!d.metodos_pago.trim()) faltan.push("medios de pago");
  return faltan;
}

/** "12 meses (1 año)", "6 meses", "1 mes", "24 meses (2 años)". */
export function textoGarantia(meses: number): string {
  const base = `${meses} ${meses === 1 ? "mes" : "meses"}`;
  if (meses % 12 !== 0) return base;
  const anios = meses / 12;
  return `${base} (${anios} ${anios === 1 ? "año" : "años"})`;
}
