import "server-only";
import { crearClientePublico } from "@/lib/supabase/publico";
import { GARANTIA_POR_DEFECTO_MESES, type DatosLegales } from "@/lib/legal";
import type { Fila } from "@/lib/supabase/tipos";

// Solo columnas públicas: el costo y el margen viven en otra tabla y nunca se consultan aquí.

export type Categoria = Pick<Fila<"categorias">, "id" | "nombre" | "slug">;

export type ProductoResumen = Pick<
  Fila<"productos">,
  "id" | "categoria_id" | "nombre" | "slug" | "imagenes" | "precio_venta" | "precio_anterior" | "stock" | "destacado"
>;

export type ProductoDetalle = ProductoResumen &
  Pick<Fila<"productos">, "descripcion"> & { categoria: Categoria | null };

export type ConfiguracionPublica = {
  whatsappNumero: string | null;
  umbralStockBajo: number;
  textoEnvio: string;
  legal: DatosLegales;
};

const UMBRAL_POR_DEFECTO = 5;

export async function obtenerCategorias(): Promise<Categoria[]> {
  const { data, error } = await crearClientePublico()
    .from("categorias")
    .select("id, nombre, slug")
    .order("orden")
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return data;
}

/** Productos activos (RLS además oculta los inactivos a los visitantes). */
export async function obtenerProductos(): Promise<ProductoResumen[]> {
  const { data, error } = await crearClientePublico()
    .from("productos")
    .select("id, categoria_id, nombre, slug, imagenes, precio_venta, precio_anterior, stock, destacado")
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
  return data;
}

export async function obtenerProductoPorSlug(slug: string): Promise<ProductoDetalle | null> {
  const { data, error } = await crearClientePublico()
    .from("productos")
    .select(
      "id, categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, destacado, categoria:categorias(id, nombre, slug)",
    )
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`);
  return data;
}

export async function obtenerSlugsProductos(): Promise<string[]> {
  const { data, error } = await crearClientePublico()
    .from("productos")
    .select("slug")
    .eq("activo", true);
  if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
  return data.map((p) => p.slug);
}

export async function obtenerConfiguracionPublica(): Promise<ConfiguracionPublica> {
  // get: true → petición GET, que Next puede cachear igual que las consultas.
  const { data, error } = await crearClientePublico()
    .rpc("configuracion_publica", {}, { get: true })
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar la configuración: ${error.message}`);
  return {
    whatsappNumero: data?.whatsapp_numero ?? null,
    umbralStockBajo: data?.umbral_stock_bajo ?? UMBRAL_POR_DEFECTO,
    textoEnvio: data?.texto_envio ?? "",
    legal: {
      legal_nombre: data?.legal_nombre ?? "",
      legal_documento: data?.legal_documento ?? "",
      legal_direccion: data?.legal_direccion ?? "",
      legal_ciudad: data?.legal_ciudad ?? "",
      legal_correo: data?.legal_correo ?? "",
      garantia_meses: data?.garantia_meses ?? GARANTIA_POR_DEFECTO_MESES,
      metodos_pago: data?.metodos_pago ?? "",
      tiempo_entrega: data?.tiempo_entrega ?? "",
    },
  };
}
