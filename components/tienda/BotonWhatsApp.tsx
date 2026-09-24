"use client";

import { usePathname } from "next/navigation";
import { enlaceWhatsApp, MENSAJE_CONSULTA } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./IconoWhatsApp";

/** Botón flotante para consultas generales, sin pedido (RF-08). */
export function BotonWhatsApp({ numero }: { numero: string }) {
  // En el carrito ya está el botón de enviar pedido; ahí sobra y tapa el formulario.
  if (usePathname() === "/carrito") return null;
  return (
    <a
      href={enlaceWhatsApp(numero, MENSAJE_CONSULTA)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
    >
      <IconoWhatsApp className="h-7 w-7" />
    </a>
  );
}
