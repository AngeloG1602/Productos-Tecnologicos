type ProductoBasico = { id: string; categoria_id: string | null; stock: number; destacado: boolean };

/**
 * "Más productos" en la ficha: primero los de la misma categoría, luego los
 * destacados y luego el resto. Sin el producto actual ni los agotados.
 */
export function productosRelacionados<T extends ProductoBasico>(todos: T[], actual: ProductoBasico, maximo = 8): T[] {
  const puntaje = (p: T) => (p.categoria_id !== null && p.categoria_id === actual.categoria_id ? 2 : 0) + (p.destacado ? 1 : 0);
  return todos
    .filter((p) => p.id !== actual.id && p.stock > 0)
    .map((p, i) => ({ p, i, puntos: puntaje(p) }))
    .sort((a, b) => b.puntos - a.puntos || a.i - b.i)
    .slice(0, maximo)
    .map(({ p }) => p);
}
