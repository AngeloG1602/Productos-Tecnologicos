/** Zona horaria del negocio: los rangos del dashboard y las fechas se muestran en hora de Colombia. */
export const ZONA_HORARIA = "America/Bogota";

const formatoISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha (AAAA-MM-DD) de un instante, en hora de Colombia. */
export function fechaLocal(instante: Date): string {
  return formatoISO.format(instante);
}

/** Rango por defecto del dashboard: desde el día 1 del mes actual hasta hoy (hora de Colombia). */
export function rangoMesActual(ahora: Date): { desde: string; hasta: string } {
  const hoy = fechaLocal(ahora);
  return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
}

/** ¿Es una fecha AAAA-MM-DD válida? (para leer los filtros de la URL sin confiar en ellos) */
export function esFechaValida(texto: unknown): texto is string {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

const formatoFechaHora = new Intl.DateTimeFormat("es-CO", {
  timeZone: ZONA_HORARIA,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "24 sept 2026, 3:15 p. m." en hora de Colombia. */
export function formatearFechaHora(iso: string): string {
  return formatoFechaHora.format(new Date(iso));
}

// Colombia no tiene horario de verano: siempre UTC-5.
const DESFASE_COLOMBIA = "-05:00";

/**
 * Instantes (ISO, UTC) que delimitan un rango de días en hora de Colombia, ambos días incluidos:
 * desde las 00:00 del primer día hasta antes de las 00:00 del día siguiente al último.
 */
export function limitesRango(desde: string, hasta: string): { inicio: string; fin: string } {
  const inicio = new Date(`${desde}T00:00:00${DESFASE_COLOMBIA}`);
  const fin = new Date(`${hasta}T00:00:00${DESFASE_COLOMBIA}`);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

const formatoFechaHoraISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-09-26 14:30" en hora de Colombia (para hojas de cálculo: se ordena bien como texto). */
export function fechaHoraLocal(iso: string): string {
  const p = Object.fromEntries(formatoFechaHoraISO.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Día de la semana de una fecha AAAA-MM-DD ("lunes", …). */
export function diaSemana(fecha: string): string {
  return NOMBRES_DIA[new Date(`${fecha}T12:00:00Z`).getUTCDay()] ?? "";
}

const formatoFechaLarga = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "2026-09-26" → "26 de septiembre de 2026". */
export function formatearFechaLarga(fecha: string): string {
  return formatoFechaLarga.format(new Date(`${fecha}T12:00:00Z`));
}
