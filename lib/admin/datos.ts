import "server-only";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { limitesRango } from "@/lib/fechas";
import type { PedidoVendido } from "@/lib/reporte";
import type { Fila } from "@/lib/supabase/tipos";

export type CategoriaAdmin = Fila<"categorias">;

export type ProductoAdmin = Pick<
  Fila<"productos">,
  | "id"
  | "categoria_id"
  | "nombre"
  | "slug"
  | "descripcion"
  | "imagenes"
  | "precio_venta"
  | "precio_anterior"
  | "stock"
  | "activo"
  | "destacado"
> & {
  categoria_nombre: string | null;
  costo: number | null;
  margen_pct: number | null;
};

const CAMPOS_PRODUCTO_ADMIN =
  "id, categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado, categoria:categorias(nombre), producto_costos(costo, margen_pct)";

type FilaProductoConRelaciones = Omit<Fila<"productos">, "created_at" | "updated_at"> & {
  categoria: { nombre: string } | null;
  producto_costos: { costo: number; margen_pct: number } | null;
};

function aplanar(fila: FilaProductoConRelaciones): ProductoAdmin {
  return {
    id: fila.id,
    categoria_id: fila.categoria_id,
    nombre: fila.nombre,
    slug: fila.slug,
    descripcion: fila.descripcion,
    imagenes: fila.imagenes,
    precio_venta: fila.precio_venta,
    precio_anterior: fila.precio_anterior,
    stock: fila.stock,
    activo: fila.activo,
    destacado: fila.destacado,
    categoria_nombre: fila.categoria?.nombre ?? null,
    costo: fila.producto_costos?.costo ?? null,
    margen_pct: fila.producto_costos?.margen_pct ?? null,
  };
}

/** Todos los productos (activos e inactivos), con su categoría y costo. Solo para admins (RLS). */
export async function obtenerProductosAdmin(): Promise<ProductoAdmin[]> {
  const { data, error } = await crearClienteServidor().then((sb) =>
    sb
      .from("productos")
      .select(CAMPOS_PRODUCTO_ADMIN)
      .order("nombre")
      .returns<FilaProductoConRelaciones[]>(),
  );
  if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
  return data.map(aplanar);
}

