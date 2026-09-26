// Función programada de Netlify (ver netlify.toml): una vez al día visita /api/health,
// que consulta la base de datos. Así Supabase gratis nunca pasa 7 días sin actividad.
// Equivale al cron de vercel.json cuando la tienda está en Vercel.

export default async function despertarBd() {
  // URL la define Netlify: dirección principal del sitio (dominio propio si hay uno).
  const sitio = process.env.URL;
  if (!sitio) {
    console.error("Falta la variable URL de Netlify.");
    return;
  }
  const respuesta = await fetch(`${sitio}/api/health`, { cache: "no-store" });
  console.log(`/api/health → ${respuesta.status} ${await respuesta.text()}`);
}
