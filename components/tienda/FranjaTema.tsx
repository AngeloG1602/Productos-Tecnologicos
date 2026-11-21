import type { Tema } from "@/lib/temas";
import { CuentaRegresiva } from "./CuentaRegresiva";
import { IconoTema } from "./IconoTema";

/** Franja de temporada arriba de la tienda. No se muestra si el tema no trae mensaje (ver lib/temas.ts). */
export function FranjaTema({ tema }: { tema: Tema }) {
  if (!tema.banner) return null;
  const oscuro = tema.slug === "black-friday";
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-semibold ${
        oscuro ? "text-[#0a0a0a]" : "text-[#ffffff]"
      }`}
      style={{ background: tema.marca }}
    >
      <span className="flex items-center gap-2">
        <IconoTema nombre={tema.icono} className="h-4 w-4 shrink-0" />
        <span>{tema.banner}</span>
      </span>
      {tema.finaliza && (
        <span className="hidden items-center gap-2 sm:flex">
          <span className="text-xs font-medium opacity-80">Termina en</span>
          <span className="rounded-lg bg-black/85 px-2 py-0.5 text-[#ffffff]">
            <CuentaRegresiva hasta={tema.finaliza} etiquetas={false} />
          </span>
        </span>
      )}
    </div>
  );
}
