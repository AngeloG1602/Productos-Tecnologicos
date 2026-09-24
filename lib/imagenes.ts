/** Bucket de Supabase Storage donde viven las imágenes de productos (se crea en el Bloque 4). */
export const BUCKET_PRODUCTOS = "productos";

/**
 * URL pública de una imagen de producto.
 * En la BD se guarda la ruta dentro del bucket (ej. "<producto_id>/1.webp");
 * si ya es una URL completa (http/https) se usa tal cual.
 */
export function urlImagen(ruta: string, urlSupabase: string): string {
  if (/^https?:\/\//.test(ruta)) return ruta;
  const base = urlSupabase.replace(/\/+$/, "");
  const limpia = ruta.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${BUCKET_PRODUCTOS}/${limpia}`;
}
