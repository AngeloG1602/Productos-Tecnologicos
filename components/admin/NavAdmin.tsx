"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", etiqueta: "Inicio" },
  { href: "/admin/pedidos", etiqueta: "Pedidos" },
  { href: "/admin/productos", etiqueta: "Productos" },
  { href: "/admin/categorias", etiqueta: "Categorías" },
  { href: "/admin/socios", etiqueta: "Socios" },
  { href: "/admin/configuracion", etiqueta: "Configuración" },
];

export function NavAdmin() {
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
          </Link>
        );
      })}
    </nav>
  );
}
