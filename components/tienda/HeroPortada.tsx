import type { Tema } from "@/lib/temas";
import { TEXTO_CONTRA_ENTREGA, UBICACION_TIENDA } from "@/lib/tienda";
import { enlaceWhatsApp, MENSAJE_CONSULTA } from "@/lib/whatsapp";
import { CuentaRegresiva } from "./CuentaRegresiva";
import { IconoUbicacion } from "./IconoUbicacion";
import { IconoWhatsApp } from "./IconoWhatsApp";
import { ArbolNavidad, Esfera } from "./navidad/ArbolNavidad";
import { GuirnaldaLuces } from "./navidad/GuirnaldaLuces";
import { Nieve } from "./navidad/Nieve";

/**
 * Portada de la tienda. Tiene una versión para Black Friday y otra para el resto de temas
 * (esta toma sus colores de --marca, así que se adapta sola a cada tema).
 */
export function HeroPortada({ tema, whatsappNumero }: { tema: Tema; whatsappNumero: string | null }) {
  if (tema.slug === "black-friday") return <HeroBlackFriday tema={tema} whatsappNumero={whatsappNumero} />;
  if (tema.slug === "navidad") return <HeroNavidad tema={tema} whatsappNumero={whatsappNumero} />;

  return (
    <section
      aria-labelledby="titulo-portada"
      className="aparece relative overflow-hidden rounded-3xl p-6 text-sobre-marca shadow-lg sm:p-10"
      style={{ background: "linear-gradient(135deg, var(--marca) 0%, color-mix(in oklab, var(--marca) 62%, #3b82f6) 100%)" }}
    >
      <div aria-hidden="true" className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-sm" />
      <div aria-hidden="true" className="absolute -right-4 -bottom-20 h-64 w-64 rounded-full bg-acento/35 blur-2xl" />
      <div aria-hidden="true" className="absolute top-6 right-8 hidden h-24 w-24 rounded-full border border-white/20 sm:block" />

      <div className="relative flex max-w-xl flex-col gap-4">
        <div className="flex flex-wrap gap-2">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">
          <IconoUbicacion className="h-3.5 w-3.5" />
          {UBICACION_TIENDA}
        </span>
        <PildoraContraEntrega variante="clasica" />
        </div>
        <h1 id="titulo-portada" className="text-3xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
          Tecnología y accesorios, <span className="text-[#ffd2c4]">aquí en Ocaña</span>
        </h1>
        <p className="text-base leading-relaxed text-white/85 text-pretty">
          Arma tu pedido y envíalo por WhatsApp. Atención cercana de un negocio de tu ciudad.
        </p>
        <BotonesPortada whatsappNumero={whatsappNumero} />
      </div>
    </section>
  );
}

