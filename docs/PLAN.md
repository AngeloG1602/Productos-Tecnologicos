# Plan de trabajo — Tienda de Electrónicos V1

Basado en `docs/ESPECIFICACION.md` (sección 7) y `CLAUDE.md`. Se trabaja **un bloque a la vez**; al cerrar cada bloque se resume qué se hizo, cómo probarlo y qué quedó pendiente, y se espera revisión antes de seguir.

Estado: ⬜ pendiente · 🟨 en curso · ✅ terminado

---

## B0 — Base del proyecto ✅ (falta publicar en Vercel)
**Listo cuando:** una página de prueba está publicada en Vercel.

- [x] Next.js (App Router) + TypeScript estricto + Tailwind + ESLint
- [x] Dependencias de Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] `lib/env.ts`: lectura y validación de variables de entorno
- [x] `lib/supabase/navegador.ts` y `lib/supabase/servidor.ts` (clientes con la llave pública); `lib/supabase/admin.ts` (service_role, solo servidor, con `server-only`)
- [x] `lib/formato.ts`: `formatearCOP()` + prueba unitaria con `node:test` (sin librerías nuevas)
- [x] Página de prueba en español, mobile-first (360 px)
- [x] `.env.example`, README con instalación, comandos en `CLAUDE.md`
- [ ] **(Tú)** Crear proyecto en Supabase y copiar URL + llaves
- [ ] **(Tú)** Conectar el repo en Vercel, cargar variables de entorno y publicar

## B1 — Base de datos ✅ (falta aplicar en el proyecto de Supabase)
**Listo cuando:** un usuario anónimo puede leer productos pero no costos ni pedidos.

- [x] `20260924000100_esquema.sql`: tablas, enum de estado, restricciones (`stock >= 0`, montos `int`, máx. 4 imágenes, slugs), `updated_at`, código `PED-0001`, tabla `administradores`, validación diferida de socios = 100 %
- [x] `20260924000200_seguridad.sql`: `es_admin()`, RLS en todas las tablas, GRANT mínimos, `configuracion_publica()`, EXECUTE revocado por defecto
- [x] `20260924000300_funciones_pedidos.sql`: `crear_pedido`, `confirmar_pedido`, `cancelar_pedido` y `entregar_pedido`
- [x] `supabase/seed.sql`: 6 categorías, 12 productos (stock alto, bajo, agotado, inactivo), 2 socios 50/50, WhatsApp de prueba
- [x] `supabase/tests/01_rls_anonimo.sql` (criterio del bloque; sirve en el SQL Editor) y `02_flujo_pedidos.sql` (flujo completo)
- [x] `npm run test:bd` y tipos en `lib/supabase/tipos.ts`
- [ ] **(Tú)** Aplicar migraciones + seed en Supabase, crear los 2 admins y desactivar el registro público

## B2 — Catálogo público ⬜
**Listo cuando:** se navega el catálogo en el celular con datos de prueba.

- Inicio: chips de categorías, buscador, grilla, destacados
- Ficha de producto `/producto/[slug]`: galería, precio, disponibilidad (RN-03), selector de cantidad
- `lib/stock.ts`: texto de disponibilidad según umbral (con pruebas)
- Imágenes con `next/image` desde Supabase Storage

## B3 — Carrito + pedido + WhatsApp ⬜
**Listo cuando:** un pedido de prueba queda registrado y abre WhatsApp con el mensaje correcto.

- Carrito en cliente persistido en `localStorage` (límite por stock, RN-04)
- Formulario: nombre, ciudad/barrio, notas, aceptación de política (RN-09)
- Llamada a `crear_pedido`; si cambió stock/precio, se ajusta el carrito y se avisa antes de abrir WhatsApp
- `lib/whatsapp.ts`: armado del mensaje (RN-08) y del enlace `wa.me` (con pruebas)
- Botón flotante de WhatsApp (RF-08)

## B4 — Admin: acceso + catálogo ⬜
**Listo cuando:** los dos admins pueden crear un producto completo desde el celular.

- Login correo/contraseña; `proxy.ts` protege `/admin`
- CRUD de productos (activar/desactivar, destacado, stock) y categorías
- Hasta 4 imágenes por producto en Storage (conversión a WebP ≤ 1200 px en el navegador)
- `lib/precio.ts`: precio sugerido RN-01, margen real, alerta bajo costo (con pruebas)

## B5 — Admin: pedidos, socios, dashboard, configuración ⬜
**Listo cuando:** confirmar/cancelar pedidos mueve el stock bien y el reparto cuadra.

- Pedidos: lista filtrable por estado, marca de "vencido" (> 7 días pendiente), detalle con botones de estado
- Socios con validación de 100 %
- Dashboard: ventas, costo, ganancia y reparto por socio en rango de fechas; stock bajo; pendientes
- Configuración: WhatsApp, margen por defecto, redondeo, umbral de stock, texto de envío

## B6 — Pulido y salida ⬜
**Listo cuando:** Lighthouse móvil ≥ 85 y prueba completa de punta a punta.

- Open Graph por producto (RNF-07)
- Página de política de tratamiento de datos (Ley 1581 de 2012)
- `/api/health` que consulta la BD + guía de monitoreo (UptimeRobot)
- Revisión de rendimiento, README final, guía de respaldo semanal, dominio

---

## Valores por defecto en uso ([POR CONFIRMAR])
| Tema | Valor usado |
|---|---|
| Nombre de la tienda | "Tienda" |
| Margen / redondeo | 40 % / múltiplos de $100 |
| Socios | 2 socios 50/50 |
| Envío, pago, IVA | Se acuerdan por WhatsApp; precio final sin desglose |

## Notas
- `docs/F0-vision-alcance.md` se menciona en `CLAUDE.md` pero aún no está en el repo.
