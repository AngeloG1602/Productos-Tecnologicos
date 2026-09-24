"use client";

import { useState, useTransition } from "react";
import type { SocioAdmin } from "@/lib/admin/datos";
import { guardarSocios } from "@/app/admin/(panel)/socios/acciones";

type Fila = { clave: string; id: string | null; nombre: string; porcentaje: string; activo: boolean };

const aFilas = (socios: SocioAdmin[]): Fila[] =>
  socios.map((s) => ({ clave: s.id, id: s.id, nombre: s.nombre, porcentaje: String(Number(s.porcentaje)), activo: s.activo }));

const leerPorcentaje = (texto: string) => {
  const limpio = texto.trim().replace(",", ".");
  return /^\d{1,3}(\.\d{1,2})?$/.test(limpio) ? Number(limpio) : null;
};

export function EditorSocios({ socios }: { socios: SocioAdmin[] }) {
  // Después de guardar se usa la lista que devuelve el servidor (con los ids nuevos),
  // sin recargar la página: así no se pisa lo que el admin siga escribiendo.
  const [filas, setFilas] = useState(() => aFilas(socios));
  const [guardando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const suma = Math.round(filas.filter((f) => f.activo).reduce((t, f) => t + (leerPorcentaje(f.porcentaje) ?? 0), 0) * 100) / 100;
  const todasValidas = filas.every((f) => f.nombre.trim() && (leerPorcentaje(f.porcentaje) ?? 0) > 0);
  const listo = filas.length > 0 && todasValidas && suma === 100;

  const cambiar = (clave: string, cambio: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));

  function guardar() {
    setMensaje(null);
    iniciar(async () => {
      const r = await guardarSocios(
        filas.map((f) => ({ id: f.id, nombre: f.nombre.trim(), porcentaje: leerPorcentaje(f.porcentaje) ?? 0, activo: f.activo })),
      );
      if (r.ok) {
        setFilas(aFilas(r.socios));
        setMensaje({ tipo: "ok", texto: "Socios guardados." });
      } else {
        setMensaje({ tipo: "error", texto: r.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={guardando} className="contents">
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {filas.map((f) => (
            <li key={f.clave} className={`flex flex-wrap items-center gap-2 p-3 ${f.activo ? "" : "opacity-60"}`}>
              <input
                aria-label="Nombre del socio"
                value={f.nombre}
                maxLength={80}
                placeholder="Nombre"
                onChange={(e) => cambiar(f.clave, { nombre: e.target.value })}
                className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 text-base"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  aria-label={`Porcentaje de ${f.nombre || "este socio"}`}
                  value={f.porcentaje}
                  inputMode="decimal"
                  onChange={(e) => cambiar(f.clave, { porcentaje: e.target.value })}
                  className="h-10 w-20 rounded-lg border border-neutral-300 px-2 text-right text-base"
                />
                %
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={f.activo}
                  onChange={(e) => cambiar(f.clave, { activo: e.target.checked })}
                  className="h-4 w-4 accent-marca"
                />
                Activo
              </label>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() =>
            setFilas((fs) => [...fs, { clave: crypto.randomUUID(), id: null, nombre: "", porcentaje: "", activo: true }])
          }
          className="w-fit text-sm text-marca"
        >
          + Agregar socio
        </button>
      </fieldset>

      <p className={`text-sm font-medium ${suma === 100 ? "text-green-700" : "text-red-700"}`}>
        Suma de socios activos: {suma}% {suma === 100 ? "✓" : "(debe ser 100 %)"}
      </p>

      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${mensaje.tipo === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {mensaje.texto}
        </p>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={!listo || guardando}
        className="h-12 rounded-xl bg-marca text-base font-semibold text-white disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar socios"}
      </button>
      <p className="text-xs text-neutral-500">
        Para sacar a un socio del reparto, desmárcalo como activo (su historial en pedidos anteriores se conserva).
      </p>
    </div>
  );
}
