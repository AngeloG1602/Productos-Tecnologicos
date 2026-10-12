import type { IconoTema as NombreIcono } from "@/lib/temas";

// Ícono decorativo de cada tema (franja de temporada, junto a "Destacados" e
// insignia en las tarjetas de producto). Formas simples a propósito: nada de
// recortes/huecos en un solo trazo, para que se vean bien a 16-20px.

export function IconoTema({
  nombre,
  className,
  style,
}: {
  nombre: NombreIcono;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden="true">
      {CONTENIDO[nombre]}
    </svg>
  );
}

const CONTENIDO: Record<NombreIcono, React.ReactNode> = {
  rayo: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="currentColor" />,
  etiqueta: (
    <path
      d="M3 3h7.59c.53 0 1.04.21 1.41.59l9 9a2 2 0 0 1 0 2.82l-6 6a2 2 0 0 1-2.82 0l-9-9A2 2 0 0 1 3 10.59Z"
      fill="currentColor"
    />
  ),
  copo: (
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="4.2" y1="7" x2="19.8" y2="17" />
      <line x1="19.8" y1="7" x2="4.2" y2="17" />
    </g>
  ),
  calabaza: (
    <g fill="currentColor">
      <rect x="10.5" y="2.5" width="3" height="5" rx="1.5" />
      <ellipse cx="12" cy="14" rx="8" ry="7" />
    </g>
  ),
  hoja: (
    <>
      <path d="M20 4C10 4 4 10 4 18c0 1.1.9 2 2 2 8 0 14-6 14-16Z" fill="currentColor" />
      <line x1="6.5" y1="17.5" x2="18" y2="6" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="23" />
        <line x1="1" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="23" y2="12" />
        <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
        <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
        <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
        <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
      </g>
    </>
  ),
};
