// Convierte la descripción de un producto (texto plano) en bloques para mostrarla ordenada:
// párrafos, y listas con título cuando el texto trae secciones con viñetas ("• ").

export type ItemLista = { etiqueta: string | null; texto: string };
export type BloqueDescripcion =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; titulo: string | null; items: ItemLista[] };

const esViñeta = (linea: string) => /^[•\-*]\s+/.test(linea);
const sinViñeta = (linea: string) => linea.replace(/^[•\-*]\s+/, "");

function parsearItem(linea: string): ItemLista {
  const texto = sinViñeta(linea);
  const m = /^([^:]{2,40}):\s+(.+)$/.exec(texto);
  return m && m[1] && m[2] ? { etiqueta: m[1], texto: m[2] } : { etiqueta: null, texto };
}

export function parsearDescripcion(descripcion: string): BloqueDescripcion[] {
  return descripcion
    .split(/\n\s*\n/)
    .map((bloque) =>
      bloque
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((lineas) => lineas.length > 0)
    .map((lineas): BloqueDescripcion => {
      const [primera = "", ...resto] = lineas;
      if (lineas.every(esViñeta)) return { tipo: "lista", titulo: null, items: lineas.map(parsearItem) };
      if (!esViñeta(primera) && resto.length > 0 && resto.every(esViñeta)) {
        return { tipo: "lista", titulo: primera, items: resto.map(parsearItem) };
      }
      return { tipo: "parrafo", texto: lineas.join("\n") };
    });
}
