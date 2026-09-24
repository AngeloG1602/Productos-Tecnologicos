# Tienda de Electrónicos

Catálogo web mobile-first de accesorios electrónicos con carrito y pedidos por WhatsApp, y un panel admin para productos, stock, precios, pedidos y reparto de ganancias entre socios.

- Especificación: [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md)
- Plan de trabajo por bloques: [`docs/PLAN.md`](docs/PLAN.md)
- Reglas para desarrollar: [`CLAUDE.md`](CLAUDE.md)

## Stack
Next.js 16 (App Router, TypeScript estricto) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel

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

Funciones (RPC):
- `crear_pedido(p_items, p_cliente)` — pública. Toma precios, costos y stock de la BD. Si algo no coincide con lo que vio el cliente, **no** crea el pedido y devuelve los cambios para ajustar el carrito.
- `confirmar_pedido(id)`, `cancelar_pedido(id)`, `entregar_pedido(id)` — solo admins; mueven stock y reparto en una transacción.

### Imágenes de productos
Se guardan en Supabase Storage, bucket público `productos` (se crea en el Bloque 4).
En `productos.imagenes` va la ruta dentro del bucket (ej. `<id-producto>/1.webp`); `lib/imagenes.ts` arma la URL pública
y `next.config.ts` solo permite imágenes de ese bucket.

## Despliegue en Vercel
1. En Vercel: **Add New → Project** e importar este repositorio (framework: Next.js, sin cambios de build).
2. En **Settings → Environment Variables** cargar las tres variables de arriba (Production y Preview).
3. Desplegar. La página de inicio muestra "Supabase: Configurado" si las variables públicas quedaron bien.

## Estructura
```
app/                 rutas (App Router)
lib/                 utilidades (formato, precios, WhatsApp) y clientes de Supabase
supabase/migrations  migraciones SQL numeradas
supabase/seed.sql    datos de prueba
supabase/tests       pruebas SQL (RLS y flujo de pedidos)
scripts/             utilidades (probar-bd.sh)
docs/                especificación y plan
```
