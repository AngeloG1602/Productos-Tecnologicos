"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { aplicarRevision, describirCambio, totalCarrito, type ItemCarrito } from "@/lib/carrito";
import { formatearCOP } from "@/lib/formato";
import { interpretarRespuestaPedido } from "@/lib/pedido";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { enlaceWhatsApp, mensajePedido } from "@/lib/whatsapp";
import { ImagenProducto } from "@/components/tienda/ImagenProducto";
import { SelectorCantidad } from "@/components/tienda/SelectorCantidad";
import { IconoWhatsApp } from "@/components/tienda/IconoWhatsApp";
import { useCarrito } from "./useCarrito";
import { guardarUltimoPedido, olvidarUltimoPedido, useUltimoPedido } from "./ultimoPedido";

type Props = {
  whatsappNumero: string | null;
  textoEnvio: string;
};

type Estado =
  | { tipo: "editando" }
  | { tipo: "enviando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "cambios"; avisos: string[] };

export function PaginaCarrito({ whatsappNumero, textoEnvio }: Props) {
  const { items, cambiarCantidad, quitar, reemplazar, vaciar } = useCarrito();
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" });
  const avisoRef = useRef<HTMLDivElement>(null);
  const ultimoPedido = useUltimoPedido();

  if (items.length === 0 && ultimoPedido) {
    return <PedidoListo codigo={ultimoPedido.codigo} enlace={ultimoPedido.enlace} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-bold">Tu carrito está vacío</h1>
        <p className="text-sm text-neutral-600">Agrega productos del catálogo para armar tu pedido.</p>
        <Link href="/" className="rounded-xl bg-marca px-5 py-3 text-sm font-semibold text-white">
          Ver productos
        </Link>
      </div>
    );
  }

  const mostrarAviso = (nuevo: Estado) => {
    setEstado(nuevo);
    requestAnimationFrame(() => avisoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // onSubmit (no <form action>): así el formulario conserva lo escrito si hay que corregir algo.
  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!whatsappNumero || estado.tipo === "enviando") return;
    const formulario = new FormData(evento.currentTarget);
    setEstado({ tipo: "enviando" });

    const cliente = {
      nombre: String(formulario.get("nombre") ?? "").trim(),
      ciudad: String(formulario.get("ciudad") ?? "").trim(),
      notas: String(formulario.get("notas") ?? "").trim(),
      acepta_politica: formulario.get("acepta_politica") === "si",
    };

    try {
      // La BD toma precios y stock reales; lo que mandamos solo sirve para detectar cambios.
      const { data, error } = await crearClienteNavegador().rpc("crear_pedido", {
        p_items: items.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad, precio: i.precio })),
        p_cliente: cliente,
      });
      if (error) {
        // 22023: validación con mensaje pensado para el cliente (ver crear_pedido)
        mostrarAviso({
          tipo: "error",
          mensaje: error.code === "22023" ? error.message : "No pudimos registrar tu pedido. Inténtalo de nuevo.",
        });
        return;
      }

      const respuesta = interpretarRespuestaPedido(data);

      if (!respuesta.ok) {
        const nombres = new Map(items.map((i) => [i.productoId, i.nombre]));
        reemplazar(aplicarRevision(items, respuesta.items, respuesta.cambios));
        mostrarAviso({
          tipo: "cambios",
          avisos: respuesta.cambios.map((c) => describirCambio(c, nombres.get(c.producto_id))),
        });
        return;
      }

      const porId = new Map<string, ItemCarrito>(items.map((i) => [i.productoId, i]));
      const mensaje = mensajePedido({
        codigo: respuesta.codigo,
        items: respuesta.items.map((i) => {
          const slug = porId.get(i.producto_id)?.slug;
          return {
            nombre: i.nombre,
            cantidad: i.cantidad,
            subtotal: i.subtotal,
            enlace: slug ? `${window.location.origin}/producto/${slug}` : undefined,
          };
        }),
        total: respuesta.total,
        cliente,
        textoEnvio,
      });
      const enlace = enlaceWhatsApp(whatsappNumero, mensaje);

      guardarUltimoPedido({ codigo: respuesta.codigo, enlace });
      vaciar();
      setEstado({ tipo: "editando" });
      window.scrollTo({ top: 0 });
      // Misma pestaña: en el celular abre la app de WhatsApp directamente.
      window.location.assign(enlace);
    } catch {
      mostrarAviso({
        tipo: "error",
        mensaje: "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.",
      });
    }
  }

  const total = totalCarrito(items);
  const enviando = estado.tipo === "enviando";

  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-[1fr_22rem] md:items-start md:gap-8">
      <section className="flex flex-col gap-3" aria-labelledby="titulo-carrito">
        <h1 id="titulo-carrito" className="text-xl font-bold">
          Tu carrito
        </h1>

        <div ref={avisoRef} className="scroll-mt-20">
          {estado.tipo === "cambios" && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Algunos productos cambiaron. Ajustamos tu carrito:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {estado.avisos.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="mt-2">Revisa el total y vuelve a enviar el pedido.</p>
            </div>
          )}
          {estado.tipo === "error" && (
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              {estado.mensaje}
            </div>
          )}
        </div>

        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {items.map((item) => (
            <li key={item.productoId} className="flex gap-3 p-3">
              <Link href={`/producto/${item.slug}`} className="w-20 shrink-0 overflow-hidden rounded-lg">
                <ImagenProducto ruta={item.imagen ?? undefined} alt={item.nombre} sizes="80px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/producto/${item.slug}`} className="line-clamp-2 text-sm leading-snug">
                    {item.nombre}
                  </Link>
                  <button
                    type="button"
                    onClick={() => quitar(item.productoId)}
                    aria-label={`Quitar ${item.nombre} del carrito`}
                    className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <SelectorCantidad
                    compacto
                    valor={item.cantidad}
                    maximo={item.stock}
                    etiqueta={`Cantidad de ${item.nombre}`}
                    onCambiar={(c) => cambiarCantidad(item.productoId, c)}
                  />
                  <span className="text-sm font-semibold">{formatearCOP(item.precio * item.cantidad)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link href="/" className="text-sm text-marca">
          + Seguir comprando
        </Link>
      </section>

      <form onSubmit={enviar} className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 md:sticky md:top-20">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-600">Total productos</span>
          <span className="text-xl font-bold">{formatearCOP(total)}</span>
        </div>
        <p className="-mt-2 text-xs text-neutral-500">El costo del envío se acuerda por WhatsApp.</p>

        <Campo etiqueta="Tu nombre" nombre="nombre" maxLength={80} autoComplete="name" requerido />
        <Campo
          etiqueta="Ciudad y barrio"
          nombre="ciudad"
          maxLength={120}
          autoComplete="address-level2"
          placeholder="Ej: Bogotá - Chapinero"
          requerido
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            Notas <span className="font-normal text-neutral-500">(opcional)</span>
          </span>
          <textarea
            name="notas"
            maxLength={500}
            rows={2}
            placeholder="Ej: entregar en la tarde"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
          />
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="acepta_politica" value="si" required className="mt-0.5 h-5 w-5 shrink-0 accent-marca" />
          <span>
            Acepto la{" "}
            <Link href="/politica-de-datos" target="_blank" className="text-marca underline">
              política de tratamiento de datos
            </Link>{" "}
            y los{" "}
            <Link href="/terminos" target="_blank" className="text-marca underline">
              términos y condiciones
            </Link>
            .
          </span>
        </label>

        {whatsappNumero ? (
          <button
            type="submit"
            disabled={enviando}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-neutral-950 disabled:opacity-60"
          >
            <IconoWhatsApp />
            {enviando ? "Registrando pedido…" : "Enviar pedido por WhatsApp"}
          </button>
        ) : (
          <p className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-600">
            Los pedidos por WhatsApp estarán disponibles muy pronto.
          </p>
        )}
        <p className="text-xs text-neutral-500">
          Te llevaremos a WhatsApp con tu pedido ya escrito. Solo tienes que enviarlo.
        </p>
      </form>
    </div>
  );
}

function Campo({
  etiqueta,
  nombre,
  maxLength,
  autoComplete,
  placeholder,
  requerido = false,
}: {
  etiqueta: string;
  nombre: string;
  maxLength: number;
  autoComplete?: string;
  placeholder?: string;
  requerido?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{etiqueta}</span>
      <input
        name={nombre}
        required={requerido}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-neutral-300 px-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
      />
    </label>
  );
}

function PedidoListo({ codigo, enlace }: { codigo: string; enlace: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="m5 12 5 5 9-10" />
        </svg>
      </div>
      <h1 className="text-xl font-bold">¡Tu pedido {codigo} está listo!</h1>
      <p className="max-w-xs text-sm text-neutral-600">
        Te estamos llevando a WhatsApp con el pedido ya escrito. Solo tienes que enviarlo. Si no se abrió, toca el
        botón.
      </p>
      <a
        href={enlace}
        className="flex h-12 items-center gap-2 rounded-xl bg-[#25D366] px-6 text-base font-semibold text-neutral-950"
      >
        <IconoWhatsApp />
        Abrir WhatsApp
      </a>
      <Link href="/" onClick={olvidarUltimoPedido} className="text-sm text-marca">
        Seguir comprando
      </Link>
    </div>
  );
}
