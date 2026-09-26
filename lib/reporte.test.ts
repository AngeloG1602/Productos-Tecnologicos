import { test } from "node:test";
import assert from "node:assert/strict";
import { estadisticas, margen, mayor, repartoPorSocio, type PedidoVendido, type SocioActual } from "./reporte.ts";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const C = "00000000-0000-0000-0000-00000000000c";
const CARGADOR = "10000000-0000-0000-0000-000000000001";
const CABLE = "10000000-0000-0000-0000-000000000002";

function pedido(p: Partial<PedidoVendido> & Pick<PedidoVendido, "codigo" | "items">): PedidoVendido {
  const ventas = p.items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
  const costo = p.items.reduce((s, i) => s + i.cantidad * i.costo_unitario, 0);
  return {
    id: p.codigo,
    estado: "confirmado",
    cliente_nombre: "Cliente",
    cliente_ciudad: "Bogotá",
    created_at: "2026-09-10T15:00:00Z",
    confirmado_at: "2026-09-10T17:00:00Z",
    entregado_at: null,
    total_venta: ventas,
    total_costo: costo,
    ganancia: ventas - costo,
    reparto: [],
    ...p,
  };
}

const cargador = (cantidad: number) => ({ producto_id: CARGADOR, nombre_snapshot: "Cargador 20W", cantidad, precio_unitario: 20000, costo_unitario: 12000 });
const cable = (cantidad: number) => ({ producto_id: CABLE, nombre_snapshot: "Cable USB-C", cantidad, precio_unitario: 10000, costo_unitario: 4000 });

const socios: SocioActual[] = [
  { id: A, nombre: "Angelo", porcentaje: 60, activo: true },
  { id: B, nombre: "Daniel", porcentaje: 40, activo: true },
  { id: C, nombre: "Socio viejo", porcentaje: 50, activo: false },
];

test("reparto: usa el nombre actual del socio y muestra su porcentaje de hoy", () => {
  const pedidos = [
    // Confirmado cuando A se llamaba "Socio 1" y el reparto era 50/50 con C
    pedido({
      codigo: "PED-0001",
      items: [cargador(1)],
      reparto: [
        { socio_id: A, socio_nombre: "Socio 1", porcentaje: 50, monto: 4000 },
        { socio_id: C, socio_nombre: "Socio 2", porcentaje: 50, monto: 4000 },
      ],
    }),
    // Confirmado con el reparto actual 60/40
    pedido({
      codigo: "PED-0002",
      items: [cable(2)],
      reparto: [
        { socio_id: A, socio_nombre: "Angelo", porcentaje: 60, monto: 7200 },
        { socio_id: B, socio_nombre: "Daniel", porcentaje: 40, monto: 4800 },
      ],
    }),
  ];
  const r = repartoPorSocio(pedidos, socios);
  assert.deepEqual(
    r.filas.map((f) => [f.nombre, f.porcentajeActual, f.activo, f.monto]),
    [
      ["Angelo", 60, true, 11200],
      ["Daniel", 40, true, 4800],
      ["Socio viejo", null, false, 4000],
    ],
  );
  assert.equal(r.pedidosConOtroReparto, 1);
});

test("reparto: sin ventas aparecen los socios activos en 0", () => {
  const r = repartoPorSocio([], socios);
  assert.deepEqual(
    r.filas.map((f) => [f.nombre, f.porcentajeActual, f.monto]),
    [
      ["Angelo", 60, 0],
      ["Daniel", 40, 0],
    ],
  );
  assert.equal(r.pedidosConOtroReparto, 0);
});

test("reparto: socio borrado (sin id) se agrupa por el nombre guardado", () => {
  const r = repartoPorSocio(
    [pedido({ codigo: "PED-0003", items: [cable(1)], reparto: [{ socio_id: null, socio_nombre: "Ex socio", porcentaje: 100, monto: 6000 }] })],
    socios,
  );
  assert.deepEqual(r.filas.at(-1), { clave: "nombre:Ex socio", nombre: "Ex socio", porcentajeActual: null, activo: false, monto: 6000 });
  assert.equal(r.pedidosConOtroReparto, 1);
});

