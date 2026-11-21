import { parsearDescripcion } from "@/lib/descripcion";

/** Descripción ordenada: párrafos y secciones con viñetas (en vez de un muro de texto). */
export function DescripcionProducto({ texto }: { texto: string }) {
  const bloques = parsearDescripcion(texto);
  if (bloques.length === 0) return null;
  return (
    <section aria-labelledby="titulo-descripcion" className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-4">
      <h2 id="titulo-descripcion" className="flex items-center gap-2 text-base font-extrabold tracking-tight">
        <span aria-hidden="true" className="h-4 w-1.5 rounded-full bg-acento" />
        Descripción
      </h2>
      {bloques.map((b, i) =>
        b.tipo === "parrafo" ? (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-line text-texto/85">
            {b.texto}
          </p>
        ) : (
          <div key={i} className="flex flex-col gap-2">
            {b.titulo && <h3 className="text-sm font-bold text-texto">{b.titulo}</h3>}
            <ul className="flex flex-col gap-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-texto/85">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-acento" />
                  <span>
                    {it.etiqueta && <strong className="font-semibold text-texto">{it.etiqueta}: </strong>}
                    {it.texto}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </section>
  );
}
