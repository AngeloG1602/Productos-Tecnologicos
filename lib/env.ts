/**
 * Variables de entorno públicas (llegan al navegador).
 * Se leen de forma literal para que Next.js pueda incrustarlas en el bundle.
 */
export function envPublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llaveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !llaveAnonima) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local (ver .env.example).",
    );
  }
  return { url, llaveAnonima };
}

/** Indica si Supabase está configurado, sin lanzar error. */
export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
