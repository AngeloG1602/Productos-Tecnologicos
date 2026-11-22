import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import type { Tema } from "@/lib/temas";
import { hayExistencia } from "@/lib/disponibilidad";
import { porcentajeDescuento } from "@/lib/precio";
import { BotonAgregarRapido } from "./BotonAgregarRapido";
import { EtiquetaStock } from "./EtiquetaStock";
import { IconoTema } from "./IconoTema";
import { ImagenProducto } from "./ImagenProducto";
import { PrecioProducto } from "./PrecioProducto";

type Props = {
  producto: ProductoResumen;
  umbral: number;
  tema: Tema;
  sizes?: string;
  preload?: boolean;
};

export function TarjetaProducto({
  producto,
  umbral,
  tema,
  sizes = "(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw",
  preload = false,
}: Props) {
  const agotado = !hayExistencia(producto);
  const descuento = porcentajeDescuento(producto.precio_anterior, producto.precio_venta);
  return (
    <div className="tarjeta-tematica relative flex w-full flex-col overflow-hidden bg-superficie">
      <Link href={`/producto/${producto.slug}`} className="group flex flex-1 flex-col">
        <div className="relative">
          <ImagenProducto
            ruta={producto.imagenes[0]}
            alt={producto.nombre}
            sizes={sizes}
            preload={preload}
            className={agotado ? "opacity-50 grayscale" : ""}
          />
          {descuento !== null && (
            <span className="absolute top-2 left-2 rounded-lg bg-acento px-2 py-0.5 text-xs font-extrabold text-sobre-acento shadow-sm">
              −{descuento}%
            </span>
          )}
          {producto.nuevo && !agotado && descuento === null && (
            <span className="absolute top-2 left-2 rounded-lg bg-marca px-2 py-0.5 text-xs font-extrabold text-sobre-marca shadow-sm">
              Nuevo
            </span>
          )}
          {agotado && (
            <span className="absolute top-2 left-2 rounded-lg bg-black/75 px-2 py-0.5 text-xs font-bold text-[#ffffff]">Agotado</span>
          )}
          {tema.categoria !== "clasico" && (
            <span
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-sobre-marca shadow-sm"
              style={{ background: tema.marca }}
              aria-hidden="true"
            >
              <IconoTema nombre={tema.icono} className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug font-medium">{producto.nombre}</h3>
          <div className="mt-auto flex flex-col gap-1.5 pt-1">
            <PrecioProducto precio={producto.precio_venta} precioAnterior={producto.precio_anterior} />
            <EtiquetaStock stock={producto.stock} umbral={umbral} bajoPedido={producto.bajo_pedido} />
          </div>
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
                bajoPedido: producto.bajo_pedido,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
