import { formatearCOP } from "@/lib/formato";
import { supabaseConfigurado } from "@/lib/env";

// Página de prueba del Bloque 0. Se reemplaza por el catálogo en el Bloque 2.
export default function Inicio() {
  const conSupabase = supabaseConfigurado();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold">Tienda</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Accesorios electrónicos. Muy pronto nuestro catálogo.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 p-4">
        <h2 className="text-base font-semibold">Estado del sitio</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between gap-4">
            <span>Aplicación</span>
            <span className="font-medium text-green-700">En línea</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Supabase</span>
            <span
              className={
                conSupabase
                  ? "font-medium text-green-700"
                  : "font-medium text-amber-700"
              }
            >
              {conSupabase ? "Configurado" : "Sin configurar"}
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Formato de precio</span>
            <span className="font-medium">{formatearCOP(16800)}</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
