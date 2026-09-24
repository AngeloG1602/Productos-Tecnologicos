# Especificación del Proyecto — Tienda de Electrónicos (V1)

> Documento único de referencia para el desarrollo. Reemplaza a F1 y F2 en versión ligera.
> Lo que está marcado como **[POR CONFIRMAR]** tiene un valor por defecto: se puede desarrollar con él y cambiarlo después.

---

## 1. Resumen

Catálogo web mobile-first de accesorios electrónicos (cargadores, audífonos, etc.) comprados al por mayor y revendidos al detal. El cliente arma un carrito y envía el pedido por WhatsApp a un número fijo. Dos administradores gestionan productos, stock, precios (costo + margen) y el reparto de ganancias entre socios desde un panel privado.

- Moneda: pesos colombianos (COP), formato `es-CO` → `$16.800`
- Idioma de la interfaz: español
- Catálogo inicial: menos de 50 productos
- Stack: Next.js (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth, Storage) + Vercel

---

## 2. Requerimientos funcionales

### 2.1 Parte pública (clientes)

| ID | Requerimiento |
|---|---|
| RF-01 | Ver el catálogo de productos activos con imagen, nombre, precio y estado de disponibilidad |
| RF-02 | Filtrar por categoría y buscar por nombre |
| RF-03 | Ver la ficha de un producto (galería de imágenes, descripción, precio, disponibilidad) |
| RF-04 | Agregar productos al carrito, cambiar cantidades y eliminar productos |
| RF-05 | El carrito se conserva si el cliente cierra y vuelve a abrir la página (almacenamiento local del navegador) |
| RF-06 | Antes de enviar, el cliente escribe su nombre y ciudad/barrio (notas opcionales) y acepta la política de datos |
| RF-07 | Al enviar, el sistema valida stock y precios contra la base de datos, registra el pedido y abre WhatsApp con el mensaje prellenado |
| RF-08 | Botón flotante de WhatsApp para consultas generales (sin pedido) |

### 2.2 Panel administrativo

| ID | Requerimiento |
|---|---|
| RF-09 | Inicio de sesión con correo y contraseña (solo los 2 administradores; sin registro público) |
| RF-10 | Crear, editar, activar/desactivar y eliminar productos |
| RF-11 | Subir hasta 4 imágenes por producto |
| RF-12 | Registrar costo de compra y margen % → el sistema sugiere el precio de venta; el admin puede ajustarlo manualmente |
| RF-13 | Actualizar el stock de cada producto |
| RF-14 | Gestionar categorías |
| RF-15 | Ver pedidos y cambiar su estado (pendiente → confirmado → entregado, o cancelado) |
| RF-16 | Al confirmar un pedido se descuenta el stock; al cancelar un pedido confirmado se devuelve |
| RF-17 | Gestionar socios y su porcentaje de participación en la ganancia |
| RF-18 | Dashboard: ventas, costo, ganancia total y ganancia por socio en un rango de fechas; productos con stock bajo |
| RF-19 | Configuración general: número de WhatsApp, margen por defecto, umbral de stock bajo, texto de envío/pago |

---

## 3. Requerimientos no funcionales

| ID | Requerimiento |
|---|---|
| RNF-01 | **Mobile-first:** usable desde pantallas de 360 px; el panel admin también debe funcionar en celular |
| RNF-02 | **Rendimiento:** el catálogo carga en menos de 3 s en conexión 4G; imágenes en WebP, máx. 1200 px y ~300 KB |
| RNF-03 | **Disponibilidad:** solo servicios administrados (Vercel + Supabase). Monitoreo gratuito (ej. UptimeRobot) contra un endpoint `/api/health` que consulte la base de datos cada 5–15 min. Nota: el plan gratuito de Supabase pausa proyectos inactivos por varios días (verificar condiciones actuales); el monitoreo lo evita, y cuando haya ventas constantes conviene evaluar el plan pago |
| RNF-04 | **Seguridad:** Row Level Security en todas las tablas; el costo y el margen **nunca** llegan al navegador del cliente; rutas `/admin` protegidas; llaves secretas solo en el servidor |
| RNF-05 | **Integridad:** los precios y el stock se validan en la base de datos, nunca se confía en lo que envía el navegador |
| RNF-06 | **Respaldo:** exportación manual semanal de la base de datos (o backups automáticos si se pasa a plan pago) |
| RNF-07 | **Compartir en WhatsApp:** cada producto tiene metadatos Open Graph (imagen, nombre, precio) para que el enlace se vea bien al compartirlo |
| RNF-08 | **Costo:** operable en $0 al inicio (planes gratuitos); único costo recomendado: dominio propio |
| RNF-09 | **Mantenibilidad:** TypeScript, migraciones SQL versionadas en el repositorio, README con instrucciones de instalación |

