// Tipos y lectura segura de la respuesta de la función crear_pedido (ver migración 3).

export type ItemPedido = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type TipoCambio = "no_disponible" | "stock" | "precio";

export type CambioPedido = {
  producto_id: string;
  nombre: string | null;
  tipo: TipoCambio;
  cantidad_solicitada: number;
  cantidad: number;
  precio_anterior: number | null;
  precio_actual: number | null;
};

export type RespuestaCrearPedido =
  | { ok: true; codigo: string; total: number; items: ItemPedido[] }
  | { ok: false; motivo: "cambios"; cambios: CambioPedido[]; items: ItemPedido[]; total: number };

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const esEntero = (v: unknown): v is number => Number.isInteger(v);

function leerItem(v: unknown): ItemPedido {
  if (
    !esObjeto(v) ||
    typeof v.producto_id !== "string" ||
    typeof v.nombre !== "string" ||
    !esEntero(v.cantidad) ||
    !esEntero(v.precio_unitario) ||
    !esEntero(v.subtotal)
  ) {
    throw new Error("Respuesta de pedido inválida (ítem).");
  }
  return {
    producto_id: v.producto_id,
    nombre: v.nombre,
    cantidad: v.cantidad,
    precio_unitario: v.precio_unitario,
    subtotal: v.subtotal,
  };
}

function leerCambio(v: unknown): CambioPedido {
  const tipos: TipoCambio[] = ["no_disponible", "stock", "precio"];
  if (
    !esObjeto(v) ||
    typeof v.producto_id !== "string" ||
    !tipos.includes(v.tipo as TipoCambio) ||
    !esEntero(v.cantidad_solicitada) ||
    !esEntero(v.cantidad)
  ) {
    throw new Error("Respuesta de pedido inválida (cambio).");
  }
  return {
    producto_id: v.producto_id,
    nombre: typeof v.nombre === "string" ? v.nombre : null,
    tipo: v.tipo as TipoCambio,
    cantidad_solicitada: v.cantidad_solicitada,
    cantidad: v.cantidad,
    precio_anterior: esEntero(v.precio_anterior) ? v.precio_anterior : null,
    precio_actual: esEntero(v.precio_actual) ? v.precio_actual : null,
  };
}

/** Valida la forma de la respuesta de crear_pedido. Lanza error si no es la esperada. */
export function interpretarRespuestaPedido(datos: unknown): RespuestaCrearPedido {
  if (!esObjeto(datos) || !Array.isArray(datos.items) || !esEntero(datos.total)) {
    throw new Error("Respuesta de pedido inválida.");
  }
  const items = datos.items.map(leerItem);
  if (datos.ok === true && typeof datos.codigo === "string") {
    return { ok: true, codigo: datos.codigo, total: datos.total, items };
  }
  if (datos.ok === false && datos.motivo === "cambios" && Array.isArray(datos.cambios)) {
    return { ok: false, motivo: "cambios", cambios: datos.cambios.map(leerCambio), items, total: datos.total };
  }
  throw new Error("Respuesta de pedido inválida.");
}
