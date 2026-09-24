import { test } from "node:test";
import assert from "node:assert/strict";
import { urlImagen } from "./imagenes.ts";

const base = "https://abc.supabase.co";

test("arma la URL pública del bucket de productos", () => {
  assert.equal(
    urlImagen("123/1.webp", base),
    "https://abc.supabase.co/storage/v1/object/public/productos/123/1.webp",
  );
});

test("tolera barras de más", () => {
  assert.equal(
    urlImagen("/123/1.webp", `${base}/`),
    "https://abc.supabase.co/storage/v1/object/public/productos/123/1.webp",
  );
});

test("codifica caracteres especiales en la ruta", () => {
  assert.equal(
    urlImagen("123/foto 1.webp", base),
    "https://abc.supabase.co/storage/v1/object/public/productos/123/foto%201.webp",
  );
});

test("una URL completa se usa tal cual", () => {
  assert.equal(urlImagen("https://otra.com/a.webp", base), "https://otra.com/a.webp");
});
