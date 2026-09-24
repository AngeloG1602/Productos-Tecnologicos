import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-xl font-bold">Página no encontrada</h1>
      <p className="text-sm text-neutral-600">
        Lo que buscas no existe o ya no está disponible.
      </p>
      <Link href="/" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Volver al inicio
      </Link>
    </main>
  );
}
