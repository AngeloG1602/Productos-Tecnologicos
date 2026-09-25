import { ImageResponse } from "next/og";
import { COLOR_MARCA, NOMBRE_TIENDA } from "@/lib/tienda";

// Imagen al compartir la tienda en WhatsApp o redes (las fichas de producto usan su propia foto).
export const alt = `${NOMBRE_TIENDA} — accesorios electrónicos`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: COLOR_MARCA,
          color: "white",
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 700 }}>{NOMBRE_TIENDA}</div>
        <div style={{ fontSize: 48, marginTop: 24, opacity: 0.9 }}>Accesorios electrónicos</div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 36,
            background: "white",
            color: COLOR_MARCA,
            padding: "16px 32px",
            borderRadius: 999,
            alignSelf: "flex-start",
          }}
        >
          Pide fácil por WhatsApp
        </div>
      </div>
    ),
    size,
  );
}
