import Link from "next/link";
import { ENLACE_SIC } from "@/components/tienda/TextoLegal";
import { NOMBRE_TIENDA } from "@/lib/tienda";

export function Pie() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 pb-24 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-800">{NOMBRE_TIENDA}</p>
        <p>Pedidos y consultas por WhatsApp. El envío y el pago se acuerdan por ese medio.</p>
        <nav aria-label="Información legal" className="flex flex-col gap-2">
          <Link href="/terminos" className="w-fit underline">
            Términos y condiciones · garantía y devoluciones
          </Link>
          <Link href="/politica-de-datos" className="w-fit underline">
            Política de tratamiento de datos
          </Link>
          <a href={ENLACE_SIC} target="_blank" rel="noopener noreferrer" className="w-fit underline">
            Superintendencia de Industria y Comercio (protección al consumidor)
          </a>
        </nav>
      </div>
    </footer>
  );
}
