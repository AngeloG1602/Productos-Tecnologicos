import Link from "next/link";
import { BotonCerrarSesion } from "@/components/admin/BotonCerrarSesion";
import { obtenerNombreAdminActual } from "@/lib/admin/datos";

// Todo /admin es por sesión y nunca debe quedar cacheado ni prerenderizado en
// el build (también evita que el build falle si aún no hay Supabase configurado).
export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: LayoutProps<"/admin">) {
  const nombre = await obtenerNombreAdminActual();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-neutral-500">Panel de administración</p>
            {nombre && <p className="text-sm font-semibold">{nombre}</p>}
          </div>
          <BotonCerrarSesion className="shrink-0" />
        </div>
        <nav className="mx-auto flex w-full max-w-4xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          <EnlaceNav href="/admin/productos">Productos</EnlaceNav>
          <EnlaceNav href="/admin/categorias">Categorías</EnlaceNav>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-4">{children}</main>
      <p className="px-4 pb-4 text-center text-xs text-neutral-400">
        Pedidos, socios, dashboard y configuración llegan en el próximo bloque.
      </p>
    </div>
  );
}

function EnlaceNav({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100">
      {children}
    </Link>
  );
}
