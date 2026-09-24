export function AvisoSinConfigurar() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Falta conectar la base de datos</p>
      <p className="mt-1">
        Configura <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ver
        README) para ver el catálogo.
      </p>
    </div>
  );
}
