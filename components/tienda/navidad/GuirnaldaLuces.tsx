const COLORES = ["#ef4444", "#facc15", "#22c55e", "#38bdf8"];

/**
 * Guirnalda de luces que se repite a lo ancho. Dos capas con las luces alternadas titilan
 * a contratiempo (una se apaga mientras la otra se enciende).
 */
export function GuirnaldaLuces({ className = "" }: { className?: string }) {
  const luces = COLORES.map((color, i) => ({ color, x: 10 + i * 20, y: i % 2 === 0 ? 16 : 11 }));
  return (
    <div aria-hidden="true" className={`pointer-events-none h-8 w-full ${className}`}>
      {[0, 1].map((capa) => (
        <svg key={capa} className={`absolute inset-0 h-full w-full ${capa === 0 ? "luz-a" : "luz-b"}`}>
          <defs>
            <pattern id={`guirnalda-${capa}`} width="80" height="32" patternUnits="userSpaceOnUse">
              {capa === 0 && <path d="M0 6 Q20 22 40 6 T80 6" fill="none" stroke="#14532d" strokeWidth="1.6" />}
              {luces
                .filter((_, i) => i % 2 === capa)
                .map((l) => (
                  <g key={l.x}>
                    <circle cx={l.x} cy={l.y} r="7" fill={l.color} opacity="0.28" />
                    <rect x={l.x - 1.6} y={l.y - 7} width="3.2" height="4" rx="1" fill="#14532d" />
                    <ellipse cx={l.x} cy={l.y + 0.5} rx="3.4" ry="4.4" fill={l.color} />
                  </g>
                ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#guirnalda-${capa})`} />
        </svg>
      ))}
    </div>
  );
}
