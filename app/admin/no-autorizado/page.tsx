import type { Metadata } from "next";
import { BotonCerrarSesion } from "@/components/admin/BotonCerrarSesion";

export const metadata: Metadata = { title: "No autorizado", robots: { index: false } };

export default function NoAutorizado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-xl font-bold">Esta cuenta no es administradora</h1>
      <p className="max-w-sm text-sm text-neutral-600">
        Tu sesión inició bien, pero este correo no está autorizado en el panel. Pide a un administrador que te
        agregue, o cierra sesión e intenta con otra cuenta.
      </p>
      <BotonCerrarSesion />
    </main>
  );
}
