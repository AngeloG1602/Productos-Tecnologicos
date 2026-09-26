// Piezas comunes de /terminos y /politica-de-datos.

export function ArticuloLegal({
  titulo,
  actualizacion,
  children,
}: {
  titulo: string;
  actualizacion: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4 py-2 text-sm leading-relaxed text-neutral-800">
      <h1 className="text-xl font-bold text-neutral-950">{titulo}</h1>
      <p className="text-neutral-500">Última actualización: {actualizacion}.</p>
      {children}
    </article>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-neutral-950">{titulo}</h2>
      {children}
    </section>
  );
}

type FilaVendedor = [string, React.ReactNode];

/** Quita las filas sin valor: lo que el admin deja vacío en Configuración no se publica. */
export function filasPublicas(filas: [string, React.ReactNode | string | null | undefined][]): FilaVendedor[] {
  return filas.filter((f): f is FilaVendedor => (typeof f[1] === "string" ? f[1].trim() !== "" : f[1] != null));
}

/** Tabla simple de datos del vendedor. */
export function FichaVendedor({ filas }: { filas: FilaVendedor[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-neutral-50 p-3">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="contents">
          <dt className="text-neutral-500">{etiqueta}</dt>
          <dd className="min-w-0 break-words">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export const ENLACE_SIC = "https://www.sic.gov.co";
