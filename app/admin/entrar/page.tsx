import type { Metadata } from "next";
import { Logo } from "@/components/tienda/Logo";
import { FormularioLogin } from "@/components/admin/FormularioLogin";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

function esRutaAdminValida(ruta: string | string[] | undefined): ruta is string {
  return typeof ruta === "string" && ruta.startsWith("/admin") && !ruta.startsWith("//");
}

export default async function EntrarAdmin({ searchParams }: PageProps<"/admin/entrar">) {
  const params = await searchParams;
  const siguiente = esRutaAdminValida(params.siguiente) ? params.siguiente : "/admin";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo tamano="lg" />
      <h1 className="text-base font-semibold text-neutral-600">Panel de administración</h1>
      <FormularioLogin siguiente={siguiente} />
    </main>
  );
}
