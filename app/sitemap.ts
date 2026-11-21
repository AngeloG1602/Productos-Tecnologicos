import type { MetadataRoute } from "next";
import { obtenerSlugsProductos } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";
import { urlSitio } from "@/lib/sitio";

// Se regenera cada hora: los productos nuevos aparecen solos.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlSitio();
  const fijas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/politica-de-datos`, changeFrequency: "yearly", priority: 0.2 },
  ];
  if (!supabaseConfigurado()) return fijas;

  try {
    const slugs = await obtenerSlugsProductos();
    return [
      ...fijas,
      ...slugs.map((slug) => ({ url: `${base}/producto/${slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  } catch {
    // Si la base no responde, se publica al menos lo fijo en vez de romper el sitemap.
    return fijas;
  }
}
