import { test } from "node:test";
import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { crc32, crearXlsx, crearZip, escaparXml, letraColumna, nombreHoja } from "./xlsx.ts";

/** Lee un ZIP generado por crearZip (sin extras) → { nombre: contenido }. Verifica el CRC. */
function leerZip(zip: Uint8Array): Record<string, string> {
  const vista = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const archivos: Record<string, string> = {};
  let i = 0;
  while (vista.getUint32(i, true) === 0x04034b50) {
    const crc = vista.getUint32(i + 14, true);
    const tamComprimido = vista.getUint32(i + 18, true);
    const tamNombre = vista.getUint16(i + 26, true);
    const nombre = new TextDecoder().decode(zip.subarray(i + 30, i + 30 + tamNombre));
    const inicio = i + 30 + tamNombre;
    const datos = inflateRawSync(zip.subarray(inicio, inicio + tamComprimido));
    assert.equal(crc32(datos), crc, `CRC de ${nombre}`);
    archivos[nombre] = new TextDecoder().decode(datos);
    i = inicio + tamComprimido;
  }
  return archivos;
}

test("CRC-32 estándar", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  assert.equal(crc32(new Uint8Array()), 0);
});

test("letras de columna", () => {
  assert.equal(letraColumna(0), "A");
  assert.equal(letraColumna(25), "Z");
  assert.equal(letraColumna(26), "AA");
  assert.equal(letraColumna(27), "AB");
  assert.equal(letraColumna(701), "ZZ");
  assert.equal(letraColumna(702), "AAA");
});

test("escapa XML y quita caracteres de control", () => {
  assert.equal(escaparXml(`A & B <c> "d"\u0001`), "A &amp; B &lt;c&gt; &quot;d&quot;");
  assert.equal(escaparXml("Línea 1\nLínea 2"), "Línea 1\nLínea 2");
});

test("nombres de hoja válidos", () => {
  assert.equal(nombreHoja("Ventas: 2026/09"), "Ventas  2026 09");
  assert.equal(nombreHoja("x".repeat(40)).length, 31);
  assert.equal(nombreHoja("  "), "Hoja");
});

test("el ZIP se puede leer y su estructura es la de un .xlsx", () => {
  const archivos = leerZip(
    crearXlsx([
      {
        nombre: "Pedidos",
        columnas: [
          { titulo: "Producto", ancho: 30 },
          { titulo: "Cantidad", formato: "entero" },
          { titulo: "Venta", formato: "moneda" },
          { titulo: "Margen", formato: "porcentaje" },
        ],
        filas: [
          ["Cargador <20W> & cable", 2, 40000, 0.4],
          ["Audífonos", 1, 53200, null],
        ],
        totales: ["TOTAL", 3, 93200, 0.35],
      },
      {
        nombre: "Resumen",
        encabezado: false,
        columnas: [{ titulo: "", ancho: 30 }, { titulo: "" }],
        filas: [["Reporte"], ["Margen", { valor: 0.25, formato: "porcentaje" }]],
      },
    ]),
  );

  assert.deepEqual(Object.keys(archivos), [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
    "xl/worksheets/sheet2.xml",
  ]);

  const libro = archivos["xl/workbook.xml"]!;
  assert.match(libro, /<sheet name="Pedidos" sheetId="1" r:id="rId1"\/>/);
  assert.match(libro, /<sheet name="Resumen" sheetId="2" r:id="rId2"\/>/);
  assert.match(libro, /_xlnm\._FilterDatabase" localSheetId="0" hidden="1">'Pedidos'!\$A\$1:\$D\$3</);

  const hoja1 = archivos["xl/worksheets/sheet1.xml"]!;
  // Encabezado con estilo, texto escapado, números con formato, total en negrita
  assert.match(hoja1, /<c r="A1" t="inlineStr" s="10"><is><t xml:space="preserve">Producto<\/t>/);
  assert.match(hoja1, /Cargador &lt;20W&gt; &amp; cable/);
  assert.match(hoja1, /<c r="B2" s="2"><v>2<\/v><\/c><c r="C2" s="1"><v>40000<\/v><\/c><c r="D2" s="4"><v>0.4<\/v><\/c>/);
  assert.doesNotMatch(hoja1, /r="D3"/); // celda vacía
  assert.match(hoja1, /<row r="4"><c r="A4" t="inlineStr" s="5">.*TOTAL.*<c r="C4" s="6"><v>93200<\/v>/);
  assert.match(hoja1, /<pane ySplit="1"/);
  assert.match(hoja1, /<autoFilter ref="A1:D3"\/>/);

  const hoja2 = archivos["xl/worksheets/sheet2.xml"]!;
  assert.match(hoja2, /<c r="A1" t="inlineStr" s="11">/); // título
  assert.match(hoja2, /<c r="B2" s="4"><v>0.25<\/v><\/c>/); // formato propio de la celda
  assert.doesNotMatch(hoja2, /autoFilter/);
});

test("nombres de hoja repetidos se numeran", () => {
  const archivos = leerZip(
    crearXlsx([
      { nombre: "Ventas", columnas: [], filas: [] },
      { nombre: "Ventas", columnas: [], filas: [] },
    ]),
  );
  assert.match(archivos["xl/workbook.xml"]!, /name="Ventas".*name="Ventas 2"/);
});

test("ZIP con varios archivos", () => {
  const archivos = leerZip(crearZip([["a.txt", "hola"], ["carpeta/b.txt", "ñandú"]]));
  assert.deepEqual(archivos, { "a.txt": "hola", "carpeta/b.txt": "ñandú" });
});
