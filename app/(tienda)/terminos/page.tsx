import type { Metadata } from "next";
import Link from "next/link";
import { ArticuloLegal, Dato, ENLACE_SIC, FichaVendedor, Seccion } from "@/components/tienda/TextoLegal";
import { obtenerDatosTienda } from "@/lib/datos-tienda";
import { ACTUALIZACION_TEXTOS_LEGALES, textoGarantia } from "@/lib/legal";
import { NOMBRE_TIENDA } from "@/lib/tienda";
import { enlaceWhatsApp, formatearTelefono } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Quién vende, pagos, entregas, garantía, derecho de retracto y cómo presentar una queja.",
};

// Los datos del vendedor se editan en Admin → Configuración (se actualiza al guardar).
export const revalidate = 60;

// TEXTO BASE: resume lo que exigen la Ley 1480 de 2011 (Estatuto del Consumidor) y la
// Ley 2439 de 2024 (comercio electrónico). Se recomienda que lo revise un abogado.
export default async function Terminos() {
  const { whatsappNumero, legal } = await obtenerDatosTienda();
  const garantia = textoGarantia(legal.garantia_meses);
  const correo = legal.legal_correo.trim();

  const whatsapp = whatsappNumero ? (
    <a href={enlaceWhatsApp(whatsappNumero)} className="text-marca underline">
      {formatearTelefono(whatsappNumero)}
    </a>
  ) : (
    <Dato valor="" />
  );
  const enlaceCorreo = correo ? (
    <a href={`mailto:${correo}`} className="text-marca underline">
      {correo}
    </a>
  ) : (
    <Dato valor="" />
  );

  return (
    <ArticuloLegal titulo="Términos y condiciones" actualizacion={ACTUALIZACION_TEXTOS_LEGALES}>
      <Seccion titulo="1. Quién vende">
        <FichaVendedor
          filas={[
            ["Tienda", NOMBRE_TIENDA],
            ["Responsable", <Dato key="n" valor={legal.legal_nombre} />],
            ["Cédula / NIT", <Dato key="d" valor={legal.legal_documento} />],
            ["Dirección", <Dato key="a" valor={legal.legal_direccion} />],
            ["Ciudad", <Dato key="c" valor={legal.legal_ciudad} />],
            ["WhatsApp", whatsapp],
            ["Correo", enlaceCorreo],
          ]}
        />
      </Seccion>

      <Seccion titulo="2. Cómo funciona un pedido">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Eliges productos, los agregas al carrito y envías el pedido por WhatsApp.</li>
          <li>
            Enviar el pedido <strong>no es un pago</strong>: queda registrado con un código (ej. PED-0001) y te
            respondemos por WhatsApp para confirmar disponibilidad, costo de envío y total.
          </li>
          <li>La compra queda cerrada cuando aceptas el total y haces el pago acordado.</li>
        </ol>
        <p>
          Los precios están en pesos colombianos e incluyen los impuestos que apliquen. El costo del envío no está
          incluido: te lo informamos antes de que pagues. Si un precio cambia o un producto se agota antes de que
          envíes el pedido, la tienda te avisa y no lo registra hasta que lo revises.
        </p>
      </Seccion>

      <Seccion titulo="3. Medios de pago">
        <p>{legal.metodos_pago.trim() || "Te los indicamos por WhatsApp al confirmar tu pedido."}</p>
        <p>Nunca te pediremos claves ni códigos de tus cuentas.</p>
      </Seccion>

      <Seccion titulo="4. Entrega">
        <p>{legal.tiempo_entrega.trim() || "El plazo y la forma de entrega se acuerdan por WhatsApp al confirmar tu pedido."}</p>
        <p>
          Si no acordamos un plazo, entregamos en máximo 30 días calendario contados desde el día siguiente a tu
          pedido. Si no cumplimos, puedes desistir de la compra y te devolvemos todo lo que pagaste, sin descuentos.
        </p>
      </Seccion>

      <Seccion titulo="5. Garantía">
        <p>
          Todos los productos tienen garantía de <strong>{garantia}</strong> desde que los recibes, salvo que la
          ficha del producto indique otro término. La garantía cubre la calidad, el buen funcionamiento y la
          seguridad del producto.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cómo pedirla:</strong> escríbenos por WhatsApp o al correo con tu código de pedido, qué falla
            y, si puedes, fotos o un video.
          </li>
          <li>
            <strong>Qué hacemos:</strong> revisamos el producto y lo reparamos sin costo. Si no se puede reparar,
            lo cambiamos o te devolvemos el dinero. Si la falla se repite, tú eliges entre una nueva reparación,
            el cambio del producto o la devolución del dinero.
          </li>
          <li>
            <strong>Qué no cubre:</strong> daños por golpes, humedad, mal uso, no seguir las instrucciones del
            fabricante, arreglos hechos por terceros, o fuerza mayor.
          </li>
        </ul>
        <p>Respondemos las solicitudes de garantía en máximo 15 días hábiles.</p>
      </Seccion>

      <Seccion titulo="6. Derecho de retracto (arrepentirte de la compra)">
        <p>
          Como compraste a distancia, puedes arrepentirte y devolver el producto dentro de los{" "}
          <strong>5 días hábiles</strong> siguientes a recibirlo, sin dar explicaciones.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Avísanos por WhatsApp o correo con tu código de pedido.</li>
          <li>
            Devuélvelo en las mismas condiciones en que lo recibiste (sin uso, con su empaque, manuales y
            accesorios). El costo de enviarlo de vuelta lo asumes tú.
          </li>
          <li>
            Te devolvemos todo el dinero en máximo <strong>15 días calendario</strong> desde que ejerces el retracto
            y recibimos el producto, por el mismo medio con el que pagaste (o el que acordemos).
          </li>
          <li>
            No aplica en los casos que excluye la ley (artículo 47 de la Ley 1480 de 2011), por ejemplo bienes de
            uso personal o hechos a tu medida.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="7. Reversión del pago">
        <p>
          Si pagaste con tarjeta de crédito, débito u otro medio de pago electrónico y fuiste víctima de fraude, no
          hiciste la compra, no recibiste el producto, o lo recibiste defectuoso o distinto a lo que pediste, puedes
          pedir que se reverse el pago. Tienes <strong>5 días hábiles</strong> desde que te enteraste (o desde que
          debías recibir el producto) para avisarnos a nosotros y a la entidad que emitió tu medio de pago, y
          devolver el producto si lo recibiste.
        </p>
      </Seccion>

      <Seccion titulo="8. Preguntas, quejas y reclamos">
        <p>
          Escríbenos por WhatsApp ({whatsapp}) o al correo {enlaceCorreo}, con tu código de pedido. El mensaje queda
          con fecha y hora como constancia y te respondemos en máximo 15 días hábiles.
        </p>
        <p>
          Si no quedas satisfecho, puedes acudir a la Superintendencia de Industria y Comercio (SIC), autoridad de
          protección al consumidor:{" "}
          <a href={ENLACE_SIC} target="_blank" rel="noopener noreferrer" className="text-marca underline">
            www.sic.gov.co
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="9. Datos personales">
        <p>
          Cómo usamos y protegemos tus datos está en la{" "}
          <Link href="/politica-de-datos" className="text-marca underline">
            política de tratamiento de datos
          </Link>
          .
        </p>
      </Seccion>
    </ArticuloLegal>
  );
}
