// Exporta el catálogo público a una carpeta para usarlo en publicidad (Facebook/Instagram):
//   exportacion-catalogo/catalogo.csv    (abre en Excel / Google Sheets)
//   exportacion-catalogo/catalogo.json
//   exportacion-catalogo/imagenes/<slug>/1.webp, 2.webp, ...
//
// Usa SOLO la llave pública (anon) y las mismas consultas de la tienda: no incluye costos ni
// márgenes (viven en producto_costos, solo admins). Seguro para compartir.
//
// Uso:  npm run exportar
// Lee NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY de .env.local (o del entorno).
// Opcional: SITIO_URL (por defecto https://7dstore.netlify.app) para armar los enlaces.

import { mkdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

// Se queda solo con el origen (https://xxxx.supabase.co): tolera que peguen ".../rest/v1" o una "/" final.
function origenSupabase(valor) {
  const limpio = valor.trim().replace(/^["']|["']$/g, "");
  if (!limpio) return "";
  try {
    return new URL(limpio).origin;
  } catch {
    console.error(`La URL de Supabase no es válida: "${limpio}". Debe ser como https://xxxxxxxx.supabase.co`);
    process.exit(1);
  }
}

const URL_SUPABASE = origenSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const LLAVE = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim().replace(/^["']|["']$/g, "");
const SITIO = (process.env.SITIO_URL ?? "https://7dstore.netlify.app").replace(/\/+$/, "");
const SALIDA = process.env.SALIDA ?? "exportacion-catalogo";
const BUCKET = "productos";

if (!URL_SUPABASE || !LLAVE) {
  console.error(
    "Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Crea el archivo .env.local con esos dos valores (Supabase → Project Settings → API).",
  );
  process.exit(1);
}

async function consultar(ruta) {
  const respuesta = await fetch(`${URL_SUPABASE}/rest/v1/${ruta}`, {
    // Las llaves nuevas (sb_publishable_...) no son JWT: solo van en "apikey".
    headers: LLAVE.startsWith("eyJ") ? { apikey: LLAVE, Authorization: `Bearer ${LLAVE}` } : { apikey: LLAVE },
  });
  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status} en ${ruta.split("?")[0]}: ${await respuesta.text()}`);
  }
  return respuesta.json();
}

function urlImagen(ruta) {
  if (/^https?:\/\//.test(ruta)) return ruta;
  const limpia = ruta.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${URL_SUPABASE}/storage/v1/object/public/${BUCKET}/${limpia}`;
}

function extension(ruta) {
  const m = /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(ruta);
  return m ? m[1].toLowerCase() : "webp";
}

function celdaCsv(valor) {
  const texto = String(valor ?? "");
  return /[",\n\r;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

async function existe(ruta) {
  try {
    return (await stat(ruta)).size > 0;
  } catch {
    return false;
  }
}

async function descargar(url, destino) {
  if (await existe(destino)) return "ya estaba";
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  await writeFile(destino, Buffer.from(await respuesta.arrayBuffer()));
  return "ok";
}

const categorias = await consultar("categorias?select=id,nombre");
const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]));

const productos = await consultar(
  "productos?select=id,categoria_id,nombre,slug,descripcion,imagenes,precio_venta,precio_anterior,stock,destacado" +
    "&activo=eq.true&order=nombre",
);

console.log(`Productos activos: ${productos.length}`);
await mkdir(join(SALIDA, "imagenes"), { recursive: true });

const filas = [];
const fallos = [];
let imagenesBajadas = 0;

for (const p of productos) {
  const carpeta = join(SALIDA, "imagenes", p.slug);
  await mkdir(carpeta, { recursive: true });

  const archivos = [];
  for (const [i, ruta] of (p.imagenes ?? []).entries()) {
    const nombreArchivo = `${i + 1}.${extension(ruta)}`;
    try {
      await descargar(urlImagen(ruta), join(carpeta, nombreArchivo));
      archivos.push(`imagenes/${p.slug}/${nombreArchivo}`);
      imagenesBajadas += 1;
    } catch (error) {
      fallos.push(`${p.nombre} (${nombreArchivo}): ${error.message}`);
    }
  }

  const enlace = `${SITIO}/producto/${p.slug}`;
  filas.push({
    nombre: p.nombre,
    categoria: nombreCategoria.get(p.categoria_id) ?? "",
    precio_venta: p.precio_venta,
    precio_anterior: p.precio_anterior ?? "",
    stock: p.stock,
    disponibilidad: p.stock <= 0 ? "Agotado" : "Disponible",
    destacado: p.destacado ? "Sí" : "No",
    enlace,
    enlace_para_anuncio: `${enlace}?agregar=1`,
    descripcion: (p.descripcion ?? "").replace(/\s+/g, " ").trim(),
    imagenes: archivos.join(" | "),
  });
  console.log(`  ✓ ${p.nombre} (${archivos.length} foto${archivos.length === 1 ? "" : "s"})`);
}

const columnas = Object.keys(
  filas[0] ?? {
    nombre: 0, categoria: 0, precio_venta: 0, precio_anterior: 0, stock: 0, disponibilidad: 0,
    destacado: 0, enlace: 0, enlace_para_anuncio: 0, descripcion: 0, imagenes: 0,
  },
);
const csv = [columnas.join(","), ...filas.map((f) => columnas.map((c) => celdaCsv(f[c])).join(","))].join("\r\n");
// BOM al inicio para que Excel muestre bien las tildes.
await writeFile(join(SALIDA, "catalogo.csv"), `﻿${csv}\r\n`, "utf8");
await writeFile(join(SALIDA, "catalogo.json"), JSON.stringify(filas, null, 2), "utf8");

console.log(`\nListo: ${filas.length} productos y ${imagenesBajadas} imágenes en la carpeta "${SALIDA}".`);
if (fallos.length > 0) {
  console.log(`\nNo se pudieron bajar ${fallos.length} imagen(es):`);
  for (const f of fallos) console.log(`  - ${f}`);
  process.exitCode = 1;
}
