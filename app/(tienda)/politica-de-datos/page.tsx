import type { Metadata } from "next";
import Link from "next/link";
import { ArticuloLegal, Dato, ENLACE_SIC, FichaVendedor, Seccion } from "@/components/tienda/TextoLegal";
import { obtenerDatosTienda } from "@/lib/datos-tienda";
import { ACTUALIZACION_TEXTOS_LEGALES } from "@/lib/legal";
import { enlaceWhatsApp, formatearTelefono } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: "Cómo tratamos tus datos personales (Ley 1581 de 2012).",
};

// Los datos del responsable se editan en Admin → Configuración (se actualiza al guardar).
export const revalidate = 60;

// TEXTO BASE: refleja lo que la plataforma hace hoy (RN-09) y el contenido mínimo del
// Decreto 1377 de 2013 (art. 13). Se recomienda que lo revise un abogado.
export default async function PoliticaDeDatos() {
  const { whatsappNumero, legal } = await obtenerDatosTienda();
  const correo = legal.legal_correo.trim();
  const contacto = (
    <>
      {correo ? (
        <a href={`mailto:${correo}`} className="text-marca underline">
          {correo}
        </a>
      ) : (
        <Dato valor="" />
      )}
      {whatsappNumero && (
        <>
          {" "}o por WhatsApp al{" "}
          <a href={enlaceWhatsApp(whatsappNumero)} className="text-marca underline">
            {formatearTelefono(whatsappNumero)}
          </a>
        </>
      )}
    </>
  );

  return (
    <ArticuloLegal titulo="Política de tratamiento de datos personales" actualizacion={ACTUALIZACION_TEXTOS_LEGALES}>
      <Seccion titulo="1. Responsable">
        <p>
          El responsable del tratamiento de los datos personales que recibe esta tienda, conforme a la Ley 1581 de
          2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015), es:
        </p>
        <FichaVendedor
          filas={[
            ["Nombre", <Dato key="n" valor={legal.legal_nombre} />],
            ["Cédula / NIT", <Dato key="d" valor={legal.legal_documento} />],
            ["Dirección", <Dato key="a" valor={legal.legal_direccion} />],
            ["Ciudad", <Dato key="c" valor={legal.legal_ciudad} />],
            ["Teléfono", whatsappNumero ? formatearTelefono(whatsappNumero) : <Dato key="t" valor="" />],
            ["Correo", <Dato key="e" valor={correo} />],
          ]}
        />
      </Seccion>

      <Seccion titulo="2. Qué datos recogemos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Al hacer un pedido: tu nombre, tu ciudad y barrio, y las notas que quieras agregar.</li>
          <li>
            Tu número de teléfono lo conocemos solo cuando nos escribes por WhatsApp; no lo guardamos en esta
            plataforma.
          </li>
          <li>
            Tu carrito se guarda únicamente en tu propio navegador (almacenamiento local) para que no lo pierdas si
            cierras la página. No usamos cookies de publicidad ni de seguimiento.
          </li>
          <li>
            Para evitar pedidos falsos, al enviar un pedido guardamos durante un día un código calculado a partir de
            tu dirección IP (no la IP misma), que solo sirve para limitar pedidos seguidos.
          </li>
        </ul>
        <p>No recogemos datos sensibles ni datos de menores de edad.</p>
      </Seccion>

      <Seccion titulo="3. Para qué los usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Registrar y gestionar tu pedido.</li>
          <li>Contactarte por WhatsApp para confirmar disponibilidad, envío, pago y entrega.</li>
          <li>Llevar el registro de ventas del negocio.</li>
        </ul>
        <p>No vendemos ni compartimos tus datos con terceros para fines comerciales.</p>
      </Seccion>

      <Seccion titulo="4. Tus derechos">
        <p>Como titular de los datos puedes, en cualquier momento y sin costo:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber qué uso le hemos dado a tus datos.</li>
          <li>Revocar la autorización o pedir que eliminemos tus datos, cuando no exista un deber legal de conservarlos.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio (
            <a href={ENLACE_SIC} target="_blank" rel="noopener noreferrer" className="text-marca underline">
              www.sic.gov.co
            </a>
            ), después de haber hecho tu consulta o reclamo ante nosotros.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="5. Cómo ejercerlos">
        <p>
          Escríbenos a {contacto}. Responderemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días
          hábiles (artículos 14 y 15 de la Ley 1581 de 2012).
        </p>
      </Seccion>

      <Seccion titulo="6. Conservación y seguridad">
        <p>
          Guardamos los datos del pedido mientras sean necesarios para las finalidades descritas y para cumplir
          obligaciones legales. Solo los administradores de la tienda pueden verlos, con acceso protegido.
        </p>
        <p>
          La tienda funciona sobre servicios de proveedores tecnológicos (Supabase para la base de datos y Vercel
          para el sitio web), que pueden tener servidores fuera de Colombia. Ellos solo guardan la información por
          encargo nuestro, con medidas de seguridad, y no la usan para sus propios fines. La conversación por
          WhatsApp se rige además por las condiciones de ese servicio.
        </p>
      </Seccion>

      <Seccion titulo="7. Autorización">
        <p>
          Al marcar la casilla de aceptación antes de enviar tu pedido, autorizas el tratamiento de tus datos según
          esta política. Cualquier cambio importante a esta política se publicará en esta misma página.
        </p>
        <p>
          Las condiciones de compra, garantía y devoluciones están en los{" "}
          <Link href="/terminos" className="text-marca underline">
            términos y condiciones
          </Link>
          .
        </p>
      </Seccion>
    </ArticuloLegal>
  );
}
