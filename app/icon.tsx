import { ImageResponse } from "next/og";
import { COLOR_MARCA } from "@/lib/tienda";

// Ícono del navegador (pestaña, marcadores). Mismo diseño que el logo del encabezado
// y la imagen para compartir: rayo blanco sobre el color de marca.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icono() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLOR_MARCA,
          borderRadius: 7,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="white" />
        </svg>
      </div>
    ),
    size,
  );
}
