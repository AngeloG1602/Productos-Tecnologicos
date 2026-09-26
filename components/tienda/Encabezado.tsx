import Link from "next/link";
import { BotonCarrito } from "@/components/carrito/BotonCarrito";
import { Logo } from "@/components/tienda/Logo";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="Ir al inicio">
          <Logo tamano="sm" />
        </Link>
        <BotonCarrito />
      </div>
    </header>
  );
}
