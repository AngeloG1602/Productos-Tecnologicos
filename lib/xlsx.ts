// Generador mínimo de archivos Excel (.xlsx) sin librerías externas.
// Un .xlsx es un ZIP con archivos XML (Office Open XML). Aquí se arma lo justo:
// varias hojas, texto y números, formatos de moneda / entero / porcentaje, fila de
// encabezado fija con filtros, fila de totales en negrita y anchos de columna.
// Lo abren Excel, Google Sheets, LibreOffice y Numbers.

import { deflateRawSync } from "node:zlib";

export type Formato = "texto" | "moneda" | "entero" | "decimal" | "porcentaje";

/** Un valor, o un número con formato propio (para hojas de "indicador → valor"). */
export type Celda = string | number | null | { valor: number; formato: Formato };

export type Columna = { titulo: string; ancho?: number; formato?: Formato };

export type Hoja = {
  nombre: string;
  columnas: Columna[];
  filas: Celda[][];
  /** Fila final en negrita (ej. TOTAL). */
  totales?: Celda[];
  /** Filas (índice desde 0 en `filas`) que van en negrita, como subtítulos. */
  filasDestacadas?: number[];
  /** false = sin encabezado ni filtros (hojas de resumen armadas a mano). */
  encabezado?: boolean;
};

// ─────────────────────────────────────────────────────────────
// Estilos (índices de cellXfs en styles.xml)
// ─────────────────────────────────────────────────────────────

const ESTILO = {
  normal: { texto: 0, moneda: 1, entero: 2, decimal: 3, porcentaje: 4 },
  negrita: { texto: 5, moneda: 6, entero: 7, decimal: 8, porcentaje: 9 },
  encabezado: 10,
  titulo: 11,
} as const;

const ESTILOS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;$&quot; #,##0"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="#,##0.0"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D4ED8"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="166" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// ─────────────────────────────────────────────────────────────
// XML de las hojas
// ─────────────────────────────────────────────────────────────

