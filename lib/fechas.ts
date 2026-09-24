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
