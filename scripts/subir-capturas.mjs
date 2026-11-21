// Sube a Supabase Storage las capturas de referencia de los productos cargados con
// supabase/subir-capturas.sql. Cada captura queda en el bucket "productos" como
// "<id del producto>/1.jpg" (la misma ruta que el SQL dejó en productos.imagenes).
//
// Uso (desde la raíz del proyecto, con Node >= 22):
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<llave service_role> \
//   node scripts/subir-capturas.mjs
//
// La llave service_role solo se usa aquí, en tu computador; nunca la subas al repositorio.
// Se puede repetir sin problema: reemplaza la imagen si ya existía.
import { readFile } from "node:fs/promises";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const llave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!url || !llave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const carpeta = new URL("../supabase/importacion/", import.meta.url);
const productos = JSON.parse(await readFile(new URL("productos-capturas.json", carpeta), "utf8"));
const cabeceras = { apikey: llave, Authorization: `Bearer ${llave}` };

const slugs = productos.map((p) => p.slug);
const res = await fetch(
  `${url}/rest/v1/productos?select=id,slug&slug=in.(${slugs.join(",")})`,
  { headers: cabeceras },
);
if (!res.ok) {
  console.error("No se pudo consultar productos:", res.status, await res.text());
  process.exit(1);
}
const idPorSlug = new Map((await res.json()).map((f) => [f.slug, f.id]));
if (idPorSlug.size === 0) {
  console.error("No hay productos en la base. Corre primero supabase/subir-capturas.sql.");
  process.exit(1);
}

let subidas = 0;
const fallas = [];
for (const slug of slugs) {
  const id = idPorSlug.get(slug);
  if (!id) {
    fallas.push(`${slug}: no existe en la base`);
    continue;
  }
  const archivo = await readFile(new URL(`capturas/${slug}.jpg`, carpeta));
  const r = await fetch(`${url}/storage/v1/object/productos/${id}/1.jpg`, {
    method: "POST",
    headers: { ...cabeceras, "Content-Type": "image/jpeg", "x-upsert": "true" },
    body: archivo,
  });
  if (r.ok) subidas++;
  else fallas.push(`${slug}: ${r.status} ${await r.text()}`);
}
console.log(`Imágenes subidas: ${subidas} de ${slugs.length}`);
if (fallas.length) {
  console.error("Con error:\n" + fallas.join("\n"));
  process.exit(1);
}
