import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envPublico, supabaseConfigurado } from "@/lib/env";

/**
 * Protege /admin: exige sesión Y estar en la tabla `administradores` (RN-10).
 * /admin/entrar queda fuera (ver matcher) para no bloquear el propio login.
 */
export async function proxy(request: NextRequest) {
  if (!supabaseConfigurado()) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const { url, llaveAnonima } = envPublico();

  // Patrón estándar de Supabase + Next: el cliente puede refrescar el token
  // de sesión, así que las cookies nuevas se copian a la petición Y a la
  // respuesta para que ambas vean la sesión ya renovada.
  const supabase = createServerClient(url, llaveAnonima, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesPorGuardar) {
        for (const { name, value } of cookiesPorGuardar) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesPorGuardar) respuesta.cookies.set(name, value, options);
      },
    },
  });

  // getUser() valida el token contra Supabase; no basta con leer la cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esLogin = request.nextUrl.pathname === "/admin/entrar";

  if (!user) {
    if (esLogin) return respuesta;
    const destino = new URL("/admin/entrar", request.url);
    destino.searchParams.set("siguiente", request.nextUrl.pathname);
    return NextResponse.redirect(destino);
  }

  const { data: esAdmin } = await supabase.rpc("es_admin");

  if (!esAdmin) {
    if (request.nextUrl.pathname === "/admin/no-autorizado") return respuesta;
    return NextResponse.redirect(new URL("/admin/no-autorizado", request.url));
  }

  if (esLogin) return NextResponse.redirect(new URL("/admin/productos", request.url));

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*"],
};
