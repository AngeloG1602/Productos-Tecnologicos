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

> En `/lib`, los imports relativos entre archivos usan extensión `.ts` (por ejemplo `./formato.ts`) para que las pruebas corran directo con Node.

## Despliegue en Vercel
1. En Vercel: **Add New → Project** e importar este repositorio (framework: Next.js, sin cambios de build).
2. En **Settings → Environment Variables** cargar las tres variables de arriba (Production y Preview).
3. Desplegar. La página de inicio muestra "Supabase: Configurado" si las variables públicas quedaron bien.

## Estructura
```
app/                 rutas (App Router)
lib/                 utilidades (formato, precios, WhatsApp) y clientes de Supabase
supabase/migrations  migraciones SQL numeradas
docs/                especificación y plan
```
