import type { Metadata } from "next";
import Link from "next/link";
import { ArticuloLegal, ENLACE_SIC, FichaVendedor, Seccion, filasPublicas } from "@/components/tienda/TextoLegal";
import { obtenerDatosTienda } from "@/lib/datos-tienda";
import { ACTUALIZACION_TEXTOS_LEGALES, textoGarantia } from "@/lib/legal";
import { NOMBRE_TIENDA } from "@/lib/tienda";
import { enlaceWhatsApp, formatearTelefono } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Cómo funcionan los pedidos, el pago contra entrega, la garantía y las devoluciones.",
};

// Los datos del vendedor se editan en Admin → Configuración (se actualiza al guardar).
// Los que se dejen vacíos no se muestran.
export const revalidate = 60;

// TEXTO BASE: resume lo que exigen la Ley 1480 de 2011 (Estatuto del Consumidor) y la
// Ley 2439 de 2024 (comercio electrónico) para una tienda que solo recibe pedidos y cobra
// contra entrega. Se recomienda que lo revise un abogado.
export default async function Terminos() {
  const { whatsappNumero, legal } = await obtenerDatosTienda();
  const garantia = textoGarantia(legal.garantia_meses);
  const correo = legal.legal_correo.trim();

  const whatsapp = whatsappNumero ? (
    <a href={enlaceWhatsApp(whatsappNumero)} className="text-marca underline">
      {formatearTelefono(whatsappNumero)}
    </a>
  ) : null;
  const enlaceCorreo = correo ? (
    <a href={`mailto:${correo}`} className="text-marca underline">
      {correo}
    </a>
  ) : null;
  const contacto = (
    <>
      por WhatsApp{whatsapp && <> ({whatsapp})</>}
      {enlaceCorreo && <> o al correo {enlaceCorreo}</>}
    </>
  );

  return (
    <ArticuloLegal titulo="Términos y condiciones" actualizacion={ACTUALIZACION_TEXTOS_LEGALES}>
      <Seccion titulo="1. Quién vende">
        <FichaVendedor
          filas={filasPublicas([
            ["Tienda", NOMBRE_TIENDA],
            ["Responsable", legal.legal_nombre],
            ["Cédula / NIT", legal.legal_documento],
            ["Dirección", legal.legal_direccion],
            ["Ciudad", legal.legal_ciudad],
            ["WhatsApp", whatsapp],
            ["Correo", enlaceCorreo],
          ])}
        />
      </Seccion>

      <Seccion titulo="2. Cómo funciona un pedido">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Eliges productos, los agregas al carrito y envías el pedido por WhatsApp.</li>
          <li>
            Enviar el pedido <strong>no tiene ningún costo ni te compromete a pagar</strong>: queda registrado con un
            código (ej. PED-0001) y te respondemos por WhatsApp para confirmar disponibilidad, envío y total.
          </li>
          <li>
            <strong>Pagas contra entrega</strong>, cuando recibes tu pedido. En esta página no se hacen pagos.
          </li>
        </ol>
        <p>
          Los precios están en pesos colombianos e incluyen los impuestos que apliquen. El costo del envío no está
          incluido: te lo confirmamos por WhatsApp antes de despachar.
        </p>
      </Seccion>

      <Seccion titulo="3. Pago">
        <p>{legal.metodos_pago.trim() || "Contra entrega, cuando recibes tu pedido."}</p>
        <p>Nunca te pediremos claves ni códigos de tus cuentas.</p>
      </Seccion>

      <Seccion titulo="4. Entrega">
        <p>{legal.tiempo_entrega.trim() || "El plazo y la forma de entrega se acuerdan por WhatsApp al confirmar tu pedido."}</p>
        <p>Si no acordamos un plazo, entregamos en máximo 30 días calendario.</p>
      </Seccion>

      <Seccion titulo="5. Garantía">
        <p>
          Los productos tienen garantía de <strong>{garantia}</strong> desde que los recibes. Cubre fallas de
          funcionamiento o de calidad; no cubre daños por golpes, humedad o mal uso.
        </p>
        <p>
          Si algo falla, escríbenos {contacto} con tu código de pedido y, si puedes, fotos o un video. Lo revisamos y
          lo reparamos, lo cambiamos o te devolvemos el dinero, según el caso.
        </p>
      </Seccion>

      <Seccion titulo="6. Devoluciones (derecho de retracto)">
        <p>
          Puedes arrepentirte de la compra dentro de los <strong>5 días hábiles</strong> siguientes a recibirla, sin
          dar explicaciones. Avísanos {contacto} y devuelve el producto sin uso, con su empaque y accesorios; el costo
          de enviarlo de vuelta lo asumes tú. Te devolvemos el dinero en máximo 15 días calendario. No aplica a
          productos de uso personal o hechos a la medida.
        </p>
      </Seccion>

      <Seccion titulo="7. Preguntas y quejas">
        <p>
          Escríbenos {contacto}. Te respondemos en máximo 15 días hábiles. Si no quedas satisfecho, puedes acudir a la
          Superintendencia de Industria y Comercio:{" "}
          <a href={ENLACE_SIC} target="_blank" rel="noopener noreferrer" className="text-marca underline">
            www.sic.gov.co
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="8. Datos personales">
        <p>
          Cómo usamos tus datos está en la{" "}
          <Link href="/politica-de-datos" className="text-marca underline">
            política de tratamiento de datos
          </Link>
          .
        </p>
      </Seccion>
    </ArticuloLegal>
  );
}
