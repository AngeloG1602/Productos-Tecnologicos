// Contenido del reporte de ventas en Excel (Admin → Inicio → Descargar reporte).
// Hojas: Resumen, Pedidos, Detalle, Por producto, Por categoría, Por día,
// Por día de la semana, Por ciudad y Reparto socios.

import { fechaHoraLocal, formatearFechaLarga } from "./fechas.ts";
import type { Celda, Hoja } from "./xlsx.ts";
import {
  estadisticas,
  margen,
  mayor,
  repartoPorSocio,
  type PedidoVendido,
  type SocioActual,
  type Totales,
} from "./reporte.ts";

export type DatosReporte = {
  nombreTienda: string;
  desde: string;
  hasta: string;
  generado: Date;
  /** Pedidos confirmados o entregados en el rango (con ítems y reparto). */
  pedidos: PedidoVendido[];
  /** Pedidos que llegaron en el rango, por estado (incluye pendientes y cancelados). */
  recibidos: Record<PedidoVendido["estado"], number>;
  socios: SocioActual[];
  categoriaDe: (productoId: string) => string | undefined;
};

const ESTADO: Record<PedidoVendido["estado"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const moneda = (valor: number): Celda => ({ valor, formato: "moneda" });
const entero = (valor: number): Celda => ({ valor, formato: "entero" });
const decimal = (valor: number): Celda => ({ valor, formato: "decimal" });
const porcentaje = (valor: number): Celda => ({ valor, formato: "porcentaje" });

/** Columnas comunes de cifras: unidades, venta, costo, ganancia, margen. */
const COLUMNAS_CIFRAS = [
  { titulo: "Unidades", formato: "entero", ancho: 10 },
  { titulo: "Venta", formato: "moneda", ancho: 14 },
  { titulo: "Costo", formato: "moneda", ancho: 14 },
  { titulo: "Ganancia", formato: "moneda", ancho: 14 },
  { titulo: "Margen", formato: "porcentaje", ancho: 10 },
] as const;

const cifras = (t: Totales): Celda[] => [t.unidades, t.ventas, t.costo, t.ganancia, margen(t)];

export function hojasReporte(d: DatosReporte): Hoja[] {
  const e = estadisticas(d.pedidos, d.categoriaDe);
  const reparto = repartoPorSocio(d.pedidos, d.socios);
  const t = e.totales;
  const rango = d.desde === d.hasta ? formatearFechaLarga(d.desde) : `${formatearFechaLarga(d.desde)} al ${formatearFechaLarga(d.hasta)}`;

  // ── Resumen ────────────────────────────────────────────────
  const recibidosTotal = Object.values(d.recibidos).reduce((s, n) => s + n, 0);
  const vendidosDelRango = d.recibidos.confirmado + d.recibidos.entregado;
  const masUnidades = e.porProducto[0] ?? null;
  const masGanancia = mayor(e.porProducto, (p) => p.ganancia);
  const mejorDia = mayor(e.porDia, (x) => x.ventas);
  const mejorDiaSemana = mayor(e.porDiaSemana, (x) => x.ventas);
  const ciudadTop = e.porCiudad[0] ?? null;

  const filasResumen: Celda[][] = [];
  const destacadas: number[] = [];
  const titulo = (texto: string) => {
    if (filasResumen.length > 0) filasResumen.push([]);
    destacadas.push(filasResumen.length);
    filasResumen.push([texto]);
  };

  filasResumen.push([`Reporte de ventas — ${d.nombreTienda}`]);
  filasResumen.push([`Del ${rango}`]);
  filasResumen.push([`Generado: ${fechaHoraLocal(d.generado.toISOString())} (hora de Colombia)`]);
  filasResumen.push(["Cuentan los pedidos confirmados o entregados, según la fecha en que se confirmaron."]);

  titulo("Ventas");
  filasResumen.push(
    ["Pedidos vendidos", entero(t.pedidos)],
    ["Unidades vendidas", entero(t.unidades)],
    ["Ventas", moneda(t.ventas)],
    ["Costo", moneda(t.costo)],
    ["Ganancia", moneda(t.ganancia)],
    ["Margen (ganancia / ventas)", porcentaje(margen(t))],
    ["Ticket promedio (venta por pedido)", moneda(e.ticketPromedio)],
    ["Unidades por pedido", decimal(e.unidadesPorPedido)],
  );
  if (e.horasPromedioConfirmacion !== null) {
    filasResumen.push(["Horas promedio para confirmar un pedido", decimal(e.horasPromedioConfirmacion)]);
  }

  titulo("Pedidos recibidos en estas fechas (por fecha de llegada)");
  filasResumen.push(
    ["Recibidos", entero(recibidosTotal)],
    ["Vendidos (confirmados o entregados)", entero(vendidosDelRango)],
    ["Pendientes", entero(d.recibidos.pendiente)],
    ["Cancelados", entero(d.recibidos.cancelado)],
    ["Porcentaje que terminó en venta", porcentaje(recibidosTotal ? vendidosDelRango / recibidosTotal : 0)],
  );

  titulo("Lo más destacado");
  filasResumen.push(
    ["Producto más vendido", masUnidades ? `${masUnidades.nombre} (${masUnidades.unidades} und.)` : "—"],
    ["Producto que más ganancia dejó", masGanancia ? masGanancia.nombre : "—", masGanancia ? moneda(masGanancia.ganancia) : null],
    ["Mejor día", mejorDia ? `${mejorDia.fecha} (${mejorDia.dia})` : "—", mejorDia ? moneda(mejorDia.ventas) : null],
    ["Día de la semana con más ventas", mejorDiaSemana ? mejorDiaSemana.nombre : "—", mejorDiaSemana ? moneda(mejorDiaSemana.ventas) : null],
    ["Ciudad / barrio con más pedidos", ciudadTop ? `${ciudadTop.nombre} (${ciudadTop.pedidos})` : "—"],
  );

  titulo("Reparto de la ganancia");
  for (const r of reparto.filas) {
    filasResumen.push([
      r.porcentajeActual === null ? `${r.nombre} (ya no es socio)` : `${r.nombre} (${r.porcentajeActual} % hoy)`,
      moneda(r.monto),
    ]);
  }
  if (reparto.pedidosConOtroReparto > 0) {
    filasResumen.push([
      `${reparto.pedidosConOtroReparto} pedido(s) se confirmaron con otros porcentajes: se respeta el reparto de ese día.`,
    ]);
  }

  const resumen: Hoja = {
    nombre: "Resumen",
    encabezado: false,
    columnas: [{ titulo: "", ancho: 44 }, { titulo: "", ancho: 34 }, { titulo: "", ancho: 16 }],
    filas: filasResumen,
    filasDestacadas: destacadas,
  };

  // ── Pedidos ────────────────────────────────────────────────
  const pedidos: Hoja = {
    nombre: "Pedidos",
    columnas: [
      { titulo: "Código", ancho: 11 },
      { titulo: "Estado", ancho: 11 },
      { titulo: "Llegó", ancho: 17 },
      { titulo: "Confirmado", ancho: 17 },
      { titulo: "Entregado", ancho: 17 },
      { titulo: "Cliente", ancho: 22 },
      { titulo: "Ciudad / barrio", ancho: 24 },
      ...COLUMNAS_CIFRAS,
    ],
    filas: d.pedidos.map((p) => [
      p.codigo,
      ESTADO[p.estado],
      fechaHoraLocal(p.created_at),
      p.confirmado_at ? fechaHoraLocal(p.confirmado_at) : null,
      p.entregado_at ? fechaHoraLocal(p.entregado_at) : null,
      p.cliente_nombre,
      p.cliente_ciudad,
      ...cifras({
        pedidos: 1,
        unidades: p.items.reduce((s, i) => s + i.cantidad, 0),
        ventas: p.total_venta,
        costo: p.total_costo,
        ganancia: p.ganancia,
      }),
    ]),
    totales: ["TOTAL", `${t.pedidos} pedidos`, null, null, null, null, null, ...cifras(t)],
  };

  // ── Detalle (una fila por producto de cada pedido) ─────────
  const detalle: Hoja = {
    nombre: "Detalle",
    columnas: [
      { titulo: "Confirmado", ancho: 17 },
      { titulo: "Código", ancho: 11 },
      { titulo: "Cliente", ancho: 22 },
      { titulo: "Producto", ancho: 32 },
      { titulo: "Categoría", ancho: 16 },
      { titulo: "Cantidad", formato: "entero", ancho: 10 },
      { titulo: "Precio unitario", formato: "moneda", ancho: 15 },
      { titulo: "Costo unitario", formato: "moneda", ancho: 15 },
      { titulo: "Venta", formato: "moneda", ancho: 14 },
      { titulo: "Costo", formato: "moneda", ancho: 14 },
      { titulo: "Ganancia", formato: "moneda", ancho: 14 },
      { titulo: "Margen", formato: "porcentaje", ancho: 10 },
    ],
    filas: d.pedidos.flatMap((p) =>
      p.items.map((i) => {
        const venta = i.cantidad * i.precio_unitario;
        const costo = i.cantidad * i.costo_unitario;
        return [
          p.confirmado_at ? fechaHoraLocal(p.confirmado_at) : null,
          p.codigo,
          p.cliente_nombre,
          i.nombre_snapshot,
          (i.producto_id && d.categoriaDe(i.producto_id)) || "Sin categoría",
          i.cantidad,
          i.precio_unitario,
          i.costo_unitario,
          venta,
          costo,
          venta - costo,
          margen({ ventas: venta, ganancia: venta - costo }),
        ];
      }),
    ),
    totales: ["TOTAL", null, null, null, null, t.unidades, null, null, t.ventas, t.costo, t.ganancia, margen(t)],
  };

  // ── Por producto (ranking) ─────────────────────────────────
  const porProducto: Hoja = {
    nombre: "Por producto",
    columnas: [
      { titulo: "Puesto", formato: "entero", ancho: 8 },
      { titulo: "Producto", ancho: 32 },
      { titulo: "Categoría", ancho: 16 },
      { titulo: "Pedidos", formato: "entero", ancho: 9 },
      ...COLUMNAS_CIFRAS,
      { titulo: "% de las ventas", formato: "porcentaje", ancho: 14 },
    ],
    filas: e.porProducto.map((p, i) => [
      i + 1,
      p.nombre,
      p.categoria,
      p.pedidos,
      ...cifras(p),
      t.ventas ? p.ventas / t.ventas : 0,
    ]),
    totales: ["TOTAL", `${e.porProducto.length} productos`, null, t.pedidos, ...cifras(t), t.ventas ? 1 : 0],
  };

  // ── Por categoría ──────────────────────────────────────────
  const porCategoria: Hoja = {
    nombre: "Por categoría",
    columnas: [
      { titulo: "Categoría", ancho: 22 },
      { titulo: "Pedidos", formato: "entero", ancho: 9 },
      ...COLUMNAS_CIFRAS,
      { titulo: "% de las ventas", formato: "porcentaje", ancho: 14 },
    ],
    filas: e.porCategoria.map((c) => [c.nombre, c.pedidos, ...cifras(c), t.ventas ? c.ventas / t.ventas : 0]),
    totales: ["TOTAL", t.pedidos, ...cifras(t), t.ventas ? 1 : 0],
  };

  // ── Por día ────────────────────────────────────────────────
  const COLUMNAS_GRUPO = [
    { titulo: "Pedidos", formato: "entero", ancho: 9 },
    ...COLUMNAS_CIFRAS,
    { titulo: "Ticket promedio", formato: "moneda", ancho: 15 },
  ] as const;
  const grupo = (g: Totales): Celda[] => [g.pedidos, ...cifras(g), g.pedidos ? Math.round(g.ventas / g.pedidos) : 0];
  const totalGrupo = grupo(t);

  const porDia: Hoja = {
    nombre: "Por día",
    columnas: [{ titulo: "Fecha", ancho: 12 }, { titulo: "Día", ancho: 11 }, ...COLUMNAS_GRUPO],
    filas: e.porDia.map((x) => [x.fecha, x.dia, ...grupo(x)]),
    totales: ["TOTAL", null, ...totalGrupo],
  };

  const porDiaSemana: Hoja = {
    nombre: "Por día de la semana",
    columnas: [{ titulo: "Día", ancho: 12 }, ...COLUMNAS_GRUPO],
    filas: e.porDiaSemana.map((x) => [x.nombre, ...grupo(x)]),
    totales: ["TOTAL", ...totalGrupo],
  };

  const porCiudad: Hoja = {
    nombre: "Por ciudad",
    columnas: [{ titulo: "Ciudad / barrio", ancho: 28 }, ...COLUMNAS_GRUPO],
    filas: e.porCiudad.map((x) => [x.nombre, ...grupo(x)]),
    totales: ["TOTAL", ...totalGrupo],
  };

  // ── Reparto por pedido (una columna por socio) ─────────────
  const columnasSocios = reparto.filas;
  const repartoSocios: Hoja = {
    nombre: "Reparto socios",
    columnas: [
      { titulo: "Código", ancho: 11 },
      { titulo: "Confirmado", ancho: 17 },
      { titulo: "Ganancia", formato: "moneda", ancho: 14 },
      ...columnasSocios.map((s) => ({ titulo: s.nombre, formato: "moneda" as const, ancho: 16 })),
    ],
    filas: d.pedidos.map((p) => {
      const porSocio = new Map(p.reparto.map((r) => [r.socio_id ?? `nombre:${r.socio_nombre}`, r.monto]));
      return [
        p.codigo,
        p.confirmado_at ? fechaHoraLocal(p.confirmado_at) : null,
        p.ganancia,
        ...columnasSocios.map((s) => porSocio.get(s.clave) ?? 0),
      ];
    }),
    totales: ["TOTAL", null, t.ganancia, ...columnasSocios.map((s) => s.monto)],
  };

  return [resumen, pedidos, detalle, porProducto, porCategoria, porDia, porDiaSemana, porCiudad, repartoSocios];
}

/** "reporte-ventas-2026-09-01-a-2026-09-26.xlsx" */
export function nombreArchivoReporte(desde: string, hasta: string): string {
  return desde === hasta ? `reporte-ventas-${desde}.xlsx` : `reporte-ventas-${desde}-a-${hasta}.xlsx`;
}
