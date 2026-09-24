import { estadoStock } from "@/lib/stock";

const estilos = {
  disponible: "bg-green-50 text-green-800",
  ultimas: "bg-amber-50 text-amber-800",
  agotado: "bg-neutral-100 text-neutral-600",
} as const;

export function EtiquetaStock({ stock, umbral }: { stock: number; umbral: number }) {
  const estado = estadoStock(stock, umbral);
  return (
    <span className={`inline-block w-fit rounded-md px-2 py-0.5 text-xs font-medium ${estilos[estado.tipo]}`}>
      {estado.texto}
    </span>
  );
}
