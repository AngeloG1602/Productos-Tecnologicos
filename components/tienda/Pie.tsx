import Link from "next/link";
import { ENLACE_SIC } from "@/components/tienda/TextoLegal";
import { Logo } from "@/components/tienda/Logo";
import type { ConfiguracionPublica } from "@/lib/catalogo";
import { UBICACION_TIENDA } from "@/lib/tienda";
import { enlaceWhatsApp, MENSAJE_CONSULTA } from "@/lib/whatsapp";
import { IconoUbicacion } from "./IconoUbicacion";
import { IconoWhatsApp } from "./IconoWhatsApp";

export function Pie({ configuracion }: { configuracion: ConfiguracionPublica | null }) {
  const { legal, whatsappNumero } = configuracion ?? { legal: null, whatsappNumero: null };
  const direccion = legal?.legal_direccion.trim();
  return (
    <footer className="mt-10 border-t border-borde bg-superficie">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 pb-24 text-sm text-suave sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Logo tamano="sm" />
          <p className="flex items-start gap-2 text-texto">
            <IconoUbicacion className="mt-0.5 h-4 w-4 shrink-0 text-acento" />
            <span>
              <strong className="font-bold">{UBICACION_TIENDA}</strong>
              {direccion && <span className="block font-normal text-suave">{direccion}</span>}
            </span>
          </p>
          <p>Pedidos y consultas por WhatsApp. <strong className="text-texto">Pago contra entrega</strong> (excepto productos bajo pedido). El costo del envío se acuerda por ese medio.</p>
          {whatsappNumero && (
            <a
              href={enlaceWhatsApp(whatsappNumero, MENSAJE_CONSULTA)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-[#052e16]"
            >
              <IconoWhatsApp className="h-4 w-4" />
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
        <nav aria-label="Información legal" className="flex flex-col gap-2.5">
          <p className="text-xs font-bold tracking-wider text-texto uppercase">Información</p>
          <Link href="/terminos" className="w-fit hover:text-texto hover:underline">
            Términos y condiciones · garantía y devoluciones
          </Link>
          <Link href="/politica-de-datos" className="w-fit hover:text-texto hover:underline">
            Política de tratamiento de datos
          </Link>
          <a href={ENLACE_SIC} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-texto hover:underline">
            Superintendencia de Industria y Comercio (protección al consumidor)
          </a>
        </nav>
      </div>
    </footer>
  );
}