---

## 4. Reglas de negocio

### RN-01 Cálculo de precio
```
precio_sugerido = redondear_arriba(costo × (1 + margen% / 100), múltiplo)
```
- Múltiplo de redondeo por defecto: $100 **[POR CONFIRMAR]**
- Margen por defecto global: 40 % **[POR CONFIRMAR]**, editable por producto
- Ejemplo: costo $12.000, margen 40 % → $16.800
- Si el admin ajusta el precio a mano, el panel muestra el margen real resultante
- Advertencia visual si el precio queda por debajo del costo

### RN-02 Precio mostrado
El precio que ve el cliente es el precio final del producto. El envío se acuerda aparte por WhatsApp. **[POR CONFIRMAR: IVA / facturación]**

### RN-03 Visibilidad de stock
- Stock > umbral (5): "Disponible"
- Stock entre 1 y el umbral: "¡Últimas X unidades!"
- Stock = 0: se muestra como "Agotado" y no se puede agregar al carrito
- Productos inactivos no se muestran

### RN-04 Stock y carrito
- El carrito no permite cantidades mayores al stock disponible
- Agregar al carrito **no** reserva stock
- Al enviar el pedido se revalida: si algo cambió (stock o precio), se ajusta el carrito y se avisa al cliente antes de abrir WhatsApp

### RN-05 Ciclo de vida del pedido
| Estado | Significado | Efecto en stock |
|---|---|---|
| pendiente | Cliente envió el mensaje, aún no se ha cerrado la venta | Ninguno |
| confirmado | Venta acordada con el cliente | Se descuenta (falla si no alcanza) |
| entregado | Producto entregado y pagado | Ninguno |
| cancelado | No se concretó | Si estaba confirmado, se devuelve |

- Los pedidos pendientes con más de 7 días se marcan visualmente como "vencidos" (no se cancelan solos)
- Cada pedido tiene un código legible y consecutivo: `PED-0001`

### RN-06 Congelamiento de datos del pedido
El pedido guarda nombre, precio y costo de cada producto **en el momento de la compra**. Cambiar después un precio o un costo no altera pedidos ya registrados.

### RN-07 Reparto de ganancias
```
ganancia_pedido = Σ (precio_unitario − costo_unitario) × cantidad
monto_socio     = ganancia_pedido × porcentaje_socio / 100
```
- Los porcentajes de los socios activos deben sumar exactamente 100 %
- El reparto se calcula y congela al confirmar el pedido (si mañana cambian los porcentajes, los pedidos anteriores no cambian)
- Solo cuentan en el dashboard los pedidos confirmados y entregados
- Socios y porcentajes **[POR CONFIRMAR]**

### RN-08 Mensaje de WhatsApp
Enlace: `https://wa.me/<numero>?text=<mensaje codificado>` (número con indicativo, ej. `57300...`, sin `+` ni espacios)

```
¡Hola! Quiero hacer este pedido 🛒
Pedido: PED-0042

• 2 x Cargador USB-C 20W — $33.600
  https://<dominio>/producto/cargador-usb-c-20w
• 1 x Audífonos Bluetooth X — $45.000
  https://<dominio>/producto/audifonos-bluetooth-x

Total productos: $78.600
Nombre: Laura Gómez
Ciudad/Barrio: Bogotá - Chapinero
Notas: Entregar en la tarde

(El costo de envío se confirma por este medio)
```
- Debajo de cada producto va el enlace a su ficha, para identificar exactamente el producto (agregado a pedido del cliente, B3).
- La última línea es el `texto_envio` de la configuración.

### RN-09 Datos personales
Solo se guardan nombre, ciudad/barrio y notas del cliente. El teléfono llega por WhatsApp y no se guarda en la plataforma. Se requiere casilla de aceptación y una página de política de tratamiento de datos (Ley 1581 de 2012 en Colombia).

### RN-10 Administradores
Ambos administradores tienen los mismos permisos. No hay registro público; las cuentas se crean manualmente en Supabase.

---

## 5. Modelo de datos

