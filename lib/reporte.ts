// Cálculos de ventas para el Inicio del panel y el reporte en Excel.
// Solo cuentan pedidos confirmados o entregados (RN-07), con los precios, costos y
// reparto congelados en cada pedido (RN-06, RN-07). Montos en pesos enteros.

import { diaSemana, fechaLocal } from "./fechas.ts";

export type ItemVendido = {
  producto_id: string | null;
  nombre_snapshot: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
};

export type RepartoPedido = {
  socio_id: string | null;
  socio_nombre: string;
  porcentaje: number;
  monto: number;
};

export type PedidoVendido = {
  id: string;
  codigo: string;
  estado: "pendiente" | "confirmado" | "entregado" | "cancelado";
  cliente_nombre: string;
  cliente_ciudad: string;
  created_at: string;
  confirmado_at: string | null;
  entregado_at: string | null;
  total_venta: number;
  total_costo: number;
  ganancia: number;
  items: ItemVendido[];
  reparto: RepartoPedido[];
};

export type SocioActual = { id: string; nombre: string; porcentaje: number; activo: boolean };

// ─────────────────────────────────────────────────────────────
// Reparto entre socios
// ─────────────────────────────────────────────────────────────

export type FilaReparto = {
  /** socio_id, o "nombre:<nombre>" si el socio ya no existe. */
  clave: string;
  /** Nombre actual del socio (si se renombró, se ve el nombre nuevo). */
  nombre: string;
  /** Porcentaje que tiene hoy; null si ya no es socio activo. */
  porcentajeActual: number | null;
  activo: boolean;
  /** Suma de lo que le tocó en los pedidos del periodo (congelado al confirmar cada uno). */
  monto: number;
};

export type ResumenReparto = {
  filas: FilaReparto[];
  /** Pedidos del periodo confirmados con otro reparto (otros socios o porcentajes). */
  pedidosConOtroReparto: number;
};

const claveReparto = (r: RepartoPedido) => r.socio_id ?? `nombre:${r.socio_nombre}`;

/**
 * Agrupa el reparto de los pedidos por socio. Los socios activos aparecen siempre (aunque
 * no haya ventas), con su nombre y porcentaje actuales; los que ya no están aparecen solo si
 * les tocó algo en el periodo.
 */
export function repartoPorSocio(pedidos: PedidoVendido[], socios: SocioActual[]): ResumenReparto {
  const porClave = new Map<string, FilaReparto>();
  const activos = socios.filter((s) => s.activo);

  for (const s of activos) {
    porClave.set(s.id, { clave: s.id, nombre: s.nombre, porcentajeActual: Number(s.porcentaje), activo: true, monto: 0 });
  }

  const nombreActual = new Map(socios.map((s) => [s.id, s.nombre]));
  const repartoActual = new Map(activos.map((s) => [s.id, Number(s.porcentaje)]));
  let pedidosConOtroReparto = 0;

  for (const p of pedidos) {
    let distinto = p.reparto.length !== repartoActual.size;
    for (const r of p.reparto) {
      const clave = claveReparto(r);
      const fila =
        porClave.get(clave) ??
        porClave
          .set(clave, {
            clave,
            nombre: (r.socio_id && nombreActual.get(r.socio_id)) || r.socio_nombre,
            porcentajeActual: null,
            activo: false,
            monto: 0,
          })
          .get(clave)!;
      fila.monto += r.monto;
      if (!r.socio_id || repartoActual.get(r.socio_id) !== Number(r.porcentaje)) distinto = true;
    }
    if (distinto && p.reparto.length > 0) pedidosConOtroReparto++;
  }

  const orden = new Map(activos.map((s, i) => [s.id, i]));
  const filas = [...porClave.values()]
    .filter((f) => f.activo || f.monto !== 0)
    .sort((a, b) =>
      a.activo !== b.activo
        ? a.activo
          ? -1
          : 1
        : a.activo
          ? orden.get(a.clave)! - orden.get(b.clave)!
          : b.monto - a.monto,
    );

  return { filas, pedidosConOtroReparto };
}

// ─────────────────────────────────────────────────────────────
// Estadísticas
// ─────────────────────────────────────────────────────────────

export type Totales = {
  pedidos: number;
  unidades: number;
  ventas: number;
  costo: number;
  ganancia: number;
};

/** Ganancia / ventas (0 si no hubo ventas). Fracción: 0.25 = 25 %. */
export const margen = (t: { ventas: number; ganancia: number }) => (t.ventas > 0 ? t.ganancia / t.ventas : 0);

const vacio = (): Totales => ({ pedidos: 0, unidades: 0, ventas: 0, costo: 0, ganancia: 0 });

export type FilaProducto = Totales & { clave: string; nombre: string; categoria: string };
export type FilaGrupo = Totales & { nombre: string };
export type FilaDia = Totales & { fecha: string; dia: string };

