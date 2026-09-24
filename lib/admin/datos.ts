import "server-only";
import { crearClienteServidor } from "@/lib/supabase/servidor";
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
