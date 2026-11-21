/**
 * Nieve que cae sobre su contenedor (que debe ser "relative overflow-hidden"). Las posiciones
 * se calculan a partir del índice, sin Math.random, para que servidor y navegador pinten lo mismo.
 */
export function Nieve({ copos = 26 }: { copos?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: copos }, (_, i) => {
        const tam = 3 + ((i * 5) % 4) * 1.5;
        return (
          <span
            key={i}
            className="copo-nieve"
            style={
              {
                left: `${(i * 37 + 11) % 100}%`,
                width: tam,
                height: tam,
                "--dur": `${7 + ((i * 13) % 7)}s`,
                "--ret": `${-((i * 7) % 9)}s`,
                "--op": 0.45 + ((i * 3) % 5) * 0.1,
                "--vaiven": `${((i % 2) * 2 - 1) * (10 + (i % 5) * 5)}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
