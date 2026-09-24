"use client";

import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function BotonCerrarSesion({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await crearClienteNavegador().auth.signOut();
        router.replace("/admin/entrar");
        router.refresh();
      }}
      className={`rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium ${className}`}
    >
      Cerrar sesión
    </button>
  );
}
