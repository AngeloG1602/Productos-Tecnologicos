# CLAUDE.md

## Proyecto
Catálogo web mobile-first de accesorios electrónicos con carrito y envío de pedidos por WhatsApp, más un panel admin para productos, stock, precios, pedidos y reparto de ganancias entre socios.

La especificación completa está en `docs/ESPECIFICACION.md`. Léela antes de empezar cualquier bloque. La visión y el alcance están en `docs/F0-vision-alcance.md`.

## Stack
- Next.js (App Router) + TypeScript estricto
- Tailwind CSS
- Supabase: Postgres, Auth (correo/contraseña), Storage (imágenes)
- Vercel (hosting)
- Estado del carrito: en el cliente, persistido en localStorage

No agregues librerías nuevas sin preguntar primero y explicar por qué.

## Reglas que no se pueden romper
1. El costo y el margen de los productos **nunca** se envían al navegador en rutas públicas. Viven en `producto_costos`, accesible solo para admins.
2. Todas las tablas tienen Row Level Security activado, con políticas explícitas.
3. Los pedidos públicos solo se crean mediante la función `crear_pedido`, que toma precios y stock de la base de datos. Nunca confíes en precios que vengan del cliente.
4. Confirmar y cancelar pedidos se hace en transacciones dentro de Postgres (`confirmar_pedido`, `cancelar_pedido`). El stock nunca puede quedar negativo.
5. Los pedidos congelan nombre, precio, costo y reparto al momento correspondiente (ver RN-06 y RN-07).
6. La llave `service_role` de Supabase solo se usa en el servidor y nunca se expone con prefijo `NEXT_PUBLIC_`.
7. Montos en pesos colombianos enteros (`int`). Mostrar con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.
8. Toda la interfaz en español. Diseñar primero para 360 px de ancho.

## Estructura sugerida
```
/app
  /(tienda)        páginas públicas
  /admin           panel protegido
  /api/health      chequeo de estado (consulta la BD)
/components
/lib               cliente Supabase, utilidades de precio y formato, armado del mensaje de WhatsApp
/supabase/migrations   migraciones SQL numeradas
/docs              especificación y documentos del proyecto
```

## Forma de trabajo
- Trabaja **un bloque a la vez** (B0 a B6, sección 7 de la especificación).
- Antes de escribir código en un bloque, muestra un plan corto y espera aprobación.
- Al terminar un bloque: resume qué hiciste, cómo probarlo y qué quedó pendiente. Detente y espera revisión.
- Todo cambio de base de datos va como archivo nuevo en `supabase/migrations`. No edites migraciones ya aplicadas.
- Las funciones de precio (cálculo, redondeo) y armado del mensaje de WhatsApp van en `/lib` con pruebas unitarias simples.
- Si algo de la especificación es ambiguo o está marcado [POR CONFIRMAR], usa el valor por defecto indicado y avísame; no inventes reglas nuevas.
- Mensajes de commit en español, cortos y descriptivos.

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npm run typecheck` — genera tipos de rutas de Next y corre `tsc`
- `npm test` — pruebas unitarias de `/lib` con `node:test` (Node ≥ 22.18, sin librerías extra)
- `npm run test:bd` — aplica migraciones + seed en un Postgres local desechable y corre `supabase/tests/*.sql`

Notas:
- Esta versión de Next.js (16) tiene cambios respecto a versiones anteriores (ej. `middleware` ahora es `proxy.ts`). Ver `AGENTS.md` y la documentación en `node_modules/next/dist/docs/`.
- En `/lib`, los imports relativos usan extensión `.ts` para que `node --test` los resuelva.
- El plan por bloques y su estado está en `docs/PLAN.md`.
- Tipos de la BD en `lib/supabase/tipos.ts`: actualizarlos junto con cada migración.
- Tras cambiar migraciones o seed, regenerar `supabase/instalar.sql` con `bash scripts/generar-instalar.sh` (lo verifica `npm run test:bd`).
- El estado de los pedidos solo cambia vía RPC (`confirmar_pedido`, `cancelar_pedido`, `entregar_pedido`); no hay UPDATE directo.
- `/admin` está protegido por `proxy.ts` (sesión + tabla `administradores`); las mutaciones del panel van en `app/admin/**/acciones.ts` (Server Actions), no en componentes de cliente.
