// Lectura de las métricas de uso para el panel. Funciones puras (se prueban sin base de datos).

export const ETIQUETA_EVENTO: Record<string, string> = {
  vista_inicio: "Visitas a la portada",
  vista_producto: "Productos vistos",
  agregar_carrito: "Agregados al carrito",
  clic_whatsapp: "Clics en WhatsApp",
  ver_promocion: "Promoción mostrada",
  clic_promocion: "Clics en la promoción",
};

export type Embudo = {
  visitas: number;
  productosVistos: number;
  agregados: number;
  pedidos: number;
  /** Porcentaje de visitas que terminan en pedido (1 decimal), o null si no hay visitas. */
  conversionPct: number | null;
};

/** Visitas → vistas de producto → carrito → pedidos enviados, y la conversión final. */
export function armarEmbudo(totales: Record<string, number>, pedidos: number): Embudo {
  const visitas = totales.vista_inicio ?? 0;
  return {
    visitas,
    productosVistos: totales.vista_producto ?? 0,
    agregados: totales.agregar_carrito ?? 0,
    pedidos,
    conversionPct: visitas > 0 ? Math.round((pedidos / visitas) * 1000) / 10 : null,
  };
}
