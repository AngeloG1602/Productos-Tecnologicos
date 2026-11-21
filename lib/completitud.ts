/** Qué le falta a un producto para estar listo para vender. Lista vacía = completo. */
export function faltantes(p: { precio_venta: number; imagenes: string[]; descripcion: string; costo: number | null }): string[] {
  const f: string[] = [];
  if (p.precio_venta <= 0) f.push("precio");
  if (p.costo === 0) f.push("costo");
  if (p.imagenes.length === 0) f.push("foto");
  if (!p.descripcion.trim()) f.push("descripción");
  return f;
}
