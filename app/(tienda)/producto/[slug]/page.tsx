import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrarVistaProducto } from "@/components/tienda/Analitica";
import { AccionesProducto } from "@/components/tienda/AccionesProducto";
import { CompraProducto } from "@/components/tienda/CompraProducto";
import { DatosEstructurados } from "@/components/tienda/DatosEstructurados";
import { DescripcionProducto } from "@/components/tienda/DescripcionProducto";
import { IconoUbicacion } from "@/components/tienda/IconoUbicacion";
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
import { jsonLdProducto } from "@/lib/seo";
import { urlSitio } from "@/lib/sitio";
import { CIUDAD_TIENDA, DETALLE_CONTRA_ENTREGA, TEXTO_CONTRA_ENTREGA } from "@/lib/tienda";
import { obtenerTema } from "@/lib/temas";

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
  const tema = obtenerTema(configuracion.temaActivo);
  const enlace = `${urlSitio()}/producto/${producto.slug}`;
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return (
    <article className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start md:gap-8">
      <RegistrarVistaProducto productoId={producto.id} />
      <DatosEstructurados
        datos={jsonLdProducto({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          url: enlace,
          imagenes: producto.imagenes.map((r) => urlImagen(r, urlSupabase)),
          precio: producto.precio_venta,
          disponibilidad: producto.bajo_pedido ? "bajo_pedido" : producto.stock > 0 ? "en_stock" : "agotado",
        })}
      />
      <nav className="md:col-span-2">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-suave hover:text-texto">
          <span aria-hidden="true">←</span> Volver al catálogo
        </Link>
      </nav>

      <Galeria imagenes={producto.imagenes} nombre={producto.nombre} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-4">
          {producto.categoria && (
            <Link
              href={`/?categoria=${producto.categoria.slug}`}
              className="w-fit rounded-full bg-marca-suave px-2.5 py-1 text-xs font-bold tracking-wide text-texto uppercase"
            >
              {producto.categoria.nombre}
            </Link>
          )}
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-balance">{producto.nombre}</h1>
          <PrecioProducto precio={producto.precio_venta} precioAnterior={producto.precio_anterior} tamano="grande" />
          <div>
            <EtiquetaStock stock={producto.stock} umbral={configuracion.umbralStockBajo} bajoPedido={producto.bajo_pedido} />
          </div>

          <CompraProducto
            producto={{
              productoId: producto.id,
              slug: producto.slug,
              nombre: producto.nombre,
              precio: producto.precio_venta,
              imagen: producto.imagenes[0] ?? null,
              stock: producto.stock,
              bajoPedido: producto.bajo_pedido,
            }}
          />

          {!producto.bajo_pedido && (
            <p className="flex items-center gap-2 rounded-xl bg-exito-suave px-3 py-2 text-xs font-semibold text-exito">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.500" />
              </svg>
              {TEXTO_CONTRA_ENTREGA}: {DETALLE_CONTRA_ENTREGA.toLowerCase()}
            </p>
          )}

          <AccionesProducto
            nombre={producto.nombre}
            precio={producto.precio_venta}
            enlace={enlace}
            whatsappNumero={configuracion.whatsappNumero}
          />

          <p className="flex items-center gap-2 border-t border-borde pt-3 text-xs text-suave">
            <IconoUbicacion className="h-4 w-4 shrink-0 text-acento" />
            Negocio de {CIUDAD_TIENDA}. Tu pedido se confirma por WhatsApp.
          </p>
        </div>

        {producto.descripcion && <DescripcionProducto texto={producto.descripcion} />}
      </div>

      {relacionados.length > 0 && (
        <section aria-labelledby="titulo-mas-productos" className="flex flex-col gap-3 md:col-span-2">
          <h2 id="titulo-mas-productos" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-acento" />
            Más productos
          </h2>
          <div className="sin-barra -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
            {relacionados.map((p) => (
              <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
                <TarjetaProducto producto={p} umbral={configuracion.umbralStockBajo} tema={tema} sizes="192px" />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
