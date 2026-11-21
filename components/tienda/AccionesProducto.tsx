import { IconoWhatsApp } from "./IconoWhatsApp";
import { enlaceCompartirWhatsApp, enlaceWhatsApp, mensajeCompartirProducto, mensajeConsultaProducto } from "@/lib/whatsapp";

/** "Preguntar por este producto" (abre WhatsApp con el producto escrito) y "Compartir" (a un contacto). */
export function AccionesProducto({
  nombre,
  precio,
  enlace,
  whatsappNumero,
}: {
  nombre: string;
  precio: number;
  enlace: string;
  whatsappNumero: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {whatsappNumero && (
        <a
          href={enlaceWhatsApp(whatsappNumero, mensajeConsultaProducto(nombre, enlace))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie px-3 text-sm font-semibold"
        >
          <IconoWhatsApp className="h-4 w-4 text-[#25D366]" />
          Preguntar por este producto
        </a>
      )}
      <a
        href={enlaceCompartirWhatsApp(mensajeCompartirProducto(nombre, precio, enlace))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie px-4 text-sm font-semibold"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Compartir
      </a>
    </div>
  );
}
