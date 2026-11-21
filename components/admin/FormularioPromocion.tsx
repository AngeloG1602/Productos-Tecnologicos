"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProductoParaPromocion, PromocionAdmin } from "@/lib/admin/datos";
import type { PromocionPublica } from "@/lib/catalogo";
import { isoALocal, validarPromocion } from "@/lib/promocion";
import { guardarPromocion } from "@/app/admin/(panel)/promocion/acciones";
import { ContenidoPromocion } from "@/components/tienda/ContenidoPromocion";

const campo = "h-11 rounded-xl border border-neutral-300 px-3 text-base";

export function FormularioPromocion({
  promocion,
  productos,
}: {
  promocion: PromocionAdmin;
  productos: ProductoParaPromocion[];
}) {
  const router = useRouter();
  const [guardando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const [activa, setActiva] = useState(promocion.activa);
  const [productoId, setProductoId] = useState(promocion.producto_id ?? "");
  const [titulo, setTitulo] = useState(promocion.titulo);
  const [texto, setTexto] = useState(promocion.texto);
  const [boton, setBoton] = useState(promocion.boton_texto);
  const [desde, setDesde] = useState(isoALocal(promocion.desde));
  const [hasta, setHasta] = useState(isoALocal(promocion.hasta));

  const producto = productos.find((p) => p.id === productoId) ?? null;

  // La misma vista que verá el cliente (sin la lógica de cuándo aparece).
  const vista: PromocionPublica = {
    titulo: titulo.trim(),
    texto: texto.trim(),
    botonTexto: boton.trim() || "Ver ahora",
    version: "vista-previa",
    producto: producto
      ? {
          slug: "vista-previa",
          nombre: producto.nombre,
          imagen: producto.imagenes[0] ?? null,
          precio: producto.precio_venta,
          precioAnterior: producto.precio_anterior,
          stock: producto.stock,
        }
      : null,
  };

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const entrada = {
      activa,
      titulo,
      texto,
      boton_texto: boton,
      producto_id: productoId || null,
      desde,
      hasta,
    };
    const v = validarPromocion(entrada);
    if (!v.ok) {
      setMensaje({ tipo: "error", texto: v.error });
      return;
    }
    setMensaje(null);
    iniciar(async () => {
      const r = await guardarPromocion(entrada);
      if (r.ok) {
        setMensaje({
          tipo: "ok",
          texto: activa
            ? "Promoción guardada. La tienda ya la muestra (dentro de las fechas indicadas)."
            : "Promoción guardada. Está apagada: no se muestra en la tienda.",
        });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: r.error });
      }
    });
  }

  const productoInactivo = producto && !producto.activo;

  return (
    <div className="grid gap-6 pb-10 md:grid-cols-[1fr_20rem] md:items-start">
      <form onSubmit={enviar} className="flex flex-col gap-5">
        <label className="flex items-center gap-3 rounded-xl border border-neutral-300 p-3">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} className="h-5 w-5" />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Mostrar la ventana en la tienda</span>
            <span className="text-xs text-neutral-500">
              Si está apagada, el cliente no ve nada, aunque estén las fechas puestas.
            </span>
          </span>
        </label>

        <Campo etiqueta="Producto estrella (opcional)" ayuda="Muestra su foto, nombre y precio, y el botón lleva a su ficha.">
          <select value={productoId} onChange={(e) => setProductoId(e.target.value)} className={campo}>
            <option value="">Sin producto (solo mensaje)</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </select>
        </Campo>
        {productoInactivo && (
          <p role="alert" className="-mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Este producto está inactivo: mientras siga así, la promoción no se mostrará. Actívalo en Productos.
          </p>
        )}

        <Campo etiqueta="Título" ayuda={`Máximo 80 caracteres. ${titulo.length}/80`}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} placeholder="Ej. Oferta de Black Friday" className={campo} />
        </Campo>

        <Campo etiqueta="Texto" ayuda={`Máximo 240 caracteres. ${texto.length}/240`}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={240}
            rows={3}
            placeholder="Ej. Solo hasta el domingo o hasta agotar existencias."
            className="rounded-xl border border-neutral-300 px-3 py-2 text-base"
          />
        </Campo>

        <Campo etiqueta="Texto del botón">
          <input value={boton} onChange={(e) => setBoton(e.target.value)} maxLength={30} className={campo} />
        </Campo>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo etiqueta="Empieza (opcional)" ayuda="Hora de Colombia. Vacío = desde ya.">
            <input type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} className={campo} />
          </Campo>
          <Campo etiqueta="Termina (opcional)" ayuda="Hora de Colombia. Vacío = sin fecha de fin.">
            <input type="datetime-local" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} />
          </Campo>
        </div>

        {mensaje && (
          <p
            role={mensaje.tipo === "error" ? "alert" : "status"}
            className={`rounded-lg px-3 py-2 text-sm ${mensaje.tipo === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {mensaje.texto}
          </p>
        )}

        <button type="submit" disabled={guardando} className="h-12 rounded-xl bg-marca text-base font-semibold text-white disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar promoción"}
        </button>
      </form>

      <aside aria-label="Vista previa" className="flex flex-col gap-2 md:sticky md:top-20">
        <p className="text-sm font-medium">Vista previa</p>
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
          {vista.titulo || vista.producto ? (
            <ContenidoPromocion promo={vista} />
          ) : (
            <p className="p-6 text-center text-sm text-neutral-500">Escribe un título o elige un producto para ver cómo quedará.</p>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          En la tienda aparece a los 5 segundos, una vez por visita, y no vuelve en 24 horas si el cliente la cierra. Nunca
          aparece en el carrito.
        </p>
      </aside>
    </div>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-neutral-500">{ayuda}</span>}
    </label>
  );
}
