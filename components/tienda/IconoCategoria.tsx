// Íconos de línea para las categorías de la portada. Se eligen por palabras del slug
// (las categorías las crea el admin), con una etiqueta genérica si ninguna coincide.

type Nombre =
  | "rayo" | "cable" | "audifonos" | "parlante" | "bateria" | "celular" | "tablet" | "reloj"
  | "tv" | "patineta" | "belleza" | "enchufe" | "etiqueta";

const PALABRAS: [Nombre, RegExp][] = [
  ["cable", /cable/],
  ["rayo", /cargador/],
  ["audifonos", /audifono|auricular|manos-libres/],
  ["parlante", /parlante|sonido|bocina/],
  ["bateria", /power|bateria|banco/],
  ["celular", /celular|telefono|smartphone/],
  ["tablet", /tablet/],
  ["reloj", /reloj/],
  ["tv", /televisor|tdt|\btv\b/],
  ["patineta", /movilidad|juguete|patin/],
  ["belleza", /cuidado|belleza|personal|cabello/],
  ["enchufe", /accesorio/],
];

export function nombreIconoCategoria(slug: string): Nombre {
  return PALABRAS.find(([, re]) => re.test(slug))?.[0] ?? "etiqueta";
}

export function IconoCategoria({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CONTENIDO[nombreIconoCategoria(slug)]}
    </svg>
  );
}

const CONTENIDO: Record<Nombre, React.ReactNode> = {
  rayo: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  cable: (
    <>
      <path d="M8 3v5M12 3v5M6 8h8v3a4 4 0 0 1-8 0V8Z" transform="translate(1 0)" />
      <path d="M11 15v2a3 3 0 0 0 3 3h3" />
    </>
  ),
  audifonos: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  parlante: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="3" />
      <circle cx="12" cy="14.5" r="3" />
      <circle cx="12" cy="7.5" r="0.8" />
    </>
  ),
  bateria: (
    <>
      <rect x="3" y="7" width="16" height="10" rx="2" />
      <path d="M21 10.5v3M10 9.5 8 12h4l-2 2.5" />
    </>
  ),
  celular: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  tablet: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  reloj: (
    <>
      <rect x="7" y="6.5" width="10" height="11" rx="3" />
      <path d="M9 6.5 10 3h4l1 3.5M9 17.5 10 21h4l1-3.5M12 10v2.5l1.5 1" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  patineta: (
    <>
      <path d="M16 3h3l-1.5 12M7 15h10" />
      <circle cx="7" cy="18.5" r="2" />
      <circle cx="17" cy="18.5" r="2" />
    </>
  ),
  belleza: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
      <path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
    </>
  ),
  enchufe: (
    <>
      <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8Z" />
      <path d="M12 17v4" />
    </>
  ),
  etiqueta: (
    <>
      <path d="M3 3h7.6c.5 0 1 .2 1.4.6l8.4 8.4a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0L3.6 12A2 2 0 0 1 3 10.6V3Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
};
