import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompraProducto } from "@/components/tienda/CompraProducto";
import { EtiquetaStock } from "@/components/tienda/EtiquetaStock";
import { Galeria } from "@/components/tienda/Galeria";
import { PrecioProducto } from "@/components/tienda/PrecioProducto";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";
import {
  obtenerConfiguracionPublica,
  obtenerProductoPorSlug,
  obtenerProductos,
  obtenerSlugsProductos,
} from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/env";
import { formatearCOP } from "@/lib/formato";
import { urlImagen } from "@/lib/imagenes";
import { productosRelacionados } from "@/lib/relacionados";

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
  const descripcion = `${formatearCOP(producto.precio_venta)} · ${producto.descripcion}`.slice(0, 160);
  const imagen = producto.imagenes[0];
  // Open Graph (RNF-07): así el enlace se ve con foto, nombre y precio al compartirlo en WhatsApp o redes.
  return {
    title: producto.nombre,
    description: descripcion,
    openGraph: {
      type: "website",
      locale: "es_CO",
      title: `${producto.nombre} — ${formatearCOP(producto.precio_venta)}`,
      description: descripcion,
      images: imagen ? [{ url: urlImagen(imagen, process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""), alt: producto.nombre }] : [],
    },
    twitter: { card: imagen ? "summary_large_image" : "summary" },
  };
}

export default async function FichaProducto({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  if (!supabaseConfigurado()) notFound();

  const [producto, configuracion, todos] = await Promise.all([
    obtenerProductoPorSlug(slug),
    obtenerConfiguracionPublica(),
    obtenerProductos(),
  ]);
  if (!producto) notFound();
  const relacionados = productosRelacionados(todos, producto);

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
          <PrecioProducto precio={producto.precio_venta} precioAnterior={producto.precio_anterior} tamano="grande" />
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

      {relacionados.length > 0 && (
        <section aria-labelledby="titulo-mas-productos" className="flex flex-col gap-3 md:col-span-2">
          <h2 id="titulo-mas-productos" className="text-base font-semibold">
            Más productos
          </h2>
          <div className="sin-barra -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
            {relacionados.map((p) => (
              <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
                <TarjetaProducto producto={p} umbral={configuracion.umbralStockBajo} sizes="192px" />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
