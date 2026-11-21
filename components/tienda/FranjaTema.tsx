import type { Tema } from "@/lib/temas";
import { CuentaRegresiva } from "./CuentaRegresiva";
import { IconoTema } from "./IconoTema";
import { GuirnaldaLuces } from "./navidad/GuirnaldaLuces";

/** Franja de temporada arriba de la tienda. No se muestra si el tema no trae mensaje (ver lib/temas.ts). */
export function FranjaTema({ tema }: { tema: Tema }) {
  if (!tema.banner) return null;
  const oscuro = tema.slug === "black-friday";
  const navidad = tema.slug === "navidad";
  return (
    <div
      className={`relative z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-semibold ${
        oscuro ? "text-[#0a0a0a]" : navidad ? "text-[#fff8ea]" : "text-[#ffffff]"
      }`}
      style={{ background: navidad ? "#0f3d2e" : tema.marca }}
    >
      <span className="flex items-center gap-2">
        <IconoTema nombre={tema.icono} className="h-4 w-4 shrink-0" />
        <span>{tema.banner}</span>
      </span>
      {tema.finaliza && (
        <span className="hidden items-center gap-2 sm:flex">
          <span className="text-xs font-medium opacity-80">{tema.cuentaEtiqueta ?? "Termina en"}</span>
          <span className="rounded-lg bg-black/85 px-2 py-0.5 text-[#ffffff]">
            <CuentaRegresiva hasta={tema.finaliza} etiquetas={false} />
          </span>
        </span>
      )}
      {navidad && <GuirnaldaLuces className="absolute inset-x-0 top-full" />}
    </div>
  );
}