export type Estadisticas = {
  totales: Totales;
  ticketPromedio: number;
  unidadesPorPedido: number;
  /** Horas promedio entre que llega el pedido y se confirma (null si no hay datos). */
  horasPromedioConfirmacion: number | null;
  porProducto: FilaProducto[];
  porCategoria: FilaGrupo[];
  porDia: FilaDia[];
  porDiaSemana: FilaGrupo[];
  porCiudad: FilaGrupo[];
};

const SIN_CATEGORIA = "Sin categoría";
const ORDEN_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Suma un ítem (venta, costo, ganancia y unidades) a un acumulado. */
function sumarItem(t: Totales, i: ItemVendido) {
  const venta = i.cantidad * i.precio_unitario;
  const costo = i.cantidad * i.costo_unitario;
  t.unidades += i.cantidad;
  t.ventas += venta;
  t.costo += costo;
  t.ganancia += venta - costo;
}

/** Suma un pedido completo (sus totales congelados) a un acumulado. */
function sumarPedido(t: Totales, p: PedidoVendido) {
  t.pedidos += 1;
  t.unidades += p.items.reduce((s, i) => s + i.cantidad, 0);
  t.ventas += p.total_venta;
  t.costo += p.total_costo;
  t.ganancia += p.ganancia;
}

function obtener<K, V>(mapa: Map<K, V>, clave: K, crear: () => V): V {
  let v = mapa.get(clave);
  if (v === undefined) mapa.set(clave, (v = crear()));
  return v;
}

/** Ordena por unidades y, en empate, por ventas (de mayor a menor). */
const porUnidades = (a: Totales, b: Totales) => b.unidades - a.unidades || b.ventas - a.ventas;

export function estadisticas(pedidos: PedidoVendido[], categoriaDe: (productoId: string) => string | undefined): Estadisticas {
  const totales = vacio();
  const productos = new Map<string, FilaProducto>();
  const categorias = new Map<string, FilaGrupo>();
  const dias = new Map<string, FilaDia>();
  const semana = new Map<string, FilaGrupo>(ORDEN_SEMANA.map((d) => [d, { ...vacio(), nombre: d }]));
  const ciudades = new Map<string, FilaGrupo>();
  let horas = 0;
  let conHoras = 0;

  for (const p of pedidos) {
    sumarPedido(totales, p);

    const fecha = fechaLocal(new Date(p.confirmado_at ?? p.created_at));
    sumarPedido(obtener(dias, fecha, () => ({ ...vacio(), fecha, dia: diaSemana(fecha) })), p);
    sumarPedido(semana.get(diaSemana(fecha))!, p);

    const ciudad = p.cliente_ciudad.trim() || "Sin ciudad";
    // Agrupa sin importar mayúsculas ni espacios de más
    const claveCiudad = ciudad.toLocaleLowerCase("es").replace(/\s+/g, " ");
    sumarPedido(obtener(ciudades, claveCiudad, () => ({ ...vacio(), nombre: ciudad })), p);

    if (p.confirmado_at) {
      horas += (Date.parse(p.confirmado_at) - Date.parse(p.created_at)) / 3_600_000;
      conHoras++;
    }

    const productosDelPedido = new Set<string>();
    const categoriasDelPedido = new Set<string>();
    for (const i of p.items) {
      const clave = i.producto_id ?? `nombre:${i.nombre_snapshot}`;
      const categoria = (i.producto_id && categoriaDe(i.producto_id)) || SIN_CATEGORIA;

      const fp = obtener(productos, clave, () => ({ ...vacio(), clave, nombre: i.nombre_snapshot, categoria }));
      sumarItem(fp, i);
      if (!productosDelPedido.has(clave)) {
        productosDelPedido.add(clave);
        fp.pedidos++;
      }

      const fc = obtener(categorias, categoria, () => ({ ...vacio(), nombre: categoria }));
      sumarItem(fc, i);
      if (!categoriasDelPedido.has(categoria)) {
        categoriasDelPedido.add(categoria);
        fc.pedidos++;
      }
    }
  }

  return {
    totales,
    ticketPromedio: totales.pedidos ? Math.round(totales.ventas / totales.pedidos) : 0,
    unidadesPorPedido: totales.pedidos ? totales.unidades / totales.pedidos : 0,
    horasPromedioConfirmacion: conHoras ? horas / conHoras : null,
    porProducto: [...productos.values()].sort(porUnidades),
    porCategoria: [...categorias.values()].sort((a, b) => b.ventas - a.ventas),
    porDia: [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    porDiaSemana: [...semana.values()],
    porCiudad: [...ciudades.values()].sort((a, b) => b.pedidos - a.pedidos || b.ventas - a.ventas),
  };
}

/** El elemento con el mayor valor según `valor` (null si la lista está vacía o todo es 0). */
export function mayor<T>(lista: T[], valor: (x: T) => number): T | null {
  let mejor: T | null = null;
  for (const x of lista) if (valor(x) > 0 && (mejor === null || valor(x) > valor(mejor))) mejor = x;
  return mejor;
}
