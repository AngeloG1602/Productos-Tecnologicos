import Link from "next/link";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Tienda
        </Link>
        {/* El botón del carrito llega en el Bloque 3 */}
      </div>
    </header>
  );
}
