# Plan de trabajo — Tienda de Electrónicos V1

Basado en `docs/ESPECIFICACION.md` (sección 7) y `CLAUDE.md`. Se trabaja **un bloque a la vez**; al cerrar cada bloque se resume qué se hizo, cómo probarlo y qué quedó pendiente, y se espera revisión antes de seguir.

Estado: ⬜ pendiente · 🟨 en curso · ✅ terminado

---

## B0 — Base del proyecto 🟨
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

## B1 — Base de datos ⬜
**Listo cuando:** un usuario anónimo puede leer productos pero no costos ni pedidos.

- Migraciones numeradas en `supabase/migrations`:
  1. Tablas: `categorias`, `productos`, `producto_costos`, `socios`, `pedidos` (+ enum de estado), `pedido_items`, `pedido_reparto`, `configuracion` (1 fila)
  2. Restricciones: `stock >= 0`, montos `int`, slugs únicos, `updated_at` automático, código consecutivo `PED-0001` (secuencia)
  3. Tabla/función `es_admin()` para las políticas (admins = usuarios listados, creados a mano en Supabase)
  4. RLS en **todas** las tablas con políticas explícitas (anónimo: solo categorías, productos activos y los campos públicos de configuración)
  5. RPC `crear_pedido(items, cliente)` (security definer, precios/costos desde la BD, devuelve ítems ajustados)
  6. RPC `confirmar_pedido(id)` y `cancelar_pedido(id)` en transacción; stock nunca negativo; congela reparto
  7. Validación de socios activos que sumen 100 %
- `supabase/seed.sql` con datos de prueba (categorías, ~10 productos, 2 socios 50/50, configuración)
- Script SQL de verificación de RLS (consultas como `anon`)
- Tipos TypeScript de la BD (`lib/supabase/tipos.ts`)

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
