import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompraProducto } from "@/components/tienda/CompraProducto";
import { EtiquetaStock } from "@/components/tienda/EtiquetaStock";
import { Galeria } from "@/components/tienda/Galeria";
import {
  obtenerConfiguracionPublica,
  obtenerProductoPorSlug,
  obtenerSlugsProductos,
} from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";
import { formatearCOP } from "@/lib/formato";

export const revalidate = 60;

// Las fichas existentes se generan al compilar; las nuevas, en su primera visita.
export async function generateStaticParams() {
  if (!supabaseConfigurado()) return [];
  const slugs = await obtenerSlugsProductos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!supabaseConfigurado()) return {};
  const producto = await obtenerProductoPorSlug(slug);
  if (!producto) return { title: "Producto no encontrado" };
  return {
    title: producto.nombre,
    description: `${formatearCOP(producto.precio_venta)} · ${producto.descripcion}`.slice(0, 160),
  };
}

export default async function FichaProducto({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  if (!supabaseConfigurado()) notFound();

  const [producto, configuracion] = await Promise.all([
    obtenerProductoPorSlug(slug),
    obtenerConfiguracionPublica(),
  ]);
  if (!producto) notFound();

  return (
    <article className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start md:gap-8">
      <nav className="md:col-span-2">
        <Link href="/" className="text-sm text-neutral-600 hover:underline">
          ← Volver al catálogo
        </Link>
      </nav>

      <Galeria imagenes={producto.imagenes} nombre={producto.nombre} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {producto.categoria && (
            <Link
              href={`/?categoria=${producto.categoria.slug}`}
              className="text-xs font-medium tracking-wide text-marca uppercase"
            >
              {producto.categoria.nombre}
            </Link>
          )}
          <h1 className="text-xl leading-tight font-bold">{producto.nombre}</h1>
          <p className="text-2xl font-bold">{formatearCOP(producto.precio_venta)}</p>
          <div>
            <EtiquetaStock stock={producto.stock} umbral={configuracion.umbralStockBajo} />
          </div>
        </div>

        <CompraProducto
          producto={{
            productoId: producto.id,
            slug: producto.slug,
            nombre: producto.nombre,
            precio: producto.precio_venta,
            imagen: producto.imagenes[0] ?? null,
            stock: producto.stock,
          }}
        />

        {producto.descripcion && (
          <section className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
            <h2 className="text-sm font-semibold">Descripción</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700">
              {producto.descripcion}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}
