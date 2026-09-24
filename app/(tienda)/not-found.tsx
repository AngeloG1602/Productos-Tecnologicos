import Link from "next/link";

export default function ProductoNoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-bold">No encontramos este producto</h1>
      <p className="text-sm text-neutral-600">Puede que ya no esté disponible.</p>
      <Link href="/" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Ver el catálogo
      </Link>
    </div>
  );
}
