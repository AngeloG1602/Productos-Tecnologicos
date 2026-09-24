import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: "Cómo tratamos tus datos personales (Ley 1581 de 2012).",
};

// TEXTO BASE [POR CONFIRMAR]: completar lo marcado entre corchetes y hacerlo revisar
// antes de publicar. Refleja lo que la plataforma hace hoy (RN-09).
const RESPONSABLE = "[Nombre o razón social del responsable]";
const DOCUMENTO = "[NIT o cédula]";
const CIUDAD = "[Ciudad]";
const CORREO = "[correo de contacto]";
const FECHA = "[fecha de entrada en vigencia]";

export default function PoliticaDeDatos() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4 py-2 text-sm leading-relaxed text-neutral-800">
      <h1 className="text-xl font-bold text-neutral-950">Política de tratamiento de datos personales</h1>
      <p className="text-neutral-500">Vigente desde {FECHA}.</p>

      <Seccion titulo="1. Responsable">
        <p>
          {RESPONSABLE}, identificado con {DOCUMENTO}, con domicilio en {CIUDAD}, Colombia, es el responsable del
          tratamiento de los datos personales que recibe a través de esta tienda, conforme a la Ley 1581 de 2012 y
          el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).
        </p>
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
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
        </ul>
      </Seccion>

      <Seccion titulo="5. Cómo ejercerlos">
        <p>
          Escríbenos a {CORREO} o por el mismo WhatsApp de la tienda. Responderemos consultas en máximo 10 días
          hábiles y reclamos en máximo 15 días hábiles, según la ley.
        </p>
      </Seccion>

      <Seccion titulo="6. Conservación y seguridad">
        <p>
          Guardamos los datos del pedido mientras sean necesarios para las finalidades descritas y para cumplir
          obligaciones legales. Solo los administradores de la tienda pueden verlos, con acceso protegido.
        </p>
      </Seccion>

      <Seccion titulo="7. Autorización">
        <p>
          Al marcar la casilla de aceptación antes de enviar tu pedido, autorizas el tratamiento de tus datos según
          esta política. Cualquier cambio importante a esta política se publicará en esta misma página.
        </p>
      </Seccion>
    </article>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-neutral-950">{titulo}</h2>
      {children}
    </section>
  );
}
