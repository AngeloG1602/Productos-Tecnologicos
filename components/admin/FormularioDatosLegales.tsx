"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ConfiguracionAdmin } from "@/lib/admin/datos";
import { validarDatosLegales } from "@/lib/legal";
import { guardarDatosLegales } from "@/app/admin/(panel)/configuracion/acciones";

const CLASE_CAMPO = "h-11 rounded-xl border border-neutral-300 px-3 text-base";

export function FormularioDatosLegales({ configuracion }: { configuracion: ConfiguracionAdmin }) {
  const router = useRouter();
  const [guardando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const f = new FormData(evento.currentTarget);
    const entrada = {
      nombre: String(f.get("nombre") ?? ""),
      documento: String(f.get("documento") ?? ""),
      direccion: String(f.get("direccion") ?? ""),
      ciudad: String(f.get("ciudad") ?? ""),
      correo: String(f.get("correo") ?? ""),
      garantiaMeses: String(f.get("garantia") ?? ""),
      metodosPago: String(f.get("metodos_pago") ?? ""),
      tiempoEntrega: String(f.get("tiempo_entrega") ?? ""),
    };
    const validacion = validarDatosLegales(entrada);
    if (!validacion.ok) {
      setMensaje({ tipo: "error", texto: validacion.error });
      return;
    }
    setMensaje(null);
    iniciar(async () => {
      const r = await guardarDatosLegales(entrada);
      if (r.ok) {
        setMensaje({ tipo: "ok", texto: "Datos guardados. Ya se ven en los términos y la política de datos." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: r.error });
      }
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5 pb-10">
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Todo es opcional y lo que llenes es público:</strong> se muestra en{" "}
        <Link href="/terminos" target="_blank" className="underline">
          Términos y condiciones
        </Link>{" "}
        y en la{" "}
        <Link href="/politica-de-datos" target="_blank" className="underline">
          Política de datos
        </Link>
        . Si dejas un campo vacío, no aparece. El WhatsApp de arriba siempre se muestra como contacto.
      </p>

      <Campo etiqueta="Nombre o razón social" ayuda="Opcional. Persona o empresa que vende.">
        <input name="nombre" defaultValue={configuracion.legal_nombre} maxLength={120} className={CLASE_CAMPO} />
      </Campo>
      <Campo etiqueta="Cédula o NIT" ayuda="Opcional.">
        <input name="documento" defaultValue={configuracion.legal_documento} maxLength={40} className={CLASE_CAMPO} />
      </Campo>
      <Campo etiqueta="Dirección" ayuda="Opcional. No tiene que ser tu casa: puede ser un local u oficina.">
        <input name="direccion" defaultValue={configuracion.legal_direccion} maxLength={160} className={CLASE_CAMPO} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Ciudad">
          <input name="ciudad" defaultValue={configuracion.legal_ciudad} maxLength={80} className={CLASE_CAMPO} />
        </Campo>
        <Campo etiqueta="Garantía (meses)" ayuda="Si no sabes, deja 12 (lo que da la ley).">
          <input
            name="garantia"
            defaultValue={String(configuracion.garantia_meses)}
            inputMode="numeric"
            required
            className={CLASE_CAMPO}
          />
        </Campo>
      </div>
      <Campo etiqueta="Correo de contacto" ayuda="Opcional. Mejor uno exclusivo de la tienda.">
        <input
          name="correo"
          type="email"
          defaultValue={configuracion.legal_correo}
          maxLength={120}
          className={CLASE_CAMPO}
        />
      </Campo>
      <Campo etiqueta="Pago" ayuda='Si lo dejas vacío dice: "Contra entrega, cuando recibes tu pedido."'>
        <textarea
          name="metodos_pago"
          defaultValue={configuracion.metodos_pago}
          placeholder="Ej. Contra entrega: efectivo o transferencia al recibir"
          maxLength={300}
          rows={2}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-base"
        />
      </Campo>
      <Campo
        etiqueta="Tiempo de entrega"
        ayuda="Ej. 1 a 3 días hábiles en Bogotá; otras ciudades según la transportadora. Si no pones nada, se aclara que se acuerda por WhatsApp."
      >
        <textarea
          name="tiempo_entrega"
          defaultValue={configuracion.tiempo_entrega}
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
        {guardando ? "Guardando…" : "Guardar datos legales"}
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
