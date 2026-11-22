// Un producto "bajo pedido" se puede pedir aunque no haya stock (se fabrica o se consigue por encargo).
// Estas funciones centralizan esa regla para que la tienda no repita "stock > 0" por todos lados.

/** Máximo de unidades por producto bajo pedido en un solo pedido (no hay stock que lo limite). */
export const MAXIMO_BAJO_PEDIDO = 20;

type ConExistencia = { stock: number; bajo_pedido?: boolean };

/** ¿Se puede pedir? Con stock, o bajo pedido. */
export function hayExistencia(p: ConExistencia): boolean {
  return Boolean(p.bajo_pedido) || p.stock > 0;
}
