import type { Metadata } from "next";
import { FormularioLogin } from "@/components/admin/FormularioLogin";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

function esRutaAdminValida(ruta: string | string[] | undefined): ruta is string {
  return typeof ruta === "string" && ruta.startsWith("/admin") && !ruta.startsWith("//");
}

export default async function EntrarAdmin({ searchParams }: PageProps<"/admin/entrar">) {
  const params = await searchParams;
  const siguiente = esRutaAdminValida(params.siguiente) ? params.siguiente : "/admin/productos";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <h1 className="text-xl font-bold">Panel de administración</h1>
      <FormularioLogin siguiente={siguiente} />
    </main>
  );
}
