import { formatearCOP } from "@/lib/formato";
import { porcentajeDescuento } from "@/lib/precio";

type Props = {
  precio: number;
  precioAnterior: number | null;
  /** La ficha de producto usa un precio más grande que la tarjeta del catálogo. */
  tamano?: "chico" | "grande";
};

/** Precio, y si hay uno anterior válido, tachado junto a la etiqueta de descuento. */
export function PrecioProducto({ precio, precioAnterior, tamano = "chico" }: Props) {
  const descuento = porcentajeDescuento(precioAnterior, precio);
  const clasePrecio =
    tamano === "grande" ? "text-3xl font-extrabold tracking-tight" : "text-lg leading-none font-extrabold tracking-tight";

  if (descuento === null) {
    return <p className={clasePrecio}>{formatearCOP(precio)}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <p className={clasePrecio}>{formatearCOP(precio)}</p>
      <p className="text-xs text-suave line-through">{formatearCOP(precioAnterior as number)}</p>
      <span className="rounded-md bg-acento px-1.5 py-0.5 text-xs font-bold text-sobre-acento">−{descuento}%</span>
    </div>
  );
}