export async function obtenerProductoAdmin(id: string): Promise<ProductoAdmin | null> {
  const { data, error } = await crearClienteServidor().then((sb) =>
    sb
      .from("productos")
      .select(CAMPOS_PRODUCTO_ADMIN)
      .eq("id", id)
      .maybeSingle()
      .returns<FilaProductoConRelaciones | null>(),
  );
  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`);
  return data ? aplanar(data) : null;
}

export async function obtenerCategoriasAdmin(): Promise<CategoriaAdmin[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("categorias").select("*").order("orden").order("nombre");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return data;
}

export type ConfiguracionAdmin = Fila<"configuracion">;

export async function obtenerConfiguracionAdmin(): Promise<ConfiguracionAdmin> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("configuracion").select("*").eq("id", 1).single();
  if (error) throw new Error(`No se pudo cargar la configuración: ${error.message}`);
  return data;
}

/** Nombre del admin que inició sesión (tabla administradores). */
export async function obtenerNombreAdminActual(): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("administradores").select("nombre").eq("user_id", user.id).maybeSingle();
  return data?.nombre || user.email || null;
}

// ─────────────────────────────────────────────────────────────
// Pedidos, socios y dashboard (Bloque 5)
// ─────────────────────────────────────────────────────────────

export type PedidoResumen = Pick<
  Fila<"pedidos">,
  "id" | "codigo" | "estado" | "cliente_nombre" | "cliente_ciudad" | "total_venta" | "created_at"
>;

export type PedidoDetalle = Fila<"pedidos"> & {
  items: Fila<"pedido_items">[];
  reparto: Fila<"pedido_reparto">[];
};

/** Pedidos más recientes primero (máx. 200), opcionalmente filtrados por estado. */
export async function obtenerPedidos(estado?: Fila<"pedidos">["estado"]): Promise<PedidoResumen[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("pedidos")
    .select("id, codigo, estado, cliente_nombre, cliente_ciudad, total_venta, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  return data;
}

export async function obtenerPedido(id: string): Promise<PedidoDetalle | null> {
  const supabase = await crearClienteServidor();
  const [pedido, items, reparto] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).maybeSingle(),
    supabase.from("pedido_items").select("*").eq("pedido_id", id).order("nombre_snapshot"),
    supabase.from("pedido_reparto").select("*").eq("pedido_id", id).order("monto", { ascending: false }),
  ]);
  if (pedido.error || items.error || reparto.error) {
    throw new Error("No se pudo cargar el pedido.");
  }
  if (!pedido.data) return null;
  return { ...pedido.data, items: items.data, reparto: reparto.data };
}

export type SocioAdmin = Fila<"socios">;

export async function obtenerSocios(): Promise<SocioAdmin[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("socios")
    .select("*")
    .order("activo", { ascending: false })
    .order("created_at");
  if (error) throw new Error(`No se pudieron cargar los socios: ${error.message}`);
  return data;
}

export type ResumenVentas = {
  pedidos: number;
  ventas: number;
  costo: number;
  ganancia: number;
  pendientes: number;
  vencidos: number;
};

export async function obtenerResumenVentas(desde: string, hasta: string): Promise<ResumenVentas> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("resumen_ventas", { p_desde: desde, p_hasta: hasta });
  if (error) throw new Error(`No se pudo cargar el resumen de ventas: ${error.message}`);
  const r = data as Record<string, unknown>;
  return {
    pedidos: Number(r.pedidos ?? 0),
    ventas: Number(r.ventas ?? 0),
    costo: Number(r.costo ?? 0),
    ganancia: Number(r.ganancia ?? 0),
    pendientes: Number(r.pendientes ?? 0),
    vencidos: Number(r.vencidos ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────
// Ventas detalladas (Inicio y reporte en Excel)
// ─────────────────────────────────────────────────────────────

// Supabase entrega máximo 1000 filas por consulta: se pide por páginas.
const TAMANO_PAGINA = 1000;

/**
 * Pedidos confirmados o entregados cuya confirmación cae en el rango (hora de Colombia),
 * con sus ítems y el reparto congelado. Mismo criterio que resumen_ventas.
 */
export async function obtenerVentasDetalle(desde: string, hasta: string): Promise<PedidoVendido[]> {
  const supabase = await crearClienteServidor();
  const { inicio, fin } = limitesRango(desde, hasta);
  const pedidos: PedidoVendido[] = [];
  for (let desdeFila = 0; ; desdeFila += TAMANO_PAGINA) {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        "id, codigo, estado, cliente_nombre, cliente_ciudad, created_at, confirmado_at, entregado_at, total_venta, total_costo, ganancia, items:pedido_items(producto_id, nombre_snapshot, cantidad, precio_unitario, costo_unitario), reparto:pedido_reparto(socio_id, socio_nombre, porcentaje, monto)",
      )
      .in("estado", ["confirmado", "entregado"])
      .gte("confirmado_at", inicio)
      .lt("confirmado_at", fin)
      .order("confirmado_at")
      .order("id")
      .range(desdeFila, desdeFila + TAMANO_PAGINA - 1);
    if (error) throw new Error(`No se pudieron cargar las ventas: ${error.message}`);
    pedidos.push(...data.map((p) => ({ ...p, reparto: p.reparto.map((r) => ({ ...r, porcentaje: Number(r.porcentaje) })) })));
    if (data.length < TAMANO_PAGINA) break;
  }
  return pedidos;
}

/** Cuántos pedidos llegaron en el rango (por fecha de creación), por estado. */
export async function contarPedidosRecibidos(desde: string, hasta: string): Promise<Record<PedidoVendido["estado"], number>> {
  const supabase = await crearClienteServidor();
  const { inicio, fin } = limitesRango(desde, hasta);
  const conteo = { pendiente: 0, confirmado: 0, entregado: 0, cancelado: 0 };
  for (let desdeFila = 0; ; desdeFila += TAMANO_PAGINA) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("estado")
      .gte("created_at", inicio)
      .lt("created_at", fin)
      .order("id")
      .range(desdeFila, desdeFila + TAMANO_PAGINA - 1);
    if (error) throw new Error(`No se pudieron contar los pedidos: ${error.message}`);
    for (const p of data) conteo[p.estado]++;
    if (data.length < TAMANO_PAGINA) break;
  }
  return conteo;
}

/** Categoría actual de cada producto (id → nombre de la categoría). */
export async function obtenerCategoriasDeProductos(): Promise<Map<string, string>> {
  const supabase = await crearClienteServidor();
  const mapa = new Map<string, string>();
  for (let desdeFila = 0; ; desdeFila += TAMANO_PAGINA) {
    const { data, error } = await supabase
      .from("productos")
      .select("id, categoria:categorias(nombre)")
      .order("id")
      .range(desdeFila, desdeFila + TAMANO_PAGINA - 1);
    if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
    for (const p of data) if (p.categoria) mapa.set(p.id, p.categoria.nombre);
    if (data.length < TAMANO_PAGINA) break;
  }
  return mapa;
}
