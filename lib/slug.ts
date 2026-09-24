import { normalizar } from "./texto.ts";

/** Genera un slug a partir de un nombre: "Cargador USB-C 20W" → "cargador-usb-c-20w". */
export function generarSlug(texto: string): string {
  const slug = normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "producto";
}
