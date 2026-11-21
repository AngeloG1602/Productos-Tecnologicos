/** Árbol de Navidad estilizado (formas simples) con estrella y esferas. */
export function ArbolNavidad({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      <rect x="92" y="206" width="16" height="26" rx="3" fill="#7c4a1e" />
      <path d="M100 52 150 112H128l32 44H136l38 54H26l38-54H40l32-44H50L100 52Z" fill="#15803d" />
      <path d="M100 52 150 112H128l32 44H136l38 54H100V52Z" fill="#166534" opacity="0.55" />
      <path d="m100 14 5.600 11.400 12.600 1.800-9.100 8.900 2.200 12.500L100 42.700l-11.300 5.900 2.200-12.500-9.100-8.900 12.600-1.800L100 14Z" fill="#facc15" />
      <circle cx="82" cy="120" r="5.500" fill="#ef4444" />
      <circle cx="116" cy="98" r="5" fill="#facc15" />
      <circle cx="108" cy="150" r="6" fill="#38bdf8" />
      <circle cx="70" cy="178" r="6" fill="#facc15" />
      <circle cx="132" cy="182" r="6" fill="#ef4444" />
      <circle cx="98" cy="200" r="5.500" fill="#e5e7eb" />
    </svg>
  );
}

/** Esfera colgante (se balancea desde arriba). */
export function Esfera({ color, cuerda = 40, className }: { color: string; cuerda?: number; className?: string }) {
  return (
    <svg viewBox={`0 0 36 ${cuerda + 40}`} className={`adorno ${className ?? ""}`} aria-hidden="true">
      <line x1="18" y1="0" x2="18" y2={cuerda} stroke="#d4a017" strokeWidth="1.5" />
      <rect x="14" y={cuerda - 2} width="8" height="6" rx="1.500" fill="#d4a017" />
      <circle cx="18" cy={cuerda + 18} r="15" fill={color} />
      <path d={`M9 ${cuerda + 12}a11 11 0 0 1 8-5`} stroke="#fff" strokeOpacity="0.7" strokeWidth="2.500" strokeLinecap="round" fill="none" />
    </svg>
  );
}
