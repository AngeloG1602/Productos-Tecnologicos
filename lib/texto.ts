/** Minúsculas y sin tildes, para comparar textos al buscar: "Audífonos" → "audifonos". */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/**
 * ¿El texto coincide con la búsqueda? Cada palabra buscada debe aparecer
 * (en cualquier orden, sin importar tildes ni mayúsculas).
 */
export function coincideBusqueda(texto: string, busqueda: string): boolean {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const objetivo = normalizar(texto);
  return palabras.every((palabra) => objetivo.includes(palabra));
}
