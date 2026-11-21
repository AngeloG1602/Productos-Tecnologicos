// Promoción emergente: validación (la usan el formulario y el servidor) y conversión de fechas.
// Las fechas se escriben en hora de Colombia (UTC-5, sin horario de verano).

export type EntradaPromocion = {
  activa: boolean;
  titulo: string;
  texto: string;
  boton_texto: string;
  producto_id: string | null;
  /** Formato de <input type="datetime-local">: "2026-11-27T08:00". Vacío = sin límite. */
  desde: string;
  hasta: string;
};

export type ValoresPromocion = {
  activa: boolean;
  titulo: string;
  texto: string;
  boton_texto: string;
  producto_id: string | null;
  desde: string | null;
  hasta: string | null;
};

export type ResultadoValidacion = { ok: true; valores: ValoresPromocion } | { ok: false; error: string };

const FORMATO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "2026-11-27T08:00" (hora de Colombia) → "2026-11-27T08:00:00-05:00". Vacío o inválido → null. */
export function localAIso(valor: string): string | null {
  if (!FORMATO_LOCAL.test(valor)) return null;
  const iso = `${valor}:00-05:00`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

/** Fecha de la base (UTC) → "2026-11-27T08:00" en hora de Colombia, para el campo del formulario. */
export function isoALocal(iso: string | null): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  return new Date(ms - 5 * 3600 * 1000).toISOString().slice(0, 16);
}

export function validarPromocion(entrada: EntradaPromocion): ResultadoValidacion {
  const titulo = entrada.titulo.trim();
  const texto = entrada.texto.trim();
  const boton = entrada.boton_texto.trim();
  if (titulo.length > 80) return { ok: false, error: "El título admite máximo 80 caracteres." };
  if (texto.length > 240) return { ok: false, error: "El texto admite máximo 240 caracteres." };
  if (boton.length < 1 || boton.length > 30) return { ok: false, error: "El botón debe tener entre 1 y 30 caracteres." };
  if (entrada.producto_id !== null && !UUID.test(entrada.producto_id)) return { ok: false, error: "Producto inválido." };

  const desde = entrada.desde.trim() ? localAIso(entrada.desde.trim()) : null;
  const hasta = entrada.hasta.trim() ? localAIso(entrada.hasta.trim()) : null;
  if (entrada.desde.trim() && !desde) return { ok: false, error: "La fecha de inicio no es válida." };
  if (entrada.hasta.trim() && !hasta) return { ok: false, error: "La fecha de fin no es válida." };
  if (desde && hasta && new Date(hasta) <= new Date(desde)) {
    return { ok: false, error: "La fecha de fin debe ser posterior a la de inicio." };
  }
  if (entrada.activa && !entrada.producto_id && !titulo) {
    return { ok: false, error: "Para activarla, elige un producto o escribe un título." };
  }

  return {
    ok: true,
    valores: { activa: entrada.activa, titulo, texto, boton_texto: boton, producto_id: entrada.producto_id, desde, hasta },
  };
}
