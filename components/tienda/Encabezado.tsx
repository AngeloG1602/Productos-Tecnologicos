import Link from "next/link";
import { BotonCarrito } from "@/components/carrito/BotonCarrito";
import { Logo } from "@/components/tienda/Logo";
import { CIUDAD_TIENDA } from "@/lib/tienda";
import { IconoUbicacion } from "./IconoUbicacion";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-superficie/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="Ir al inicio" className="shrink-0">
          <Logo tamano="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 rounded-full bg-marca-suave px-2.5 py-1 text-xs font-semibold text-texto">
            <IconoUbicacion className="h-3.5 w-3.5 text-acento" />
            {CIUDAD_TIENDA}
          </span>
          <BotonCarrito />
        </div>
      </div>
    </header>
  );
}
