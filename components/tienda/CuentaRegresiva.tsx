"use client";

import { useSyncExternalStore } from "react";

// Cuenta regresiva hasta una fecha. Usa un "reloj" externo (un intervalo de 1 s) en vez de
// estado + efecto: en el servidor no pinta nada (snapshot null), así no hay diferencia de hora
// entre servidor y navegador, y al terminar la fecha desaparece sola.

function suscribir(avisar: () => void) {
  const id = setInterval(avisar, 1000);
  return () => clearInterval(id);
}
const segundosActuales = () => Math.floor(Date.now() / 1000);
const servidor = () => null;

export function CuentaRegresiva({ hasta, etiquetas = true }: { hasta: string; etiquetas?: boolean }) {
  const ahora = useSyncExternalStore(suscribir, segundosActuales, servidor);
  const fin = Math.floor(new Date(hasta).getTime() / 1000);
  if (ahora === null || Number.isNaN(fin) || fin <= ahora) return null;

  const resto = fin - ahora;
  const partes = [
    { valor: Math.floor(resto / 86400), nombre: "días" },
    { valor: Math.floor((resto % 86400) / 3600), nombre: "horas" },
    { valor: Math.floor((resto % 3600) / 60), nombre: "min" },
    { valor: resto % 60, nombre: "seg" },
  ];

  return (
    <div role="timer" aria-label="Tiempo restante de la oferta" className="flex items-center gap-1.5">
      {partes.map((p) => (
        <div key={p.nombre} className="flex min-w-11 flex-col items-center rounded-lg bg-[rgb(255_255_255/0.1)] px-1.5 py-1 ring-1 ring-[rgb(255_255_255/0.15)]">
          <span className="text-base leading-none font-extrabold tabular-nums">{String(p.valor).padStart(2, "0")}</span>
          {etiquetas && <span className="mt-0.5 text-[10px] leading-none tracking-wide uppercase opacity-70">{p.nombre}</span>}
        </div>
      ))}
    </div>
  );
}
