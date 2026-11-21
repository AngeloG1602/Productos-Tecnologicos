import type { Tema } from "@/lib/temas";
import { UBICACION_TIENDA } from "@/lib/tienda";
import { enlaceWhatsApp, MENSAJE_CONSULTA } from "@/lib/whatsapp";
import { CuentaRegresiva } from "./CuentaRegresiva";
import { IconoUbicacion } from "./IconoUbicacion";
import { IconoWhatsApp } from "./IconoWhatsApp";

/**
 * Portada de la tienda. Tiene una versión para Black Friday y otra para el resto de temas
 * (esta toma sus colores de --marca, así que se adapta sola a cada tema).
 */
export function HeroPortada({ tema, whatsappNumero }: { tema: Tema; whatsappNumero: string | null }) {
  if (tema.slug === "black-friday") return <HeroBlackFriday tema={tema} whatsappNumero={whatsappNumero} />;

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
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">
          <IconoUbicacion className="h-3.5 w-3.5" />
          {UBICACION_TIENDA}
        </span>
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
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.1)] px-3 py-1 text-xs font-semibold ring-1 ring-[rgb(255_255_255/0.2)]">
          <IconoUbicacion className="h-3.5 w-3.5 text-[#facc15]" />
          {UBICACION_TIENDA}
        </span>

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
