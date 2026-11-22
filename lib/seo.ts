// Datos estructurados (JSON-LD) para que Google entienda la tienda y sus productos.
// Funciones puras: reciben datos ya cargados y devuelven el objeto a publicar.

import { CIUDAD_TIENDA, DESCRIPCION_TIENDA, NOMBRE_TIENDA } from "./tienda.ts";

const DISPONIBILIDAD = {
  en_stock: "https://schema.org/InStock",
  bajo_pedido: "https://schema.org/MadeToOrder",
  agotado: "https://schema.org/OutOfStock",
} as const;

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
    paymentAccepted: "Pago contra entrega",
  };
}

export function jsonLdProducto(p: {
  nombre: string;
  descripcion: string;
  url: string;
  imagenes: string[];
  precio: number;
  disponibilidad: "en_stock" | "bajo_pedido" | "agotado";
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
      availability: DISPONIBILIDAD[p.disponibilidad],
      areaServed: CIUDAD_TIENDA,
    },
  };
}

/** Serializa para incrustar en un <script>: escapa "<" para que un texto no pueda cerrar la etiqueta. */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
