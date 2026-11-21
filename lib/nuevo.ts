/** Un producto se considera "nuevo" durante estos días desde que se creó. */
export const DIAS_NUEVO = 14;

export function esNuevo(creadoISO: string, ahora: Date, dias = DIAS_NUEVO): boolean {
  const creado = new Date(creadoISO).getTime();
  if (Number.isNaN(creado)) return false;
  const edadMs = ahora.getTime() - creado;
  return edadMs >= 0 && edadMs <= dias * 24 * 60 * 60 * 1000;
}
