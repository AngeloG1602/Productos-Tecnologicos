// Catálogo de temas visuales de la tienda pública. Cada uno solo define los
// mismos dos colores que ya existen en app/globals.css (--marca y --marca-suave);
// cambiar o agregar un tema no toca nada más del sitio.
//
// Si agregas uno nuevo aquí, agrega también su bloque `[data-tema="..."]` en
// app/globals.css con los mismos colores (ver el comentario allí).

export type Tema = {
  slug: string;
  nombre: string;
  categoria: "clasico" | "temporada" | "estilo";
  marca: string;
  marcaSuave: string;
};

export const TEMAS: Tema[] = [
  { slug: "clasico", nombre: "Clásico", categoria: "clasico", marca: "#031c52", marcaSuave: "#e7ebf3" },
  { slug: "black-friday", nombre: "Black Friday", categoria: "temporada", marca: "#0a0a0a", marcaSuave: "#fef3c7" },
  { slug: "navidad", nombre: "Navidad", categoria: "temporada", marca: "#b91c1c", marcaSuave: "#dcfce7" },
  { slug: "halloween", nombre: "Halloween", categoria: "temporada", marca: "#581c87", marcaSuave: "#ffedd5" },
  { slug: "esmeralda", nombre: "Esmeralda", categoria: "estilo", marca: "#065f46", marcaSuave: "#ecfdf5" },
  { slug: "atardecer", nombre: "Atardecer", categoria: "estilo", marca: "#9a3412", marcaSuave: "#fff1f2" },
];

export const TEMA_POR_DEFECTO = "clasico";

export function obtenerTema(slug: string): Tema {
  return TEMAS.find((t) => t.slug === slug) ?? TEMAS.find((t) => t.slug === TEMA_POR_DEFECTO)!;
}

export function esTemaValido(slug: string): boolean {
  return TEMAS.some((t) => t.slug === slug);
}
