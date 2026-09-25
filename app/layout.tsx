import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DESCRIPCION_TIENDA, NOMBRE_TIENDA } from "@/lib/tienda";

export const metadata: Metadata = {
  title: {
    default: NOMBRE_TIENDA,
    template: `%s · ${NOMBRE_TIENDA}`,
  },
  description: DESCRIPCION_TIENDA,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: NOMBRE_TIENDA,
    title: NOMBRE_TIENDA,
    description: DESCRIPCION_TIENDA,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
