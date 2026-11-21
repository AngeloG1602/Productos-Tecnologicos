// Orden y filtro de precio del catálogo. Se aplican en el navegador (el catálogo es chico).
// Los agotados siempre van al final, sea cual sea el orden elegido.

export type Orden = "relevancia" | "recientes" | "precio-asc" | "precio-desc";

export const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: "relevancia", etiqueta: "Destacados" },
  { valor: "recientes", etiqueta: "Recién llegados" },
  { valor: "precio-asc", etiqueta: "Precio: menor a mayor" },
  { valor: "precio-desc", etiqueta: "Precio: mayor a menor" },
];

export function esOrden(valor: string | null): valor is Orden {
  return ORDENES.some((o) => o.valor === valor);
}

type ConPrecio = { precio_venta: number; stock: number; destacado: boolean; created_at: string };

export function ordenarProductos<T extends ConPrecio>(lista: readonly T[], orden: Orden): T[] {
  // sort es estable: a igualdad de criterio se conserva el orden de entrada (alfabético).
  return [...lista].sort((a, b) => {
    const agotados = Number(a.stock <= 0) - Number(b.stock <= 0);
    if (agotados !== 0) return agotados;
    if (orden === "recientes") return b.created_at.localeCompare(a.created_at); // ISO: se ordena como texto
    if (orden === "precio-asc") return a.precio_venta - b.precio_venta;
    if (orden === "precio-desc") return b.precio_venta - a.precio_venta;
    return Number(b.destacado) - Number(a.destacado);
  });
}

/** Rango de precio inclusivo; null = sin límite en ese extremo. */
export function filtrarPorPrecio<T extends { precio_venta: number }>(
  lista: readonly T[],
  min: number | null,
  max: number | null,
): T[] {
  return lista.filter((p) => (min === null || p.precio_venta >= min) && (max === null || p.precio_venta <= max));
}

/** Lee un monto de la URL: entero >= 0, o null si no es válido. */
export function leerMonto(texto: string | null): number | null {
  if (!texto || !/^\d{1,9}$/.test(texto)) return null;
  return Number(texto);
}

/** Rangos rápidos que se ofrecen como atajos (en pesos). */
export const RANGOS_PRECIO: { etiqueta: string; min: number | null; max: number | null }[] = [
  { etiqueta: "Hasta $20.000", min: null, max: 20000 },
  { etiqueta: "$20.000 – $50.000", min: 20000, max: 50000 },
  { etiqueta: "$50.000 – $150.000", min: 50000, max: 150000 },
  { etiqueta: "Más de $150.000", min: 150000, max: null },
];
