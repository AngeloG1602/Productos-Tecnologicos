"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", etiqueta: "Inicio" },
  { href: "/admin/pedidos", etiqueta: "Pedidos" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/categorias", etiqueta: "Categorías" },
  { href: "/admin/distribuidores", etiqueta: "Distribuidores" },
  { href: "/admin/socios", etiqueta: "Socios" },
  { href: "/admin/promocion", etiqueta: "Promoción" },
  { href: "/admin/configuracion", etiqueta: "Configuración" },
];

export function NavAdmin({ pedidosPendientes = 0 }: { pedidosPendientes?: number }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones del panel" className="sin-barra mx-auto flex w-full max-w-4xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
      {SECCIONES.map(({ href, etiqueta }) => {
        const activa = href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 font-medium ${
              activa ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {etiqueta}
            {href === "/admin/pedidos" && pedidosPendientes > 0 && (
              <span
                className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] leading-5 font-bold text-white"
                aria-label={`${pedidosPendientes} pendientes`}
              >
                {pedidosPendientes > 99 ? "99+" : pedidosPendientes}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
