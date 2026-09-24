"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ConfiguracionAdmin } from "@/lib/admin/datos";
import { validarConfiguracion } from "@/lib/configuracion";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { guardarConfiguracion } from "@/app/admin/(panel)/configuracion/acciones";

export function FormularioConfiguracion({ configuracion }: { configuracion: ConfiguracionAdmin }) {
  const router = useRouter();
  const [guardando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [whatsapp, setWhatsapp] = useState(configuracion.whatsapp_numero ?? "");

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const f = new FormData(evento.currentTarget);
    const entrada = {
      whatsappNumero: String(f.get("whatsapp") ?? ""),
      margenDefault: String(f.get("margen") ?? ""),
      redondeo: String(f.get("redondeo") ?? ""),
      umbralStockBajo: String(f.get("umbral") ?? ""),
      textoEnvio: String(f.get("texto_envio") ?? ""),
    };
    const validacion = validarConfiguracion(entrada);
    if (!validacion.ok) {
      setMensaje({ tipo: "error", texto: validacion.error });
      return;
    }
    setMensaje(null);
    iniciar(async () => {
      const r = await guardarConfiguracion(entrada);
      if (r.ok) {
        setMensaje({ tipo: "ok", texto: "Configuración guardada. La tienda ya usa estos datos." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: r.error });
      }
    });
  }

  const numeroPrueba = whatsapp.replace(/\D/g, "");

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5 pb-10">
      <Campo etiqueta="Número de WhatsApp" ayuda="Con indicativo de país, ej. 57 300 123 4567. Aquí llegan los pedidos y las consultas.">
        <input
          name="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          required
          className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
        />
      </Campo>
      {numeroPrueba.length >= 8 && (
        <a
          href={enlaceWhatsApp(numeroPrueba, "Prueba desde el panel de la tienda")}
          target="_blank"
          rel="noopener noreferrer"
          className="-mt-3 w-fit text-sm text-marca underline"
        >
          Probar este número en WhatsApp
        </a>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Margen por defecto (%)" ayuda="Se propone al crear un producto.">
          <input
            name="margen"
            defaultValue={String(Number(configuracion.margen_default))}
            inputMode="decimal"
            required
            className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
          />
        </Campo>
        <Campo etiqueta="Redondeo (COP)" ayuda="El precio sugerido se redondea hacia arriba a este múltiplo.">
          <input
            name="redondeo"
            defaultValue={String(configuracion.redondeo)}
            inputMode="numeric"
            required
            className="h-11 rounded-xl border border-neutral-300 px-3 text-base"
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Umbral de stock bajo"
        ayuda='Con esta cantidad o menos, la tienda muestra "¡Últimas X unidades!" y el inicio del panel te avisa.'
      >
        <input
          name="umbral"
          defaultValue={String(configuracion.umbral_stock_bajo)}
          inputMode="numeric"
          required
          className="h-11 w-32 rounded-xl border border-neutral-300 px-3 text-base"
        />
      </Campo>

      <Campo etiqueta="Texto de envío" ayuda="Última línea del mensaje de pedido por WhatsApp.">
        <textarea
          name="texto_envio"
          defaultValue={configuracion.texto_envio}
          maxLength={300}
          rows={2}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-base"
        />
      </Campo>

      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${mensaje.tipo === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="h-12 rounded-xl bg-marca text-base font-semibold text-white disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
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
