// Datos estructurados (JSON-LD) para que Google entienda la tienda y sus productos.
// Funciones puras: reciben datos ya cargados y devuelven el objeto a publicar.

import { CIUDAD_TIENDA, DESCRIPCION_TIENDA, NOMBRE_TIENDA } from "./tienda.ts";

export function jsonLdNegocio(url: string, telefono: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: NOMBRE_TIENDA,
    description: DESCRIPCION_TIENDA,
    url,
    ...(telefono ? { telephone: `+${telefono.replace(/\D/g, "")}` } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: CIUDAD_TIENDA,
      addressRegion: "Norte de Santander",
      addressCountry: "CO",
    },
    areaServed: { "@type": "City", name: CIUDAD_TIENDA },
    currenciesAccepted: "COP",
  };
}

export function jsonLdProducto(p: {
  nombre: string;
  descripcion: string;
  url: string;
  imagenes: string[];
  precio: number;
  disponible: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    ...(p.descripcion.trim() ? { description: p.descripcion.trim().slice(0, 500) } : {}),
    ...(p.imagenes.length ? { image: p.imagenes } : {}),
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "COP",
      price: p.precio,
      availability: p.disponible ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      areaServed: CIUDAD_TIENDA,
    },
  };
}

/** Serializa para incrustar en un <script>: escapa "<" para que un texto no pueda cerrar la etiqueta. */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
