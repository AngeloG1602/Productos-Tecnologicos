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

  if (descuento === null) {
    return <p className={tamano === "grande" ? "text-2xl font-bold" : "text-base font-semibold"}>{formatearCOP(precio)}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <p className={tamano === "grande" ? "text-2xl font-bold" : "text-base font-semibold"}>{formatearCOP(precio)}</p>
      <p className="text-sm text-neutral-400 line-through">{formatearCOP(precioAnterior as number)}</p>
      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">−{descuento}%</span>
    </div>
  );
}
