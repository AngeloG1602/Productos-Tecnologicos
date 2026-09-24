"use server";

import { revalidatePath, updateTag } from "next/cache";
import { ETIQUETA_CATALOGO } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

// Errores de las funciones de pedidos con mensaje pensado para el admin (ver migración 3):
// 55000 estado no permitido / stock insuficiente / socios que no suman 100; P0002 no encontrado.
const CODIGOS_CON_MENSAJE = new Set(["55000", "P0002", "22023"]);

type Operacion = "confirmar_pedido" | "cancelar_pedido" | "entregar_pedido";

async function cambiarEstado(operacion: Operacion, id: string): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc(operacion, { p_pedido_id: id });
  if (error) {
    return {
      ok: false,
      error: CODIGOS_CON_MENSAJE.has(error.code) ? error.message : "No pudimos actualizar el pedido. Inténtalo de nuevo.",
    };
  }
  // Confirmar y cancelar mueven stock: la tienda debe verlo al instante.
  updateTag(ETIQUETA_CATALOGO);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function confirmarPedido(id: string) {
  return cambiarEstado("confirmar_pedido", id);
}

export async function cancelarPedido(id: string) {
  return cambiarEstado("cancelar_pedido", id);
}

export async function entregarPedido(id: string) {
  return cambiarEstado("entregar_pedido", id);
}
