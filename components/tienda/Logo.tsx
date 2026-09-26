import { NOMBRE_TIENDA } from "@/lib/tienda";

// Icono de rayo (energía/electrónica) + nombre con la primera letra en el color de marca.
// Mismo ícono que app/icon.tsx (favicon) y app/(tienda)/opengraph-image.tsx, para que la
// marca se vea igual en la pestaña del navegador, el encabezado y al compartir un enlace.

const TAMANOS = {
  sm: { icono: "h-8 w-8 rounded-lg", rayo: "h-4 w-4", texto: "text-lg", gap: "gap-2" },
  lg: { icono: "h-14 w-14 rounded-2xl", rayo: "h-7 w-7", texto: "text-3xl", gap: "gap-3" },
} as const;

export function Logo({ tamano = "sm" }: { tamano?: keyof typeof TAMANOS }) {
  const t = TAMANOS[tamano];
  return (
    <span className={`inline-flex items-center ${t.gap}`}>
      <span className={`flex shrink-0 items-center justify-center bg-marca ${t.icono}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className={`${t.rayo} text-white`}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="currentColor" />
        </svg>
      </span>
      <span className={`font-bold tracking-tight text-neutral-950 ${t.texto}`}>
        <span className="text-marca">{NOMBRE_TIENDA.charAt(0)}</span>
        {NOMBRE_TIENDA.slice(1)}
      </span>
    </span>
  );
}
