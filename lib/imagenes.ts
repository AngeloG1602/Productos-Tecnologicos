/** Bucket de Supabase Storage donde viven las imágenes de productos. */
export const BUCKET_PRODUCTOS = "productos";

export const MAXIMO_IMAGENES_PRODUCTO = 4;

/** Ruta dentro del bucket para la imagen N de un producto (empieza en 1): "<id>/1.webp". */
export function rutaImagenProducto(productoId: string, indice: number): string {
  return `${productoId}/${indice}.webp`;
}

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
