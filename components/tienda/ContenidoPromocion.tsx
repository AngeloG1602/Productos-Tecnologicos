import Link from "next/link";
import type { PromocionPublica } from "@/lib/catalogo";
import { ImagenProducto } from "./ImagenProducto";
import { PrecioProducto } from "./PrecioProducto";

/**
 * Contenido de la ventana de promoción (sin la lógica de cuándo mostrarse), para reutilizarlo en
 * la vista previa del panel. Con producto: foto, nombre y precio; sin producto: solo el mensaje.
 */
export function ContenidoPromocion({
  promo,
  alAbrir,
  alRechazar,
}: {
  promo: PromocionPublica;
  /** Se llama al pulsar el botón principal (la ventana se cierra y se recuerda). */
  alAbrir?: () => void;
  alRechazar?: () => void;
}) {
  const { producto } = promo;
  const destino = producto ? `/producto/${producto.slug}` : "/#catalogo";
  return (
    <div className="flex flex-col">
      {producto ? (
        <div className="relative">
          <ImagenProducto ruta={producto.imagen ?? undefined} alt={producto.nombre} sizes="384px" preload />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex h-28 items-center justify-center text-sobre-marca"
          style={{ background: "linear-gradient(135deg, var(--marca), color-mix(in oklab, var(--marca) 60%, var(--acento)))" }}
        >
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h7.6c.5 0 1 .2 1.4.6l8.4 8.4a2 2 0 0 1 0 2.8l-5.600 5.600a2 2 0 0 1-2.800 0L3.600 12A2 2 0 0 1 3 10.600V3Z" />
            <circle cx="7.500" cy="7.500" r="1.200" />
          </svg>
        </div>
      )}

      <div className="flex flex-col gap-3 p-5">
        {promo.titulo && (
          <h2 id="titulo-promocion" className="text-xl leading-tight font-extrabold tracking-tight text-balance">
            {promo.titulo}
          </h2>
        )}
        {producto && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{producto.nombre}</p>
            <PrecioProducto precio={producto.precio} precioAnterior={producto.precioAnterior} />
          </div>
        )}
        {promo.texto && <p className="text-sm leading-relaxed text-suave">{promo.texto}</p>}

        <Link
          href={destino}
          onClick={alAbrir}
          className="mt-1 flex h-12 items-center justify-center rounded-xl bg-marca px-4 text-base font-bold text-sobre-marca shadow-md transition-transform active:scale-[0.98]"
        >
          {promo.botonTexto}
        </Link>
        {alRechazar && (
          <button type="button" onClick={alRechazar} className="py-1 text-sm font-medium text-suave hover:text-texto">
            Ahora no
          </button>
        )}
      </div>
    </div>
  );
}
