const formateadorCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un monto entero en pesos colombianos: 16800 → "$ 16.800". */
export function formatearCOP(monto: number): string {
  return formateadorCOP.format(monto);
}
