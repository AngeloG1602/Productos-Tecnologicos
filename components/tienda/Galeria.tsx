"use client";

import { useRef, useState } from "react";
import { ImagenProducto } from "./ImagenProducto";

/**
 * Galería deslizable (scroll-snap nativo: funciona con el dedo sin librerías).
 * Con más de una imagen muestra miniaturas para saltar directo a cada una.
 */
export function Galeria({ imagenes, nombre }: { imagenes: string[]; nombre: string }) {
  const carrusel = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return <ImagenProducto ruta={undefined} alt={nombre} sizes="100vw" className="rounded-xl" />;
  }

  const irA = (i: number) => {
    const el = carrusel.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={carrusel}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActual(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="sin-barra flex snap-x snap-mandatory overflow-x-auto rounded-xl"
        aria-label={`Imágenes de ${nombre}`}
      >
        {imagenes.map((ruta, i) => (
          <div key={ruta} className="w-full shrink-0 snap-center">
            <ImagenProducto
              ruta={ruta}
              alt={`${nombre} — imagen ${i + 1} de ${imagenes.length}`}
              sizes="(min-width: 768px) 480px, 100vw"
              preload={i === 0}
            />
          </div>
        ))}
      </div>

      {imagenes.length > 1 && (
        <div className="flex gap-2">
          {imagenes.map((ruta, i) => (
            <button
              key={ruta}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === actual}
              className={`w-16 overflow-hidden rounded-lg border-2 ${
                i === actual ? "border-neutral-900" : "border-transparent"
              }`}
            >
              <ImagenProducto ruta={ruta} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