function HeroBlackFriday({ tema, whatsappNumero }: { tema: Tema; whatsappNumero: string | null }) {
  return (
    <section
      aria-labelledby="titulo-portada"
      className="aparece relative overflow-hidden rounded-3xl bg-[#0b0b0c] p-6 text-[#ffffff] ring-1 ring-[#facc15]/40 sm:p-10"
      style={{
        backgroundImage:
          "radial-gradient(60% 80% at 85% 0%, rgb(250 204 21 / 0.28), transparent 70%), radial-gradient(50% 70% at 0% 100%, rgb(255 59 48 / 0.22), transparent 70%)",
      }}
    >
      {/* Rayas diagonales de "cinta de precaución" */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: "repeating-linear-gradient(135deg, #facc15 0 14px, #0b0b0c 14px 28px)" }}
      />
      {/* Etiqueta de precio decorativa (solo pantallas anchas) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="absolute top-1/2 right-10 hidden h-72 w-72 -translate-y-1/2 rotate-[14deg] lg:block"
        fill="none"
      >
        <path
          d="M20 20h70c4 0 8 1.600 11 4.600l78 78c6 6 6 16 0 22l-56 56c-6 6-16 6-22 0l-78-78c-3-3-4.600-7-4.600-11V20Z"
          stroke="#facc15"
          strokeWidth="5"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <circle cx="52" cy="52" r="9" fill="#facc15" />
        <text x="104" y="124" textAnchor="middle" fontSize="74" fontWeight="900" fill="#facc15" transform="rotate(45 104 104)">
          %
        </text>
      </svg>
      <div className="relative flex flex-col gap-4 pt-2">
        <div className="flex flex-wrap gap-2">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.1)] px-3 py-1 text-xs font-semibold ring-1 ring-[rgb(255_255_255/0.2)]">
          <IconoUbicacion className="h-3.5 w-3.5 text-[#facc15]" />
          {UBICACION_TIENDA}
        </span>
        <PildoraContraEntrega variante="oscura" />
        </div>

        <h1 id="titulo-portada" className="flex flex-col leading-[0.9] font-black tracking-tighter uppercase">
          <span className="text-5xl sm:text-7xl">Black</span>
          <span className="brilla -ml-1 w-fit -skew-x-6 bg-[#facc15] px-2 text-5xl text-[#0b0b0c] sm:text-7xl">Friday</span>
        </h1>

        <p className="max-w-md text-base leading-relaxed text-[rgb(255_255_255/0.85)] text-pretty">
          Ofertas por tiempo limitado en tecnología y accesorios. Pide por WhatsApp y recibe atención directa en Ocaña.
        </p>

        {tema.finaliza && (
          <div className="flex flex-col gap-1.5 text-[#ffffff]">
            <span className="text-xs font-semibold tracking-wider text-[#facc15] uppercase">La oferta termina en</span>
            <CuentaRegresiva hasta={tema.finaliza} />
          </div>
        )}

        <BotonesPortada whatsappNumero={whatsappNumero} oscuro />
      </div>
    </section>
  );
}

function HeroNavidad({ tema, whatsappNumero }: { tema: Tema; whatsappNumero: string | null }) {
  return (
    <section
      aria-labelledby="titulo-portada"
      className="aparece relative overflow-hidden rounded-3xl p-6 pt-12 text-[#fff8ea] shadow-lg ring-1 ring-[#d4a017]/50 sm:p-10 sm:pt-14"
      style={{
        backgroundImage:
          "radial-gradient(70% 90% at 90% 0%, rgb(212 160 23 / 0.25), transparent 70%), linear-gradient(160deg, #0f3d2e 0%, #14532d 55%, #0b2e22 100%)",
      }}
    >
      <Nieve />
      <GuirnaldaLuces className="absolute inset-x-0 top-0" />

      {/* Adornos colgantes y árbol (solo decoración) */}
      <div aria-hidden="true" className="pointer-events-none absolute top-6 right-4 flex items-start gap-2 sm:right-10 sm:gap-3">
        <Esfera color="#ef4444" cuerda={22} className="hidden h-14 w-7 sm:block sm:h-20 sm:w-9" />
        <Esfera color="#facc15" cuerda={46} className="h-20 w-7 sm:h-28 sm:w-9" />
        <Esfera color="#e5e7eb" cuerda={30} className="h-16 w-7 sm:h-24 sm:w-9" />
      </div>
      <ArbolNavidad className="pointer-events-none absolute -right-3 -bottom-4 hidden h-52 w-44 opacity-95 sm:block lg:right-14 lg:h-64 lg:w-56" />

      <div className="relative flex max-w-xl flex-col gap-4">
        <div className="flex flex-wrap gap-2">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.12)] px-3 py-1 text-xs font-semibold ring-1 ring-[rgb(255_255_255/0.25)] backdrop-blur">
          <IconoUbicacion className="h-3.5 w-3.5 text-[#facc15]" />
          {UBICACION_TIENDA}
        </span>
        <PildoraContraEntrega variante="navidad" />
        </div>
        <h1
          id="titulo-portada"
          className="text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
        >
          Regala tecnología <span className="text-[#facc15]">esta Navidad</span>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-[rgb(255_248_234/0.88)] text-pretty">
          Cargadores, audífonos, relojes y más para sorprender a los tuyos. Pide por WhatsApp aquí en Ocaña.
        </p>

        {tema.finaliza && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-wider text-[#facc15] uppercase">{tema.cuentaEtiqueta ?? "Termina en"}</span>
            <CuentaRegresiva hasta={tema.finaliza} />
          </div>
        )}

        <div className="mt-1 flex flex-wrap gap-2.5">
          <a
            href="#catalogo"
            className="brilla rounded-xl bg-[#facc15] px-5 py-3 text-sm font-bold text-[#3b2a00] shadow-md transition-transform active:scale-[0.98]"
          >
            Ver regalos
          </a>
          {whatsappNumero && (
            <a
              href={enlaceWhatsApp(whatsappNumero, MENSAJE_CONSULTA)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#052e16] shadow-md transition-transform active:scale-[0.98]"
            >
              <IconoWhatsApp className="h-4 w-4" />
              Escríbenos
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function BotonesPortada({ whatsappNumero, oscuro = false }: { whatsappNumero: string | null; oscuro?: boolean }) {
  return (
    <div className="mt-1 flex flex-wrap gap-2.5">
      <a
        href="#catalogo"
        className={`rounded-xl px-5 py-3 text-sm font-bold shadow-md transition-transform active:scale-[0.98] ${
          oscuro ? "bg-[#facc15] text-[#0b0b0c]" : "bg-white text-marca"
        }`}
      >
        Ver productos
      </a>
      {whatsappNumero && (
        <a
          href={enlaceWhatsApp(whatsappNumero, MENSAJE_CONSULTA)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#052e16] shadow-md transition-transform active:scale-[0.98]"
        >
          <IconoWhatsApp className="h-4 w-4" />
          Escríbenos
        </a>
      )}
    </div>
  );
}

/** "Pago contra entrega" en la portada: la razón de confianza más fuerte, a la vista desde el inicio. */
function PildoraContraEntrega({ variante }: { variante: "clasica" | "oscura" | "navidad" }) {
  const estilo =
    variante === "oscura"
      ? "bg-[#facc15] text-[#0b0b0c]"
      : "bg-[rgb(255_255_255/0.95)] text-[#14532d]";
  return (
    <span className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${estilo}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.500" />
      </svg>
      {TEXTO_CONTRA_ENTREGA}
    </span>
  );
}
