// Catálogo de temas visuales de la tienda pública. Cada uno define sus colores
// (--marca y --marca-suave) y sus decoraciones (ícono, franja de temporada,
// borde/esquinas de las tarjetas de producto); cambiar o agregar un tema no
// toca nada más del sitio. El logo NO sigue el tema (ver components/tienda/Logo.tsx).
//
// Si agregas uno nuevo aquí, agrega también su bloque `[data-tema="..."]` en
// app/globals.css con los mismos colores y el estilo de tarjeta (ver el comentario allí),
// y su ícono en components/tienda/IconoTema.tsx.

export type IconoTema = "rayo" | "etiqueta" | "copo" | "calabaza" | "hoja" | "sol";

export type Tema = {
  slug: string;
  nombre: string;
  categoria: "clasico" | "temporada" | "estilo";
  marca: string;
  marcaSuave: string;
  icono: IconoTema;
  /** Mensaje de la franja arriba de la tienda. null = sin franja (Clásico y los de "estilo", que no son de una fecha puntual). */
  banner: string | null;
};

export const TEMAS: Tema[] = [
  { slug: "clasico", nombre: "Clásico", categoria: "clasico", marca: "#031c52", marcaSuave: "#e7ebf3", icono: "rayo", banner: null },
  {
    slug: "black-friday",
    nombre: "Black Friday",
    categoria: "temporada",
    marca: "#0a0a0a",
    marcaSuave: "#fef3c7",
    icono: "etiqueta",
    banner: "Black Friday: ofertas por tiempo limitado",
  },
  {
    slug: "navidad",
    nombre: "Navidad",
    categoria: "temporada",
    marca: "#b91c1c",
    marcaSuave: "#dcfce7",
    icono: "copo",
    banner: "Feliz Navidad de parte de todo el equipo",
  },
  {
    slug: "halloween",
    nombre: "Halloween",
    categoria: "temporada",
    marca: "#581c87",
    marcaSuave: "#ffedd5",
    icono: "calabaza",
    banner: "Edición especial de Halloween",
  },
  { slug: "esmeralda", nombre: "Esmeralda", categoria: "estilo", marca: "#065f46", marcaSuave: "#ecfdf5", icono: "hoja", banner: null },
  { slug: "atardecer", nombre: "Atardecer", categoria: "estilo", marca: "#9a3412", marcaSuave: "#fff1f2", icono: "sol", banner: null },
];

export const TEMA_POR_DEFECTO = "clasico";

export function obtenerTema(slug: string): Tema {
  return TEMAS.find((t) => t.slug === slug) ?? TEMAS.find((t) => t.slug === TEMA_POR_DEFECTO)!;
}

export function esTemaValido(slug: string): boolean {
  return TEMAS.some((t) => t.slug === slug);
}
