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

## B2 — Catálogo público ✅
**Listo cuando:** se navega el catálogo en el celular con datos de prueba.

- [x] Inicio: buscador (sin importar tildes), chips de categorías (solo las que tienen productos), destacados, grilla de 2 columnas a 360 px
- [x] Filtros en la URL (`?categoria=…&q=…`): se conservan al volver desde una ficha y se pueden compartir; se filtra en el navegador (catálogo < 50 productos)
- [x] Ficha `/producto/[slug]`: galería deslizable con miniaturas, precio, disponibilidad (RN-03), selector de cantidad limitado al stock; botón "Agregar" se activa en B3
- [x] Inactivos e inexistentes → 404; agotados al final de la grilla y sin poder comprarse
- [x] `lib/stock.ts`, `lib/texto.ts`, `lib/imagenes.ts` con pruebas
- [x] Caché: páginas regeneradas cada 60 s con etiqueta `catalogo` (el admin la invalidará en B4); fichas pregeneradas al compilar
- [x] Imágenes con `next/image` desde Supabase Storage (en la BD se guarda la ruta dentro del bucket `productos`)

## B3 — Carrito + pedido + WhatsApp ✅
**Listo cuando:** un pedido de prueba queda registrado y abre WhatsApp con el mensaje correcto.

- [x] Carrito en el navegador (`localStorage`, sincronizado entre pestañas), con tope por stock (RN-04)
- [x] Ícono con contador en el encabezado; botón **+** de agregado rápido en cada tarjeta; "Agregar" en la ficha; aviso "Agregado al carrito · Ver carrito"
- [x] Página `/carrito`: cantidades, quitar, total, formulario (nombre, ciudad/barrio, notas, aceptación de política)
- [x] Envío vía `crear_pedido`; si cambió stock/precio se ajusta el carrito y se avisa sin abrir WhatsApp; el formulario conserva lo escrito
- [x] Mensaje de WhatsApp (RN-08) **con el enlace de cada producto** (pedido del cliente); se abre en la misma pestaña (en el celular abre la app)
- [x] Pantalla "pedido listo" con botón para reabrir WhatsApp si no se abrió o el cliente vuelve atrás (30 min)
- [x] Botón flotante de WhatsApp para consultas (RF-08), oculto en el carrito
- [x] Página `/politica-de-datos` con texto base (Ley 1581) — **[COMPLETAR]** responsable, NIT/cédula, ciudad, correo y fecha; revisión legal recomendada
- [x] `lib/whatsapp.ts`, `lib/carrito.ts`, `lib/pedido.ts` con pruebas (29 en total)

## B4 — Admin: acceso + catálogo ✅
**Listo cuando:** los dos admins pueden crear un producto completo desde el celular.

- [x] `20260924000400_admin_catalogo.sql`: columna `precio_anterior`, bucket `productos` en Storage con RLS (lectura pública, escritura solo admins), `guardar_producto` (upsert atómico producto + costo) y `duplicar_producto`
- [x] `proxy.ts` protege todo `/admin`: exige sesión y estar en `administradores` (RN-10); `/admin/no-autorizado` para cuentas sin permiso
- [x] Login en `/admin/entrar`, con `?siguiente=` para volver a donde se quería entrar
- [x] Productos: lista con buscador y filtros, edición rápida de stock y de activo/inactivo en la misma lista, duplicar, eliminar (borra también las fotos del bucket)
- [x] Formulario de producto: precio sugerido en vivo (RN-01), margen real y aviso si el precio queda bajo el costo, precio anterior opcional (para descuentos, valida que sea mayor al actual), hasta 4 fotos
- [x] Fotos: se comprimen a WebP ≤ 1200 px en el navegador antes de subir (`lib/imagen-cliente.ts`, sin librerías nuevas)
- [x] Categorías: crear, renombrar, reordenar (subir/bajar), eliminar
- [x] Guardar en el admin actualiza la tienda pública al instante (`updateTag`)
- [x] `lib/precio.ts` (RN-01) y `lib/slug.ts`, con pruebas (37 en total)
- [x] Probado de punta a punta: login, no-admin, categorías, producto con foto y precio ajustado, stock rápido, activar/desactivar (se refleja en la tienda), duplicar, eliminar — 38 pasos

## B5 — Admin: pedidos, socios, dashboard, configuración ⬜
**Listo cuando:** confirmar/cancelar pedidos mueve el stock bien y el reparto cuadra.

- Pedidos: lista filtrable por estado, marca de "vencido" (> 7 días pendiente), detalle con botones de estado
- Socios con validación de 100 %
- Dashboard: ventas, costo, ganancia y reparto por socio en rango de fechas; stock bajo; pendientes
- Configuración: WhatsApp, margen por defecto, redondeo, umbral de stock, texto de envío

## B6 — Pulido y salida ⬜
**Listo cuando:** Lighthouse móvil ≥ 85 y prueba completa de punta a punta.

- Open Graph por producto (RNF-07)
- Revisar/completar el texto de la política de datos (la página ya existe desde B3)
- Límite de pedidos anónimos seguidos (anti-spam de `crear_pedido`)
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
| Precio "antes/ahora" | Campo opcional `precio_anterior`; solo se muestra si es un precio real ya cobrado (RN-01 ampliado, B4) |

## Notas
- `docs/F0-vision-alcance.md` se menciona en `CLAUDE.md` pero aún no está en el repo.
