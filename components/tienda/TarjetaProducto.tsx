import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import { porcentajeDescuento } from "@/lib/precio";
import { BotonAgregarRapido } from "./BotonAgregarRapido";
import { EtiquetaStock } from "./EtiquetaStock";
import { ImagenProducto } from "./ImagenProducto";
import { PrecioProducto } from "./PrecioProducto";

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
  const descuento = porcentajeDescuento(producto.precio_anterior, producto.precio_venta);
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <Link href={`/producto/${producto.slug}`} className="group flex flex-1 flex-col">
        <div className="relative">
          <ImagenProducto
            ruta={producto.imagenes[0]}
            alt={producto.nombre}
            sizes={sizes}
            preload={preload}
            className={agotado ? "opacity-60" : ""}
          />
          {descuento !== null && (
            <span className="absolute top-2 left-2 rounded-md bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
              −{descuento}%
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-sm leading-snug group-hover:underline">{producto.nombre}</h3>
          <div className="mt-auto pt-1">
            <PrecioProducto precio={producto.precio_venta} precioAnterior={producto.precio_anterior} />
          </div>
          <EtiquetaStock stock={producto.stock} umbral={umbral} />
        </div>
      </Link>
      {!agotado && (
        // Fuera del enlace (un botón dentro de <a> no es HTML válido), sobre la esquina de la imagen
        <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-square items-end justify-end p-2">
          <div className="pointer-events-auto">
            <BotonAgregarRapido
              producto={{
                productoId: producto.id,
                slug: producto.slug,
                nombre: producto.nombre,
                precio: producto.precio_venta,
                imagen: producto.imagenes[0] ?? null,
                stock: producto.stock,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
