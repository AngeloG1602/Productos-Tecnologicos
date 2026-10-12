"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DistribuidorAdmin } from "@/lib/admin/datos";
import {
  crearOBuscarDistribuidor,
  eliminarDistribuidor,
  renombrarDistribuidor,
} from "@/app/admin/(panel)/distribuidores/acciones";

export function ListaDistribuidores({ distribuidores: iniciales }: { distribuidores: DistribuidorAdmin[] }) {
  const router = useRouter();
  const [distribuidores, setDistribuidores] = useState(iniciales);
  // Ver el comentario equivalente en ListaProductos.tsx.
  const [inicialesPrevios, setInicialesPrevios] = useState(iniciales);
  if (iniciales !== inicialesPrevios) {
    setInicialesPrevios(iniciales);
    setDistribuidores(iniciales);
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
      const r = await crearOBuscarDistribuidor(nombre);
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
          placeholder="Nuevo distribuidor"
          maxLength={80}
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

      {distribuidores.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay distribuidores.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {distribuidores.map((distribuidor) => (
            <FilaDistribuidor
              key={distribuidor.id}
              distribuidor={distribuidor}
              onCambiar={(nombre) =>
                setDistribuidores((ds) => ds.map((d) => (d.id === distribuidor.id ? { ...d, nombre } : d)))
              }
              onEliminar={() => setDistribuidores((ds) => ds.filter((d) => d.id !== distribuidor.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaDistribuidor({
  distribuidor,
  onCambiar,
  onEliminar,
}: {
  distribuidor: DistribuidorAdmin;
  onCambiar: (nombre: string) => void;
  onEliminar: () => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(distribuidor.nombre);
  const [pendiente, iniciarTransicion] = useTransition();

  function guardar() {
    const limpio = nombre.trim();
    if (!limpio || limpio === distribuidor.nombre) return setEditando(false);
    iniciarTransicion(async () => {
      const r = await renombrarDistribuidor(distribuidor.id, limpio);
      if (r.ok) {
        onCambiar(limpio);
        setEditando(false);
        router.refresh();
      } else {
        setNombre(distribuidor.nombre);
      }
    });
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar "${distribuidor.nombre}"? Los productos que lo tenían quedan sin distribuidor.`)) return;
    iniciarTransicion(async () => {
      const r = await eliminarDistribuidor(distribuidor.id);
      if (r.ok) {
        onEliminar();
        router.refresh();
      }
    });
  }

  return (
    <li className="flex items-center gap-2 p-3">
      {editando ? (
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={guardar}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          autoFocus
          disabled={pendiente}
          maxLength={80}
          className="h-9 flex-1 rounded-lg border border-neutral-300 px-2 text-sm"
        />
      ) : (
        <button type="button" onClick={() => setEditando(true)} className="flex-1 text-left text-sm">
          {distribuidor.nombre}
        </button>
      )}

      <button type="button" onClick={eliminar} disabled={pendiente} className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700">
        Eliminar
      </button>
    </li>
  );
}
