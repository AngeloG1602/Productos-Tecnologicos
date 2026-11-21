import type { ConfiguracionPublica } from "@/lib/catalogo";

const PASOS = [
  { titulo: "Elige", texto: "Agrega al carrito lo que te guste." },
  { titulo: "Envía tu pedido", texto: "Pon tu nombre y barrio. Se abre WhatsApp con todo escrito." },
  { titulo: "Acordamos", texto: "Te confirmamos y acordamos entrega y pago contigo." },
];

/** Tres pasos para quien nunca ha comprado por WhatsApp. */
export function ComoComprar() {
  return (
    <section aria-labelledby="titulo-como-comprar" className="flex flex-col gap-3">
      <h2 id="titulo-como-comprar" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-acento" />
        Comprar es fácil
      </h2>
      <ol className="grid gap-2.5 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="flex items-start gap-3 rounded-2xl border border-borde bg-superficie p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marca text-sm font-extrabold text-sobre-marca">
              {i + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold">{p.titulo}</span>
              <span className="text-xs leading-snug text-suave">{p.texto}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Preguntas frecuentes. Si faltan los datos en Configuración, se responde que se acuerda por WhatsApp. */
export function PreguntasFrecuentes({ configuracion }: { configuracion: ConfiguracionPublica }) {
  const { metodos_pago, tiempo_entrega } = configuracion.legal;
  const preguntas = [
    {
      p: "¿Cómo pago?",
      r: metodos_pago.trim() || "Lo acordamos contigo por WhatsApp cuando confirmemos tu pedido.",
    },
    {
      p: "¿Cuánto tarda la entrega?",
      r: tiempo_entrega.trim() || "Te lo confirmamos por WhatsApp según tu barrio.",
    },
    {
      p: "¿Necesito crear una cuenta?",
      r: "No. Solo agregas al carrito, pones tu nombre y barrio, y envías el pedido por WhatsApp.",
    },
  ];
  return (
    <section aria-labelledby="titulo-preguntas" className="flex flex-col gap-3">
      <h2 id="titulo-preguntas" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-acento" />
        Preguntas frecuentes
      </h2>
      <div className="flex flex-col divide-y divide-borde rounded-2xl border border-borde bg-superficie">
        {preguntas.map((q) => (
          <details key={q.p} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              {q.p}
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-suave transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pt-2 text-sm leading-relaxed text-suave">{q.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
