import Link from "next/link";
import { BotonCarrito } from "@/components/carrito/BotonCarrito";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Tienda
        </Link>
        <BotonCarrito />
      </div>
    </header>
  );
}
