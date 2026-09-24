"use client";

import { useEffect } from "react";

export default function ErrorTienda({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-bold">No pudimos cargar la tienda</h1>
      <p className="text-sm text-neutral-600">Revisa tu conexión e inténtalo de nuevo.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
