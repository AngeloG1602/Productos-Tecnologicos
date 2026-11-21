/**
 * URL pública del sitio (sin barra final), para enlaces absolutos: sitemap, datos estructurados
 * y mensajes de WhatsApp. En Netlify llega en URL / DEPLOY_PRIME_URL; se puede fijar a mano con
 * NEXT_PUBLIC_SITE_URL (recomendado si hay un dominio propio).
 */
export function urlSitio(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