```
categorias
  id uuid PK · nombre text · slug text único · orden int

productos                          -- lectura pública (solo activos)
  id uuid PK · categoria_id FK · nombre text · slug text único
  descripcion text · imagenes text[] · precio_venta int
  stock int (>= 0) · activo bool · destacado bool
  created_at · updated_at

producto_costos                    -- SOLO admins (RLS)
  producto_id uuid PK/FK · costo int · margen_pct numeric

socios                             -- SOLO admins
  id uuid PK · nombre text · porcentaje numeric · activo bool

pedidos                            -- SOLO admins (lectura/edición)
  id uuid PK · codigo text único · estado enum
  cliente_nombre text · cliente_ciudad text · notas text
  total_venta int · total_costo int · ganancia int
  created_at · confirmado_at · entregado_at · cancelado_at

pedido_items                       -- SOLO admins
  id uuid PK · pedido_id FK · producto_id FK
  nombre_snapshot text · cantidad int
  precio_unitario int · costo_unitario int

pedido_reparto                     -- SOLO admins
  id uuid PK · pedido_id FK · socio_nombre text
  porcentaje numeric · monto int

configuracion                      -- 1 sola fila
  whatsapp_numero text · margen_default numeric · redondeo int
  umbral_stock_bajo int · texto_envio text
```

**Funciones en la base de datos (Postgres / RPC):**
- `crear_pedido(items, cliente)` — única vía pública para insertar pedidos. Valida stock y toma precios y costos de la BD. Devuelve código, total e ítems ajustados.
- `confirmar_pedido(id)` — en una transacción: verifica y descuenta stock, congela el reparto.
- `cancelar_pedido(id)` — devuelve stock si el pedido estaba confirmado.

Montos en pesos enteros (`int`), sin decimales.

---

## 6. Pantallas

**Públicas**
1. Inicio / catálogo — categorías en chips, buscador, grilla de productos, destacados
2. Ficha de producto — galería, precio, disponibilidad, selector de cantidad, "Agregar"
3. Carrito (panel lateral o página) — ítems, cantidades, total, formulario corto, "Enviar pedido por WhatsApp"
4. Política de tratamiento de datos

**Admin (`/admin`)**
5. Login
6. Dashboard — ventas, ganancia, reparto por socio (filtro de fechas), alertas de stock bajo, pedidos pendientes
7. Productos — lista con búsqueda + formulario (costo, margen, precio sugerido, stock, imágenes)
8. Pedidos — lista filtrable por estado + detalle con botones de estado
9. Categorías
10. Socios
11. Configuración

---

## 7. Orden de construcción (bloques)

| Bloque | Contenido | Listo cuando… |
|---|---|---|
| B0 | Repo, Next.js, Tailwind, Supabase, variables de entorno, deploy en Vercel | Una página de prueba está publicada en Vercel |
| B1 | Migraciones SQL, RLS, funciones RPC, datos de prueba | Un usuario anónimo puede leer productos pero no costos ni pedidos |
| B2 | Catálogo público + ficha de producto | Se navega el catálogo en el celular con datos de prueba |
| B3 | Carrito + creación de pedido + WhatsApp | Un pedido de prueba queda registrado y abre WhatsApp con el mensaje correcto |
| B4 | Login admin + CRUD de productos, categorías e imágenes + cálculo de precio | Los dos admins pueden crear un producto completo desde el celular |
| B5 | Pedidos admin + stock + socios + dashboard + configuración | Confirmar/cancelar pedidos mueve el stock bien y el reparto cuadra |
| B6 | Pulido: Open Graph, rendimiento, política de datos, `/api/health`, monitoreo, dominio | Lighthouse móvil ≥ 85 y prueba completa de punta a punta |

---

## 8. Decisiones por confirmar

| # | Tema | Valor por defecto usado |
|---|---|---|
| 1 | Nombre de la tienda y logo | "Tienda" (placeholder) |
| 2 | Número de WhatsApp | Variable en configuración |
| 3 | Margen por defecto y redondeo | 40 % y múltiplos de $100 |
| 4 | Socios y porcentajes | 2 socios al 50/50 (editable) |
| 5 | Envío: ¿se cobra?, ¿a qué ciudades?, ¿contraentrega? | Se acuerda por WhatsApp |
| 6 | Métodos de pago (Nequi, transferencia, efectivo…) | Se acuerda por WhatsApp |
| 7 | IVA y facturación | Precio final sin desglose |
| 8 | Garantía y devoluciones de productos electrónicos | Texto informativo pendiente |
| 9 | ¿Precios por volumen para clientes que compran varias unidades? | No en V1 |
| 10 | Dominio propio | Subdominio de Vercel al inicio |

## 9. Fuera de alcance V1
Pasarela de pagos, cuentas de clientes, varios números de WhatsApp, facturación electrónica, historial detallado de movimientos de inventario, app nativa.
