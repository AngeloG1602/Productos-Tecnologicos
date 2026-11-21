import { serializarJsonLd } from "@/lib/seo";

/** Publica datos estructurados (JSON-LD) para buscadores. No se ve en pantalla. */
export function DatosEstructurados({ datos }: { datos: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(datos) }} />;
}
