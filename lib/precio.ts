/** Redondea hacia arriba al múltiplo indicado. redondearArriba(16750, 100) → 16800. */
export function redondearArriba(valor: number, multiplo: number): number {
  if (multiplo <= 0) return Math.ceil(valor);
  return Math.ceil(valor / multiplo) * multiplo;
}

/** Precio sugerido (RN-01): costo + margen%, redondeado hacia arriba. */
export function precioSugerido(costo: number, margenPct: number, redondeo: number): number {
  return redondearArriba(costo * (1 + margenPct / 100), redondeo);
}

/** Margen real cuando el admin ajusta el precio a mano. Null si el costo es 0 (no se puede calcular). */
export function margenReal(costo: number, precio: number): number | null {
  if (costo <= 0) return null;
  return ((precio - costo) / costo) * 100;
}

/** Advertencia visual de RN-01: el precio quedó por debajo del costo. */
export function precioPorDebajoDelCosto(costo: number, precio: number): boolean {
  return precio < costo;
}

/**
 * Porcentaje de descuento a mostrar cuando hay precio anterior (redondeado
 * hacia abajo, para no prometer más descuento del real). Null si no aplica
 * (sin precio anterior, o si no es mayor al precio actual).
 */
export function porcentajeDescuento(precioAnterior: number | null | undefined, precio: number): number | null {
  if (!precioAnterior || precioAnterior <= precio) return null;
  return Math.floor(((precioAnterior - precio) / precioAnterior) * 100);
}
