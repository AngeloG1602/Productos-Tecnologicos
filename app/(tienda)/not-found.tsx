import Link from "next/link";

export default function ProductoNoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-bold">No encontramos este producto</h1>
      <p className="text-sm text-suave">Puede que ya no esté disponible.</p>
      <Link href="/" className="rounded-lg bg-texto px-4 py-2 text-sm font-medium text-fondo">
        Ver el catálogo
      </Link>
    </div>
  );
}
