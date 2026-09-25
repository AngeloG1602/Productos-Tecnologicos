import { formatearCOP } from "./formato.ts";

/** Deja solo los dígitos: "+57 300 000 0000" → "573000000000". */
export function normalizarNumero(numero: string): string {
  return numero.replace(/\D/g, "");
}

/** Para mostrar: "573001234567" → "+57 300 123 4567" (otros países: "+" y los dígitos). */
export function formatearTelefono(numero: string): string {
  const d = normalizarNumero(numero);
  const co = /^57(\d{3})(\d{3})(\d{4})$/.exec(d);
  return co ? `+57 ${co[1]} ${co[2]} ${co[3]}` : `+${d}`;
}

/** Enlace wa.me con el mensaje prellenado (RN-08). */
export function enlaceWhatsApp(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${normalizarNumero(numero)}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export type DatosMensajePedido = {
  codigo: string;
  items: { nombre: string; cantidad: number; subtotal: number; enlace?: string }[];
  total: number;
  cliente: { nombre: string; ciudad: string; notas?: string };
  textoEnvio?: string;
};

/**
 * Mensaje del pedido (RN-08). Debajo de cada producto va su enlace, para que
 * quien atiende vea exactamente qué producto es.
 */
export function mensajePedido({ codigo, items, total, cliente, textoEnvio }: DatosMensajePedido): string {
  const lineas: string[] = ["¡Hola! Quiero hacer este pedido 🛒", `Pedido: ${codigo}`, ""];

  for (const item of items) {
    lineas.push(`• ${item.cantidad} x ${item.nombre} — ${formatearCOP(item.subtotal)}`);
    if (item.enlace) lineas.push(`  ${item.enlace}`);
  }

  lineas.push(
    "",
    `Total productos: ${formatearCOP(total)}`,
    `Nombre: ${cliente.nombre.trim()}`,
    `Ciudad/Barrio: ${cliente.ciudad.trim()}`,
  );
  const notas = cliente.notas?.trim();
  if (notas) lineas.push(`Notas: ${notas}`);

  const envio = textoEnvio?.trim();
  if (envio) lineas.push("", envio);

  return lineas.join("\n");
}

/** Mensaje del botón flotante (consultas sin pedido, RF-08). */
export const MENSAJE_CONSULTA = "¡Hola! Tengo una consulta sobre sus productos.";
