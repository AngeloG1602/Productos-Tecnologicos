import { estadoStock } from "@/lib/stock";

const estilos = {
  bajo_pedido: { texto: "text-marca", punto: "bg-marca" },
  disponible: { texto: "text-exito", punto: "bg-exito" },
  ultimas: { texto: "text-alerta", punto: "bg-alerta pulsa" },
  agotado: { texto: "text-suave", punto: "bg-suave/50" },
} as const;

export function EtiquetaStock({ stock, umbral, bajoPedido = false }: { stock: number; umbral: number; bajoPedido?: boolean }) {
  const estado = estadoStock(stock, umbral, bajoPedido);
  const e = estilos[estado.tipo];
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-semibold ${e.texto}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} aria-hidden="true" />
      {estado.texto}
    </span>
  );
}
