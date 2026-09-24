"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

const MENSAJE_GENERICO = "No pudimos iniciar sesión. Verifica el correo y la contraseña.";

export function FormularioLogin({ siguiente }: { siguiente: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError(null);

    const formulario = new FormData(evento.currentTarget);
    const correo = String(formulario.get("correo") ?? "").trim();
    const contrasena = String(formulario.get("contrasena") ?? "");

    const { error: errorSesion } = await crearClienteNavegador().auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    if (errorSesion) {
      setError(MENSAJE_GENERICO);
      setCargando(false);
      return;
    }

    // El proxy decide a dónde ir según si eres admin (también protege /admin/no-autorizado).
    router.replace(siguiente);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="correo" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="h-11 rounded-xl border border-neutral-300 px-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contrasena" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-xl border border-neutral-300 px-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="h-12 rounded-xl bg-neutral-900 text-base font-semibold text-white disabled:opacity-60"
      >
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
