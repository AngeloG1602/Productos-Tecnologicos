// Enlaces para anuncios (Instagram, Facebook): llevan a la ficha del producto
// y lo agregan solo al carrito. Ej.: https://tienda.co/producto/cable-usb-c?agregar=1

export const PARAMETRO_AGREGAR = "agregar";

export function enlaceAnuncio(origen: string, slug: string): string {
  return `${origen.replace(/\/+$/, "")}/producto/${encodeURIComponent(slug)}?${PARAMETRO_AGREGAR}=1`;
}

/**
 * Lee la parte "?..." de la URL. Dice si hay que agregar el producto y devuelve
 * la misma búsqueda sin ese parámetro (para no volver a agregarlo al recargar),
 * conservando los demás (utm_source, fbclid, etc.).
 */
export function leerParametroAgregar(busqueda: string): { agregar: boolean; busquedaLimpia: string } {
  const params = new URLSearchParams(busqueda);
  const agregar = params.get(PARAMETRO_AGREGAR) === "1";
  params.delete(PARAMETRO_AGREGAR);
  const resto = params.toString();
  return { agregar, busquedaLimpia: resto ? `?${resto}` : "" };
}
