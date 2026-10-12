"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TEMAS, type Tema } from "@/lib/temas";
import { guardarTema } from "@/app/admin/(panel)/configuracion/acciones";

const TITULO_CATEGORIA: Record<Tema["categoria"], string> = {
  clasico: "Por defecto",
  temporada: "De temporada",
  estilo: "Estilos",
};

export function SelectorTema({ temaActivo }: { temaActivo: string }) {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState(temaActivo);
  const [guardando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function elegir(tema: Tema) {
    if (tema.slug === seleccionado || guardando) return;
    setMensaje(null);
    iniciar(async () => {
      const r = await guardarTema(tema.slug);
      if (r.ok) {
        setSeleccionado(tema.slug);
        setMensaje({ tipo: "ok", texto: `Tema "${tema.nombre}" aplicado. La tienda ya lo muestra.` });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: r.error });
      }
    });
  }

  const categorias = ["clasico", "temporada", "estilo"] as const;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600">
        Cambia los colores de la tienda pública (inicio, catálogo, ficha, carrito). El panel admin no cambia.
      </p>

      {categorias.map((categoria) => {
        const temas = TEMAS.filter((t) => t.categoria === categoria);
        if (temas.length === 0) return null;
        return (
          <div key={categoria} className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{TITULO_CATEGORIA[categoria]}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {temas.map((tema) => {
                const activo = tema.slug === seleccionado;
                return (
                  <button
                    key={tema.slug}
                    type="button"
                    disabled={guardando}
                    onClick={() => elegir(tema)}
                    aria-pressed={activo}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium disabled:opacity-60 ${
                      activo ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: tema.marca }}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill={tema.marcaSuave} />
                      </svg>
                    </span>
                    <span>{tema.nombre}</span>
                    {activo && <span className="text-[10px] font-semibold text-neutral-500">Activo</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${mensaje.tipo === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
