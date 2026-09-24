"use client";

// Comprime una foto en el navegador antes de subirla: máx. 1200 px de lado
// y ~300 KB en WebP (RNF-02). Usa Canvas, sin librerías nuevas.
// No tiene pruebas con node:test porque depende de Image/Canvas del navegador;
// se probó manualmente y con el recorrido de extremo a extremo (Playwright).

const LADO_MAXIMO = 1200;
const PESO_OBJETIVO_BYTES = 300 * 1024;
const CALIDAD_INICIAL = 0.82;
const CALIDAD_MINIMA = 0.5;

export class ImagenInvalidaError extends Error {}

function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolver(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new ImagenInvalidaError("No se pudo leer la imagen."));
    };
    imagen.src = url;
  });
}

function aBlob(lienzo: HTMLCanvasElement, calidad: number): Promise<Blob> {
  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new ImagenInvalidaError("No se pudo procesar la imagen."))),
      "image/webp",
      calidad,
    );
  });
}

/** Redimensiona y comprime una foto de producto. Lanza ImagenInvalidaError si el archivo no es una imagen legible. */
export async function comprimirImagen(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith("image/")) {
    throw new ImagenInvalidaError("El archivo debe ser una imagen.");
  }

  const imagen = await cargarImagen(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.max(1, Math.round(imagen.width * escala));
  lienzo.height = Math.max(1, Math.round(imagen.height * escala));

  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new ImagenInvalidaError("El navegador no puede procesar imágenes.");
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

  // Baja la calidad hasta acercarse al peso objetivo, sin pasar de la calidad mínima.
  let calidad = CALIDAD_INICIAL;
  let blob = await aBlob(lienzo, calidad);
  while (blob.size > PESO_OBJETIVO_BYTES && calidad > CALIDAD_MINIMA) {
    calidad = Math.max(CALIDAD_MINIMA, calidad - 0.12);
    blob = await aBlob(lienzo, calidad);
  }
  return blob;
}
