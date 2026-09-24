"use client";

import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function BotonCerrarSesion({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await crearClienteNavegador().auth.signOut();
        // Recarga completa a propósito (no router.push): descarta todo lo que el navegador
        // guardó de la sesión anterior, como redirecciones de otra cuenta.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/admin/entrar");
      }}
      className={`rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium ${className}`}
    >
      Cerrar sesión
    </button>
  );
}
