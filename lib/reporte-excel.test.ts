import { test } from "node:test";
import assert from "node:assert/strict";
import { hojasReporte, nombreArchivoReporte } from "./reporte-excel.ts";
import type { PedidoVendido } from "./reporte.ts";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

const pedido = (codigo: string, cantidad: number, reparto: PedidoVendido["reparto"]): PedidoVendido => ({
  id: codigo,
  codigo,
  estado: "confirmado",
  cliente_nombre: "Laura",
  cliente_ciudad: "Bogotá",
  created_at: "2026-09-10T15:00:00Z",
  confirmado_at: "2026-09-10T16:00:00Z",
  entregado_at: null,
  total_venta: 20000 * cantidad,
  total_costo: 12000 * cantidad,
  ganancia: 8000 * cantidad,
  items: [{ producto_id: "p1", nombre_snapshot: "Cargador", cantidad, precio_unitario: 20000, costo_unitario: 12000 }],
  reparto,
});

const hojas = hojasReporte({
  nombreTienda: "DS",
  desde: "2026-09-01",
  hasta: "2026-09-30",
  generado: new Date("2026-09-26T17:00:00Z"),
  pedidos: [
    pedido("PED-0001", 1, [
      { socio_id: A, socio_nombre: "Angelo", porcentaje: 50, monto: 4000 },
      { socio_id: B, socio_nombre: "Daniel", porcentaje: 50, monto: 4000 },
    ]),
    pedido("PED-0002", 2, [
      { socio_id: A, socio_nombre: "Angelo", porcentaje: 60, monto: 9600 },
      { socio_id: B, socio_nombre: "Daniel", porcentaje: 40, monto: 6400 },
    ]),
  ],
  recibidos: { pendiente: 1, confirmado: 2, entregado: 0, cancelado: 1 },
  socios: [
    { id: A, nombre: "Angelo", porcentaje: 60, activo: true },
    { id: B, nombre: "Daniel", porcentaje: 40, activo: true },
  ],
  categoriaDe: () => "Cargadores",
});

const hoja = (nombre: string) => hojas.find((h) => h.nombre === nombre)!;
const texto = (celdas: unknown[][]) => JSON.stringify(celdas);

test("el reporte trae todas las hojas", () => {
  assert.deepEqual(
    hojas.map((h) => h.nombre),
    ["Resumen", "Pedidos", "Detalle", "Por producto", "Por categoría", "Por día", "Por día de la semana", "Por ciudad", "Reparto socios"],
  );
});

test("resumen: rango, totales, embudo y reparto", () => {
  const r = texto(hoja("Resumen").filas);
  assert.match(r, /Reporte de ventas — DS/);
  assert.match(r, /Del 1 de septiembre de 2026 al 30 de septiembre de 2026/);
  assert.match(r, /\["Ventas",\{"valor":60000,"formato":"moneda"\}\]/);
  assert.match(r, /\["Ganancia",\{"valor":24000,"formato":"moneda"\}\]/);
  assert.match(r, /\["Recibidos",\{"valor":4,"formato":"entero"\}\]/);
  assert.match(r, /\["Porcentaje que terminó en venta",\{"valor":0.5,"formato":"porcentaje"\}\]/);
  assert.match(r, /Cargador \(3 und\.\)/);
  assert.match(r, /\["Angelo \(60 % hoy\)",\{"valor":13600,"formato":"moneda"\}\]/);
  assert.match(r, /1 pedido\(s\) se confirmaron con otros porcentajes/);
});

test("pedidos, detalle y producto cuadran con los totales", () => {
  assert.equal(hoja("Pedidos").filas.length, 2);
  assert.deepEqual(hoja("Pedidos").totales!.slice(-5), [3, 60000, 36000, 24000, 0.4]);
  assert.deepEqual(hoja("Detalle").totales!.slice(-4), [60000, 36000, 24000, 0.4]);
  assert.deepEqual(hoja("Por producto").filas[0], [1, "Cargador", "Cargadores", 2, 3, 60000, 36000, 24000, 0.4, 1]);
  assert.equal(hoja("Por día de la semana").filas.length, 7);
});

test("reparto por pedido: una columna por socio y total", () => {
  const h = hoja("Reparto socios");
  assert.deepEqual(h.columnas.map((c) => c.titulo), ["Código", "Confirmado", "Ganancia", "Angelo", "Daniel"]);
  assert.deepEqual(h.filas[1], ["PED-0002", "2026-09-10 11:00", 16000, 9600, 6400]);
  assert.deepEqual(h.totales, ["TOTAL", null, 24000, 13600, 10400]);
});

test("nombre del archivo", () => {
  assert.equal(nombreArchivoReporte("2026-09-01", "2026-09-30"), "reporte-ventas-2026-09-01-a-2026-09-30.xlsx");
  assert.equal(nombreArchivoReporte("2026-09-26", "2026-09-26"), "reporte-ventas-2026-09-26.xlsx");
});
