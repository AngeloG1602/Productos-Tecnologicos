import Image from "next/image";
import { urlImagen } from "@/lib/imagenes";

type Props = {
  ruta: string | undefined;
  alt: string;
  /** Ancho aproximado en pantalla, para que next/image elija el tamaño justo. */
  sizes: string;
  /** Precargar (solo la imagen principal visible al cargar la página). */
  preload?: boolean;
  className?: string;
};

/** Imagen cuadrada de producto, o un marcador neutro si no tiene imágenes. */
export function ImagenProducto({ ruta, alt, sizes, preload = false, className = "" }: Props) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-neutral-100 ${className}`}>
      {ruta ? (
        <Image
          src={urlImagen(ruta, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-neutral-300" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-4.5-4.5L6 21" />
          </svg>
        </div>
      )}
    </div>
  );
}