/** Escapa texto para XML y quita caracteres de control que Excel no acepta. */
export function escaparXml(texto: string): string {
  return texto
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 0 → "A", 25 → "Z", 26 → "AA". */
export function letraColumna(indice: number): string {
  let n = indice + 1;
  let letras = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    letras = String.fromCharCode(65 + r) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

/** Nombre de hoja válido para Excel: sin []:*?/\ y máximo 31 caracteres. */
export function nombreHoja(nombre: string): string {
  return nombre.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Hoja";
}

function celdaXml(ref: string, celda: Celda, formatoColumna: Formato, negrita: boolean, estiloFijo?: number): string {
  if (celda === null || celda === "") return "";
  const grupo = negrita ? ESTILO.negrita : ESTILO.normal;
  if (typeof celda === "string") {
    const s = estiloFijo ?? grupo.texto;
    return `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ""}><is><t xml:space="preserve">${escaparXml(celda)}</t></is></c>`;
  }
  const [valor, formato] = typeof celda === "number" ? [celda, formatoColumna] : [celda.valor, celda.formato];
  if (!Number.isFinite(valor)) return "";
  const s = estiloFijo ?? grupo[formato === "texto" ? "entero" : formato];
  return `<c r="${ref}"${s ? ` s="${s}"` : ""}><v>${valor}</v></c>`;
}

function filaXml(numero: number, celdas: Celda[], columnas: Columna[], negrita: boolean, estiloFijo?: number): string {
  const contenido = celdas
    .map((c, i) => celdaXml(`${letraColumna(i)}${numero}`, c, columnas[i]?.formato ?? "texto", negrita, estiloFijo))
    .join("");
  return `<row r="${numero}">${contenido}</row>`;
}

function hojaXml(hoja: Hoja): { xml: string; rangoFiltro: string | null } {
  const encabezado = hoja.encabezado !== false;
  const destacadas = new Set(hoja.filasDestacadas ?? []);
  const filas: string[] = [];
  let n = 1;

  if (encabezado) {
    filas.push(filaXml(n++, hoja.columnas.map((c) => c.titulo), hoja.columnas, false, ESTILO.encabezado));
  }
  hoja.filas.forEach((f, i) => {
    // En hojas sin encabezado, la primera fila es el título
    const esTitulo = !encabezado && i === 0;
    filas.push(filaXml(n++, f, hoja.columnas, destacadas.has(i), esTitulo ? ESTILO.titulo : undefined));
  });
  const ultimaFilaDatos = n - 1;
  if (hoja.totales) filas.push(filaXml(n++, hoja.totales, hoja.columnas, true));

  const ultimaColumna = letraColumna(Math.max(hoja.columnas.length, 1) - 1);
  const rangoFiltro = encabezado && hoja.filas.length > 0 ? `A1:${ultimaColumna}${ultimaFilaDatos}` : null;

  const cols = hoja.columnas
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.ancho ?? 14}" customWidth="1"/>`)
    .join("");
  const vista = encabezado
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;

  const xml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    vista +
    (cols ? `<cols>${cols}</cols>` : "") +
    `<sheetData>${filas.join("")}</sheetData>` +
    (rangoFiltro ? `<autoFilter ref="${rangoFiltro}"/>` : "") +
    `</worksheet>`;
  return { xml, rangoFiltro };
}

// ─────────────────────────────────────────────────────────────
// Libro
// ─────────────────────────────────────────────────────────────

/** Arma el archivo .xlsx completo. */
export function crearXlsx(hojas: Hoja[]): Uint8Array<ArrayBuffer> {
  if (hojas.length === 0) throw new Error("El libro necesita al menos una hoja.");

  const nombres: string[] = [];
  for (const h of hojas) {
    let nombre = nombreHoja(h.nombre);
    for (let k = 2; nombres.includes(nombre); k++) nombre = `${nombreHoja(h.nombre).slice(0, 28)} ${k}`;
    nombres.push(nombre);
  }

  const archivos: [string, string][] = [];
  const nombresDefinidos: string[] = [];

  hojas.forEach((h, i) => {
    const { xml, rangoFiltro } = hojaXml(h);
    archivos.push([`xl/worksheets/sheet${i + 1}.xml`, xml]);
    if (rangoFiltro) {
      const [desde, hasta] = rangoFiltro.split(":");
      const abs = (r: string) => r.replace(/([A-Z]+)(\d+)/, "$$$1$$$2");
      nombresDefinidos.push(
        `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escaparXml(nombres[i]!.replace(/'/g, "''"))}'!${abs(desde!)}:${abs(hasta!)}</definedName>`,
      );
    }
  });

  const tipos =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    hojas
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("") +
    `</Types>`;

  const relsRaiz =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const libro =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>${nombres.map((n, i) => `<sheet name="${escaparXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
    (nombresDefinidos.length ? `<definedNames>${nombresDefinidos.join("")}</definedNames>` : "") +
    `</workbook>`;

  const relsLibro =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    hojas
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("") +
    `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  return crearZip([
    ["[Content_Types].xml", tipos],
    ["_rels/.rels", relsRaiz],
    ["xl/workbook.xml", libro],
    ["xl/_rels/workbook.xml.rels", relsLibro],
    ["xl/styles.xml", ESTILOS_XML],
    ...archivos,
  ]);
}

// ─────────────────────────────────────────────────────────────
// ZIP (formato PKZIP con compresión deflate)
// ─────────────────────────────────────────────────────────────

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(datos: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of datos) c = TABLA_CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Fecha fija (1 de enero de 2026, 00:00) en formato MS-DOS: el archivo sale igual cada vez.
const FECHA_DOS = ((2026 - 1980) << 9) | (1 << 5) | 1;
const HORA_DOS = 0;

export function crearZip(archivos: [string, string | Uint8Array][]): Uint8Array<ArrayBuffer> {
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let desplazamiento = 0;

  for (const [nombre, contenido] of archivos) {
    const nombreBytes = new TextEncoder().encode(nombre);
    const datos = typeof contenido === "string" ? new TextEncoder().encode(contenido) : contenido;
    const comprimido = deflateRawSync(datos);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // versión necesaria
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint16(8, 8, true); // deflate
    local.setUint16(10, HORA_DOS, true);
    local.setUint16(12, FECHA_DOS, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, comprimido.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombreBytes.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nombreBytes, comprimido);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true); // versión que lo creó
    cd.setUint16(6, 20, true); // versión necesaria
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 8, true);
    cd.setUint16(12, HORA_DOS, true);
    cd.setUint16(14, FECHA_DOS, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, comprimido.length, true);
    cd.setUint32(24, datos.length, true);
    cd.setUint16(28, nombreBytes.length, true);
    cd.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(cd.buffer), nombreBytes);

    desplazamiento += 30 + nombreBytes.length + comprimido.length;
  }

  const tamanoCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamanoCentral, true);
  fin.setUint32(16, desplazamiento, true);

  const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
  const salida = new Uint8Array(todo.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of todo) {
    salida.set(p, i);
    i += p.length;
  }
  return salida;
}
