import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import { formatearCOP } from "@/lib/formato";
import { EtiquetaStock } from "./EtiquetaStock";
import { ImagenProducto } from "./ImagenProducto";

type Props = {
  producto: ProductoResumen;
  umbral: number;
  sizes?: string;
  preload?: boolean;
};

export function TarjetaProducto({
  producto,
  umbral,
  sizes = "(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw",
  preload = false,
}: Props) {
  const agotado = producto.stock <= 0;
  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white"
    >
      <ImagenProducto
        ruta={producto.imagenes[0]}
        alt={producto.nombre}
        sizes={sizes}
        preload={preload}
        className={agotado ? "opacity-60" : ""}
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm leading-snug group-hover:underline">{producto.nombre}</h3>
        <p className="mt-auto pt-1 text-base font-semibold">{formatearCOP(producto.precio_venta)}</p>
        <EtiquetaStock stock={producto.stock} umbral={umbral} />
      </div>
    </Link>
  );
}
