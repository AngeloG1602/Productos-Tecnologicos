# Tienda de Electrónicos

Catálogo web mobile-first de accesorios electrónicos con carrito y pedidos por WhatsApp, y un panel admin para productos, stock, precios, pedidos y reparto de ganancias entre socios.

- Especificación: [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md)
- Plan de trabajo por bloques: [`docs/PLAN.md`](docs/PLAN.md)
- Reglas para desarrollar: [`CLAUDE.md`](CLAUDE.md)

## Stack
Next.js 16 (App Router, TypeScript estricto) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Netlify (antes Vercel)

## Requisitos
- Node.js 22.18 o superior (las pruebas usan `node:test` ejecutando TypeScript directamente)
- Un proyecto en [Supabase](https://supabase.com) (plan gratuito)

## Instalación local
```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev                  # http://localhost:3000
```

### Variables de entorno
| Variable | Dónde se usa | Origen (Supabase → Project Settings → API) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador y servidor | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador y servidor | llave `anon` / `publishable` |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | llave `service_role` / `secret` |

La llave `service_role` ignora RLS: nunca se le pone prefijo `NEXT_PUBLIC_` ni se importa desde componentes de cliente (`lib/supabase/admin.ts` usa `server-only` para impedirlo).

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Genera tipos de rutas y corre `tsc` |
| `npm test` | Pruebas unitarias de `/lib` (`node:test`) |
| `npm run test:bd` | Pruebas de migraciones, RLS y funciones en un Postgres local |

> En `/lib`, los imports relativos entre archivos usan extensión `.ts` (por ejemplo `./formato.ts`) para que las pruebas corran directo con Node.

## Base de datos (Supabase)

> Paso a paso sin conocimientos técnicos: [`docs/GUIA-INSTALACION.md`](docs/GUIA-INSTALACION.md).

### Aplicar migraciones y datos de prueba
- **Proyecto nuevo:** pegar `supabase/instalar.sql` (todas las migraciones + seed) en **SQL Editor** → Run.
  Se genera con `bash scripts/generar-instalar.sh`; `npm run test:bd` falla si quedó desactualizado.
- **Cambios posteriores:** pegar solo el archivo nuevo de `supabase/migrations/`.

(Con la CLI de Supabase: `supabase link` y luego `supabase db push`.)

### Crear los administradores
No hay registro público. Para cada uno de los 2 admins:
1. **Authentication → Users → Add user** (correo y contraseña, marcar "Auto Confirm User").
2. En el SQL Editor, pegar `supabase/crear-admin.sql` con el correo y nombre de cada admin.
3. En **Authentication → Sign In / Providers**, desactivar **"Allow new users to sign up"**.
   Aunque alguien lograra registrarse, no tendría permisos: solo cuenta quien esté en `administradores`.

### Verificar la seguridad
- **En Supabase:** pegar `supabase/tests/01_rls_anonimo.sql` en el SQL Editor. Debe terminar sin error
  (muestra "OK …" por cada comprobación y deshace todo al final; solo consume un número de pedido).
- **En local:** `npm run test:bd` crea una base desechable en un Postgres local, aplica migraciones y seed,
  y corre todas las pruebas de `supabase/tests/` (incluido el flujo completo de pedidos, stock y reparto).
  Usa las variables de `psql` (`PGHOST`, `PGPORT`, `PGUSER`) y necesita un usuario que pueda crear bases y roles.

### Cómo está protegida
| Tabla | Anónimo | Admin |
|---|---|---|
| `categorias`, `productos` | lee (solo productos activos) | todo |
| `producto_costos`, `socios` | ✗ | todo |
| `pedidos`, `pedido_items`, `pedido_reparto` | ✗ | solo lectura |
| `configuracion` | solo vía `configuracion_publica()` (sin margen ni redondeo) | lee y edita |
| Bucket `productos` (Storage) | lee | lee y escribe |

Funciones (RPC):
- `crear_pedido(p_items, p_cliente)` — pública. Toma precios, costos y stock de la BD. Si algo no coincide con lo que vio el cliente, **no** crea el pedido y devuelve los cambios para ajustar el carrito.
- `confirmar_pedido(id)`, `cancelar_pedido(id)`, `entregar_pedido(id)` — solo admins; mueven stock y reparto en una transacción.
- `guardar_producto(...)`, `duplicar_producto(id)` — solo admins; crean/editan un producto y su costo en una sola transacción, o lo duplican como variante inactiva.
- `guardar_socios(lista)`, `resumen_ventas(desde, hasta)` — solo admins; socios en una transacción (suma 100 %) y datos del dashboard.

Límite de pedidos (anti-spam, trigger `limitar_pedidos` sobre `pedidos`): máximo 3 pedidos cada 10 minutos desde la
misma IP y 30 por hora en total. La IP se toma de las cabeceras que Supabase pasa a Postgres (`cf-connecting-ip` o
`x-forwarded-for`) y solo se guarda un resumen (`md5` de IP + fecha) en `pedidos_origen`, que se borra al día siguiente.

### Panel admin (`/admin`)
- `/admin/entrar`: correo y contraseña (las cuentas se crean a mano en Supabase, ver arriba). `proxy.ts` protege todo lo demás: exige sesión y estar en la tabla `administradores`; si no, redirige a `/admin/no-autorizado`.
- Inicio: alertas (pedidos pendientes/vencidos, stock bajo), ventas, costo, ganancia y reparto por socio en un rango de fechas.
- Pedidos: lista filtrable y detalle con botones de estado (confirmar descuenta stock; cancelar un confirmado lo devuelve).
- Productos: lista con edición rápida de stock y de activo/inactivo, formulario con precio sugerido (RN-01) y precio anterior opcional (muestra el descuento en la tienda), duplicar, eliminar y **copiar enlace para anuncio**.
- Categorías: crear, renombrar, reordenar, eliminar.
- Socios: porcentajes de reparto (los activos deben sumar 100 %).
- Inicio: además, reparto por socio (nombre y porcentaje actuales; cada pedido conserva el reparto con que se
  confirmó), más vendidos y **reporte en Excel** del rango (`/admin/reporte?desde=&hasta=`: resumen, pedidos,
  detalle, por producto, categoría, día, día de la semana, ciudad y reparto; `lib/xlsx.ts` lo genera sin librerías).
- Configuración: WhatsApp, margen por defecto, redondeo, umbral de stock bajo y texto de envío; **datos legales**
  opcionales y públicos (responsable, cédula/NIT, dirección, ciudad, correo, garantía, pago, tiempo de entrega) y
  **copia de seguridad** (`/admin/respaldo` descarga todas las tablas en JSON, con la sesión del admin).
- Guardar desde el admin actualiza la tienda pública al instante (`updateTag`).

### Páginas legales
- `/terminos`: quién vende, cómo funciona un pedido, pago contra entrega, entrega (máx. 30 días si no se acuerda otro plazo),
  garantía, derecho de retracto (5 días hábiles; devolución en 15 días calendario), quejas y enlace a la SIC
  (Ley 1480 de 2011 y Ley 2439 de 2024).
- `/politica-de-datos`: Ley 1581 de 2012 y Decreto 1377 de 2013.
- Ambas toman los datos de Configuración; los que están vacíos no se muestran. Textos pensados para pago contra
  entrega (la página no cobra). La fecha de revisión está en `lib/legal.ts` (`ACTUALIZACION_TEXTOS_LEGALES`).
- Textos base: se recomienda revisión de un abogado.

### Monitoreo y disponibilidad
- `/api/health` consulta la base en cada llamada (sin caché) y responde `{"estado":"ok"}` o 503.
- Una visita diaria a `/api/health` evita que Supabase gratis pause el proyecto por inactividad (7 días): en Netlify la hace la función programada `netlify/functions/despertar-bd.mts` (`netlify.toml`); en Vercel, `vercel.json`.
- Monitor externo recomendado: UptimeRobot cada 5 min contra `/api/health` (ver la guía).

### Identidad de la tienda
Nombre, color y descripción en `lib/tienda.ts` (título de las páginas, pie, imagen al compartir `app/(tienda)/opengraph-image.tsx`
y textos legales). El color de la interfaz está en `app/globals.css` (`--marca`).

### Enlaces para anuncios
`/producto/<slug>?agregar=1` abre la ficha con el producto ya en el carrito (una sola vez; no agrega agotados) y
conserva los parámetros de campaña (`utm_source`, `fbclid`…). El botón "Copiar enlace para anuncio" del panel lo arma.

### Imágenes de productos
Se guardan en Supabase Storage, bucket público `productos` (creado por la migración del Bloque 4).
En `productos.imagenes` va la ruta dentro del bucket (ej. `<id-producto>/1.webp`); `lib/imagenes.ts` arma la URL pública,
`next.config.ts` solo permite imágenes de ese bucket, y `lib/imagen-cliente.ts` las redimensiona y comprime a WebP
(≤ 1200 px, RNF-02) en el navegador antes de subirlas.

## Despliegue en Netlify
Paso a paso sin conocimientos técnicos: [`docs/GUIA-INSTALACION.md`](docs/GUIA-INSTALACION.md), Parte 8.

1. Netlify → **Add new project → Import an existing project** → este repositorio, rama de trabajo.
2. `netlify.toml` define el build (`npm run build`, `.next`, Node 22), la función diaria y el `ignore`
   que no publica cambios de solo documentos (cada publicación gasta créditos del plan gratis).
3. Variables: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La llave `service_role` no se usa.
4. Comprobar `https://<sitio>/api/health` → `{"estado":"ok"}`.

> Vercel: el plan Hobby es solo para uso personal/no comercial; por eso la tienda pasa a Netlify.

## Estructura
```
app/                 rutas (App Router)
lib/                 utilidades (formato, precios, WhatsApp) y clientes de Supabase
supabase/migrations  migraciones SQL numeradas
supabase/seed.sql    datos de prueba
supabase/tests       pruebas SQL (RLS, pedidos, catálogo, ventas, límites)
scripts/             utilidades (probar-bd.sh)
docs/                especificación y plan
```
