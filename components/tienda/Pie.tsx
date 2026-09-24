import Link from "next/link";

export function Pie() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 pb-24 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-800">Tienda</p>
        <p>Pedidos y consultas por WhatsApp. El envío y el pago se acuerdan por ese medio.</p>
        <Link href="/politica-de-datos" className="w-fit underline">
          Política de tratamiento de datos
        </Link>
      </div>
    </footer>
  );
}
