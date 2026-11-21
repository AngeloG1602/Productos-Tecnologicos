import type { ConfiguracionPublica } from "@/lib/catalogo";
import { CIUDAD_TIENDA } from "@/lib/tienda";
import { IconoUbicacion } from "./IconoUbicacion";
import { IconoWhatsApp } from "./IconoWhatsApp";

/**
 * Razones para confiar, bajo la portada. Los datos de entrega y medios de pago salen de
 * Configuración (admin); si no están cargados, ese punto no se muestra en vez de inventar algo.
 */
export function FranjaConfianza({ configuracion }: { configuracion: ConfiguracionPublica }) {
  const { metodos_pago, tiempo_entrega } = configuracion.legal;
  const puntos: { icono: React.ReactNode; titulo: string; detalle: string }[] = [
    {
      icono: <IconoUbicacion className="h-5 w-5" />,
      titulo: `Somos de ${CIUDAD_TIENDA}`,
      detalle: "Un negocio de tu ciudad",
    },
    {
      icono: <IconoWhatsApp className="h-5 w-5" />,
      titulo: "Pide por WhatsApp",
      detalle: "Atención directa y personal",
    },
  ];
  puntos.push({
    icono: <Check />,
    titulo: "Compra sin registro",
    detalle: "Arma tu pedido y envíalo",
  });
  if (tiempo_entrega.trim()) {
    puntos.push({ icono: <Camion />, titulo: "Entrega", detalle: tiempo_entrega.trim() });
  } else if (metodos_pago.trim()) {
    puntos.push({ icono: <Billete />, titulo: "Medios de pago", detalle: metodos_pago.trim() });
  }

  return (
    <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 [&>li:last-child:nth-child(odd)]:col-span-2 lg:[&>li:last-child:nth-child(odd)]:col-span-1">
      {puntos.map((p) => (
        <li key={p.titulo} className="flex items-center gap-3 rounded-2xl border border-borde bg-superficie p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marca-suave text-acento">{p.icono}</span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm leading-tight font-bold">{p.titulo}</span>
            <span className="line-clamp-2 text-xs leading-snug text-suave">{p.detalle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...trazo} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}
function Camion() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...trazo} aria-hidden="true">
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}
function Billete() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...trazo} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
