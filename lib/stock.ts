export type EstadoStock =
  | { tipo: "bajo_pedido"; texto: string; puedeComprar: true }
  | { tipo: "disponible"; texto: string; puedeComprar: true }
  | { tipo: "ultimas"; texto: string; puedeComprar: true }
  | { tipo: "agotado"; texto: string; puedeComprar: false };

/**
 * Texto de disponibilidad según RN-03:
 *   stock > umbral        → "Disponible"
 *   1 ≤ stock ≤ umbral    → "¡Últimas X unidades!" ("¡Última unidad!" si queda 1)
 *   stock = 0             → "Agotado" (no se puede agregar al carrito)
 */
export function estadoStock(stock: number, umbral: number, bajoPedido = false): EstadoStock {
  // Bajo pedido: se muestra como tal, sin importar el stock.
  if (bajoPedido) return { tipo: "bajo_pedido", texto: "Bajo pedido", puedeComprar: true };
  if (stock <= 0) {
    return { tipo: "agotado", texto: "Agotado", puedeComprar: false };
  }
  if (stock <= umbral) {
    const texto = stock === 1 ? "¡Última unidad!" : `¡Últimas ${stock} unidades!`;
    return { tipo: "ultimas", texto, puedeComprar: true };
  }
  return { tipo: "disponible", texto: "Disponible", puedeComprar: true };
}
