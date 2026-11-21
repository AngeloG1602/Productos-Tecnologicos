/** Pasados estos días sin descargar una copia de seguridad, el inicio del panel la recuerda. */
export const DIAS_RECORDATORIO_RESPALDO = 7;

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días completos desde la última copia, o null si nunca se hizo (o la fecha no es válida). */
export function diasDesdeRespaldo(ultimo: string | null, ahora: Date): number | null {
  if (!ultimo) return null;
  const t = new Date(ultimo).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((ahora.getTime() - t) / DIA_MS));
}

export function necesitaRespaldo(ultimo: string | null, ahora: Date, dias = DIAS_RECORDATORIO_RESPALDO): boolean {
  const d = diasDesdeRespaldo(ultimo, ahora);
  return d === null || d >= dias;
}

export function textoUltimoRespaldo(ultimo: string | null, ahora: Date): string {
  const d = diasDesdeRespaldo(ultimo, ahora);
  if (d === null) return "Todavía no has descargado ninguna copia.";
  if (d === 0) return "Última copia: hoy.";
  return d === 1 ? "Última copia: hace 1 día." : `Última copia: hace ${d} días.`;
}
