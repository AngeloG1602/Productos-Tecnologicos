import { ImageResponse } from "next/og";
import { COLOR_MARCA } from "@/lib/tienda";

// Ícono para agregar la tienda a la pantalla de inicio en iPhone/iPad.
// Sin bordes redondeados propios: iOS le aplica su propia máscara redondeada.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconoApple() {
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
        }}
      >
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="white" />
        </svg>
      </div>
    ),
    size,
  );
}
