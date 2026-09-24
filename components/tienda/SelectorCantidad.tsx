"use client";

type Props = {
  valor: number;
  maximo: number;
  onCambiar: (valor: number) => void;
  etiqueta?: string;
  compacto?: boolean;
};

/** Botones − y + con tope (RN-04: nunca más que el stock). */
export function SelectorCantidad({ valor, maximo, onCambiar, etiqueta = "Cantidad", compacto = false }: Props) {
  const tam = compacto ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className="flex items-center rounded-xl border border-neutral-300" role="group" aria-label={etiqueta}>
      <button
        type="button"
        aria-label="Quitar una unidad"
        disabled={valor <= 1}
        onClick={() => onCambiar(Math.max(1, valor - 1))}
        className={`${tam} text-xl text-neutral-800 disabled:text-neutral-300`}
      >
        −
      </button>
      <output className="w-8 text-center text-base font-semibold" aria-live="polite">
        {valor}
      </output>
      <button
        type="button"
        aria-label="Agregar una unidad"
        disabled={valor >= maximo}
        onClick={() => onCambiar(Math.min(maximo, valor + 1))}
        className={`${tam} text-xl text-neutral-800 disabled:text-neutral-300`}
      >
        +
      </button>
    </div>
  );
}
