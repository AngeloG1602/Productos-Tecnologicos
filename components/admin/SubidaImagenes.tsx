"use client";

import { useRef, useState } from "react";
import { BUCKET_PRODUCTOS, MAXIMO_IMAGENES_PRODUCTO, rutaImagenProducto } from "@/lib/imagenes";
import { comprimirImagen, ImagenInvalidaError } from "@/lib/imagen-cliente";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { ImagenProducto } from "@/components/tienda/ImagenProducto";

type Props = {
  /** Id del producto (ya generado, aunque todavía no se haya guardado). */
  productoId: string;
  imagenes: string[];
  onCambiar: (imagenes: string[]) => void;
};

/**
 * Hasta 4 fotos por producto (RF-11). Cada foto se redimensiona y comprime
 * en el navegador (RNF-02) antes de subirla a Storage; el formulario solo
 * guarda las rutas resultantes.
 */
export function SubidaImagenes({ productoId, imagenes, onCambiar }: Props) {
  const slots = Array.from({ length: MAXIMO_IMAGENES_PRODUCTO }, (_, i) => imagenes[i] ?? null);

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((ruta, indice) => (
        <Ranura
          key={indice}
          ruta={ruta}
          onSubir={(nuevaRuta) => {
            const copia = [...imagenes];
            copia[indice] = nuevaRuta;
            onCambiar(copia.filter(Boolean));
          }}
          onQuitar={() => {
            onCambiar(imagenes.filter((_, i) => i !== indice));
          }}
          subir={async (archivo) => {
            const blob = await comprimirImagen(archivo);
            const ruta = rutaImagenProducto(productoId, indice + 1);
            const { error } = await crearClienteNavegador()
              .storage.from(BUCKET_PRODUCTOS)
              .upload(ruta, blob, { upsert: true, contentType: "image/webp" });
            if (error) throw error;
            return ruta;
          }}
        />
      ))}
    </div>
  );
}

function Ranura({
  ruta,
  onSubir,
  onQuitar,
  subir,
}: {
  ruta: string | null;
  onSubir: (ruta: string) => void;
  onQuitar: () => void;
  subir: (archivo: File) => Promise<string>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setCargando(true);
    try {
      onSubir(await subir(archivo));
    } catch (e) {
      setError(e instanceof ImagenInvalidaError ? e.message : "No se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={cargando}
        className="relative aspect-square w-full overflow-hidden rounded-lg border border-dashed border-neutral-300"
      >
        {ruta ? (
          <ImagenProducto ruta={ruta} alt="" sizes="120px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl text-neutral-400">
            {cargando ? "…" : "+"}
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => alElegir(e.target.files?.[0])}
      />
      {ruta && !cargando && (
        <button type="button" onClick={onQuitar} className="text-xs text-red-700 underline">
          Quitar
        </button>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
