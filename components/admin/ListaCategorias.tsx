"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CategoriaAdmin } from "@/lib/admin/datos";
import { generarSlug } from "@/lib/slug";
import { crearCategoria, eliminarCategoria, moverCategoria, renombrarCategoria } from "@/app/admin/(panel)/categorias/acciones";

export function ListaCategorias({ categorias: iniciales }: { categorias: CategoriaAdmin[] }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(iniciales);
  // Ver el comentario equivalente en ListaProductos.tsx.
  const [inicialesPrevios, setInicialesPrevios] = useState(iniciales);
  if (iniciales !== inicialesPrevios) {
    setInicialesPrevios(iniciales);
    setCategorias(iniciales);
  }
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    setError(null);
    iniciarTransicion(async () => {
      const r = await crearCategoria(nombre, generarSlug(nombre));
      if (r.ok) {
        setNombreNuevo("");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={agregar} className="flex gap-2">
        <input
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          placeholder="Nueva categoría"
          className="h-11 flex-1 rounded-xl border border-neutral-300 px-3 text-base"
        />
        <button type="submit" disabled={pendiente} className="rounded-xl bg-marca px-4 text-sm font-semibold text-white disabled:opacity-60">
          Agregar
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {categorias.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay categorías.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {categorias.map((categoria, indice) => (
            <FilaCategoria
              key={categoria.id}
              categoria={categoria}
              esPrimera={indice === 0}
              esUltima={indice === categorias.length - 1}
              onCambiar={(nombre) => setCategorias((cs) => cs.map((c) => (c.id === categoria.id ? { ...c, nombre } : c)))}
              onEliminar={() => setCategorias((cs) => cs.filter((c) => c.id !== categoria.id))}
              onMover={(direccion) => {
                setCategorias((cs) => {
                  const i = cs.findIndex((c) => c.id === categoria.id);
                  const j = direccion === "subir" ? i - 1 : i + 1;
                  if (j < 0 || j >= cs.length) return cs;
                  const copia = [...cs];
                  [copia[i], copia[j]] = [copia[j]!, copia[i]!];
                  return copia;
                });
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaCategoria({
  categoria,
  esPrimera,
  esUltima,
  onCambiar,
  onEliminar,
  onMover,
}: {
  categoria: CategoriaAdmin;
  esPrimera: boolean;
  esUltima: boolean;
  onCambiar: (nombre: string) => void;
  onEliminar: () => void;
  onMover: (direccion: "subir" | "bajar") => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(categoria.nombre);
  const [pendiente, iniciarTransicion] = useTransition();

  function guardar() {
    const limpio = nombre.trim();
    if (!limpio || limpio === categoria.nombre) return setEditando(false);
    iniciarTransicion(async () => {
      const r = await renombrarCategoria(categoria.id, limpio);
      if (r.ok) {
        onCambiar(limpio);
        setEditando(false);
        router.refresh();
      } else {
        setNombre(categoria.nombre);
      }
    });
  }

  function mover(direccion: "subir" | "bajar") {
    onMover(direccion);
    iniciarTransicion(async () => {
      await moverCategoria(categoria.id, direccion);
      router.refresh();
    });
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar "${categoria.nombre}"? Sus productos quedan sin categoría.`)) return;
    iniciarTransicion(async () => {
      const r = await eliminarCategoria(categoria.id);
      if (r.ok) {
        onEliminar();
        router.refresh();
      }
    });
  }

  return (
    <li className="flex items-center gap-2 p-3">
      <div className="flex flex-col">
        <button type="button" onClick={() => mover("subir")} disabled={esPrimera || pendiente} aria-label="Subir" className="text-neutral-500 disabled:opacity-30">
          ▲
        </button>
        <button type="button" onClick={() => mover("bajar")} disabled={esUltima || pendiente} aria-label="Bajar" className="text-neutral-500 disabled:opacity-30">
          ▼
        </button>
      </div>

      {editando ? (
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={guardar}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          autoFocus
          disabled={pendiente}
          className="h-9 flex-1 rounded-lg border border-neutral-300 px-2 text-sm"
        />
      ) : (
        <button type="button" onClick={() => setEditando(true)} className="flex-1 text-left text-sm">
          {categoria.nombre}
        </button>
      )}

      <button type="button" onClick={eliminar} disabled={pendiente} className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700">
        Eliminar
      </button>
    </li>
  );
}
