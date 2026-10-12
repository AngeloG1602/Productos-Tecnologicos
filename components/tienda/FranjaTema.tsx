import type { Tema } from "@/lib/temas";
import { IconoTema } from "./IconoTema";

/** Franja de temporada arriba de la tienda. No se muestra si el tema no trae mensaje (ver lib/temas.ts). */
export function FranjaTema({ tema }: { tema: Tema }) {
  if (!tema.banner) return null;
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-semibold text-white"
      style={{ background: tema.marca }}
    >
      <IconoTema nombre={tema.icono} className="h-4 w-4 shrink-0" />
      <span>{tema.banner}</span>
    </div>
  );
}