test("estadísticas: totales, productos, días, ciudades y categorías", () => {
  const pedidos = [
    pedido({ codigo: "PED-0001", items: [cargador(1), cable(1)], cliente_ciudad: "Bogotá " }),
    pedido({ codigo: "PED-0002", items: [cable(3)], cliente_ciudad: "bogotá", confirmado_at: "2026-09-12T02:00:00Z" }),
    pedido({ codigo: "PED-0003", items: [cargador(2)], cliente_ciudad: "Cali", created_at: "2026-09-12T15:00:00Z", confirmado_at: "2026-09-12T19:00:00Z" }),
  ];
  const e = estadisticas(pedidos, (id) => (id === CARGADOR ? "Cargadores" : undefined));

  // 20.000 + 10.000 + 30.000 + 40.000 = 100.000; costo 12.000 + 4.000 + 12.000 + 24.000 = 52.000
  assert.deepEqual(e.totales, { pedidos: 3, unidades: 7, ventas: 100000, costo: 52000, ganancia: 48000 });
  assert.equal(margen(e.totales), 0.48);
  assert.equal(e.ticketPromedio, 33333);
  assert.equal(e.unidadesPorPedido, 7 / 3);
  // Horas hasta confirmar: 2, 35 y 4 → 41 / 3
  assert.equal(e.horasPromedioConfirmacion, 41 / 3);

  // Más vendido por unidades: cable (4) antes que cargador (3)
  assert.deepEqual(
    e.porProducto.map((p) => [p.nombre, p.categoria, p.unidades, p.pedidos, p.ventas, p.ganancia]),
    [
      ["Cable USB-C", "Sin categoría", 4, 2, 40000, 24000],
      ["Cargador 20W", "Cargadores", 3, 2, 60000, 24000],
    ],
  );
  assert.deepEqual(
    e.porCategoria.map((c) => [c.nombre, c.ventas, c.pedidos]),
    [
      ["Cargadores", 60000, 2],
      ["Sin categoría", 40000, 2],
    ],
  );
  // El PED-0002 se confirmó a las 9 p. m. del 11 en Bogotá (02:00 UTC del 12)
  assert.deepEqual(
    e.porDia.map((d) => [d.fecha, d.dia, d.pedidos, d.ventas]),
    [
      ["2026-09-10", "jueves", 1, 30000],
      ["2026-09-11", "viernes", 1, 30000],
      ["2026-09-12", "sábado", 1, 40000],
    ],
  );
  assert.equal(e.porDiaSemana.length, 7);
  assert.equal(e.porDiaSemana[0]?.nombre, "lunes");
  assert.equal(e.porDiaSemana.find((d) => d.nombre === "sábado")!.ventas, 40000);
  // "Bogotá " y "bogotá" son la misma ciudad
  assert.deepEqual(
    e.porCiudad.map((c) => [c.nombre, c.pedidos, c.ventas]),
    [
      ["Bogotá", 2, 60000],
      ["Cali", 1, 40000],
    ],
  );
});

test("estadísticas: sin pedidos todo queda en cero", () => {
  const e = estadisticas([], () => undefined);
  assert.deepEqual(e.totales, { pedidos: 0, unidades: 0, ventas: 0, costo: 0, ganancia: 0 });
  assert.equal(e.ticketPromedio, 0);
  assert.equal(e.horasPromedioConfirmacion, null);
  assert.equal(margen(e.totales), 0);
  assert.equal(mayor(e.porDiaSemana, (d) => d.ventas), null);
});

test("mayor: devuelve el de mayor valor", () => {
  assert.deepEqual(mayor([{ v: 1 }, { v: 5 }, { v: 3 }], (x) => x.v), { v: 5 });
});
