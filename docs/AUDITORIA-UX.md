# Auditoría UI/UX y funcional — DStore (Ocaña)

Fecha: 21 de noviembre de 2026. Cubre la tienda pública (lo que ve el cliente) y el panel de administración (lo que usa el comerciante).

## Cómo se hizo (y sus límites)

- Se leyó el código real de la tienda y del panel: portada, catálogo, ficha, carrito, mensaje de WhatsApp, pedidos, productos, inicio del panel.
- Se vio la tienda renderizada a 360 px y a 1280 px en los temas Clásico, Black Friday y Navidad.
- Se midió el contraste de color con la fórmula WCAG.
- La comparación con tiendas de referencia (Mercado Libre, Alkosto, Falabella, tiendas que venden por WhatsApp) sale del conocimiento general de qué patrones funcionan, **no de una revisión en vivo** de esos sitios.
- **No hay datos de uso reales** (visitas, clics, abandono): el sitio no tiene analítica. Por eso las prioridades son criterio razonado, no medición. Ver hallazgo T14.
- No se probó el panel con sesión de administrador en pantalla ni con un cliente real haciendo un pedido de punta a punta.

## Lo que ya funciona bien

- Compra sin registro: el pedido sale en 3 pasos (agregar, llenar nombre y barrio, enviar por WhatsApp).
- Precios y stock se toman de la base de datos al crear el pedido; el cliente nunca puede alterarlos.
- Si algo cambió (stock o precio), el carrito se ajusta y avisa, sin perder lo que el cliente escribió.
- El mensaje de WhatsApp incluye el enlace de cada producto: quien atiende ve exactamente qué se pidió.
- Estados de stock claros ("Disponible", "¡Últimas N unidades!", "Agotado") y agotados al final.
- Costos y márgenes nunca llegan al navegador del cliente.
- Panel pensado para celular: edición rápida de stock, duplicar producto, alertas de stock bajo y pedidos pendientes, reporte en Excel, copia de seguridad.

## Hallazgos de la tienda (cliente)

Impacto y esfuerzo: A = alto, M = medio, B = bajo.

| # | Hallazgo | Impacto | Esfuerzo | Recomendación |
|---|---|---|---|---|
| T1 | **El WhatsApp flotante es genérico.** En la ficha de un producto abre "Tengo una consulta" sin decir de cuál. El cliente tiene que explicarlo, y quien atiende no sabe qué mira. | A | B | En la ficha, prellenar el mensaje con el nombre y el enlace del producto ("Hola, me interesa X: enlace"). |
| T2 | **No hay "Cómo comprar".** Pagar por WhatsApp genera dudas en quien nunca lo ha hecho. | A | B | Bloque de 3 pasos en la portada ("Elige · Envía tu pedido por WhatsApp · Te confirmamos y acordamos entrega") y respuestas cortas a: ¿cuánto tarda?, ¿cómo pago?, ¿hay garantía? |
| T3 | **Entrega y pago se mencionan poco.** En el carrito solo dice "El costo del envío se acuerda por WhatsApp". La franja de la portada muestra entrega/pago solo si se cargaron en Configuración. | A | B | Cargar "tiempo de entrega" y "medios de pago" en Configuración y mostrarlos también en el carrito. Requiere que ustedes definan esos datos reales. |
| T4 | **Sin sitemap, robots ni datos estructurados.** Google no recibe la lista de productos ni sus precios, y no puede mostrar "En stock" ni el precio en los resultados. Para un negocio local es lo que más ayuda a aparecer buscando "tecnología Ocaña". | A | B | Agregar `sitemap.xml`, `robots.txt` y datos estructurados de producto y de negocio local. |
| T5 | **Las fotos de referencia se ven mal en la grilla.** Las capturas traen marcos de otra app y fondos de madera, y la grilla las recorta cuadradas. | A | B (proceso) | No activar productos con la captura como foto. Pautas: fondo claro, 1:1, producto centrado, mínimo 1000 px, máximo 2 MB. |
| T6 | **Datos legales posiblemente incompletos.** La política de datos tiene campos por completar (responsable, documento, ciudad, correo). | A | B | Verificar en Configuración → Datos legales que estén completos; con revisión legal antes de publicar. |
| T7 | **No se recuerdan los datos del cliente.** Quien repite pedido vuelve a escribir nombre y barrio. | M | B | Guardar nombre y barrio en el navegador (con aviso) y rellenarlos. |
| T8 | **El campo de barrio sugiere "Bogotá - Chapinero".** | M | B | Cambiar el ejemplo a un barrio de Ocaña, y avisar si entregan solo en la ciudad. |
| T9 | **Falta botón de compartir** en la ficha. En Colombia el boca a boca por WhatsApp es el canal más fuerte, y los enlaces ya muestran foto, nombre y precio. | M | B | Botón "Compartir por WhatsApp" en la ficha. |
| T10 | **Búsqueda sin salida.** Si no hay resultados, solo dice "No encontramos productos". | M | B | Mostrar "¿No lo encuentras? Pregúntanos por WhatsApp" con el texto buscado. |
| T11 | **Con productos en el carrito no hay barra fija** con el total y el botón de ir al carrito. El cliente tiene que subir al encabezado. | M | M | Barra inferior en móvil "Ver carrito (N) · $total" cuando haya productos. |
| T12 | **Falta saber qué es nuevo.** No hay etiqueta "Nuevo" ni orden por recientes (la lista pública no trae la fecha de creación). | M | B | Agregar la fecha al listado público y la etiqueta/orden "Recién llegados". |
| T13 | **Accesibilidad.** El coral de ofertas tenía 3,45:1 con texto blanco (no cumple AA, que pide 4,5:1) y el rojo de Black Friday 3,55:1. La ventana emergente no atrapa el foco del teclado: con Tab se puede salir al fondo. | M | B | Los dos colores **ya se corrigieron** (4,6:1 y 4,8:1). Falta la trampa de foco en la ventana. |
| T14 | **No hay analítica.** No sabemos cuánta gente entra, qué productos ven, ni cuántos llegan a enviar pedido. | M | M | Medir lo básico con una herramienta ligera y sin cookies. Esto implica un servicio nuevo o una librería: lo decidimos antes de agregarlo (regla del proyecto). |
| T15 | **Rendimiento.** Hoy está bien: fuente del sistema, imágenes optimizadas, catálogo filtrado en el navegador. Con 150+ productos conviene paginar o cargar por categoría. | B | M | Revisar cuando el catálogo pase de unos 150 productos. |

## Hallazgos del panel (comerciante)

| # | Hallazgo | Impacto | Esfuerzo | Recomendación |
|---|---|---|---|---|
| P1 | **Activar productos de a uno.** Con los 57 productos importados inactivos, publicarlos uno por uno es lento y propenso a error. | A | M | Selección múltiple en Productos: activar/desactivar, cambiar categoría y distribuidor en lote. |
| P2 | **No hay vista de "incompletos".** Hoy hay productos con precio 0, stock 0, sin foto buena o con descripción corta, y nada los agrupa. | A | B | Filtro "Por completar": precio 0, sin foto, sin descripción, sin stock cargado. |
| P3 | **Pedido nuevo sin aviso en el panel.** El pedido llega por WhatsApp, pero el panel no marca cuántos hay pendientes mientras uno navega. | M | B | Contador "Pedidos (3)" en el menú. |
| P4 | **No hay historial de cambios de precio o stock.** Si un precio se cambia por error, no se puede saber cuándo ni quién. | M | M | Tabla de historial con fecha, usuario, valor anterior y nuevo. |
| P5 | **La copia de seguridad depende de que alguien se acuerde.** El plan gratis de Supabase no guarda copias. | M | B | Recordatorio semanal visible en el inicio del panel ("Última copia: hace N días"). |
| P6 | **No hay importador.** Cargar el catálogo requirió un script. | B | M | Solo si van a cargar catálogos grandes con frecuencia; si no, se hace por lotes como esta vez. |
| P7 | **Descripciones sin guía.** La ficha ahora ordena el texto en secciones si usan títulos y viñetas, pero el formulario no lo explica. | B | B | Ayuda bajo el campo: "Título en una línea, y debajo viñetas con •". |

## Evaluación de las ideas propuestas

| Idea | Valor | Esfuerzo | Decisión |
|---|---|---|---|
| Filtro y orden por precio | Alto | Bajo | **Hecho.** |
| Calificaciones (estrellas) | Medio-alto cuando haya datos | Medio | Más adelante, junto con comentarios. |
| Comentarios con fotos | Medio | Alto | Más adelante. Necesita moderación, almacenamiento y manejo de datos personales (Ley 1581). |
| Filtro por estrellas | Bajo hoy | Bajo | Esperar: con la mayoría de productos sin reseñas devolvería casi nada. Mejor "Mejor valorados" en el orden cuando haya reseñas. |

Para reseñas, se recomienda aceptar solo compradores verificados (ligadas al código de pedido) y aprobarlas desde el panel antes de publicarlas. Mientras tanto, una sección de testimonios cargados por ustedes (capturas de clientes satisfechos) da prueba social desde ya.

## Plan priorizado

**Ola 1 — rápida, mucho efecto (casi todo esfuerzo bajo).**
T1 (WhatsApp con el producto), T2 (cómo comprar), T3 (entrega y pago en el carrito), T4 (sitemap/robots/datos estructurados), T7 y T8 (recordar datos y ejemplo local), T9 (compartir), T10 (búsqueda sin salida), P2 (vista de incompletos), P3 (contador de pedidos).

**Ola 2 — mejora de uso diario.**
P1 (acciones en lote), T11 (barra fija del carrito), T12 (productos nuevos), P5 (recordatorio de copia), trampa de foco en la ventana emergente.

**Ola 3 — cuando haya tráfico.**
T14 (analítica), P4 (historial de cambios), reseñas y testimonios, paginación si el catálogo crece.

**Fuera del código (dependen de ustedes).**
T5 (fotos buenas), T6 (datos legales), T3 (definir tiempo de entrega y medios de pago).

## Ola 1: estado

Hecho: T1 (consulta por WhatsApp con el producto), T2 (cómo comprar + preguntas frecuentes, debajo del catálogo), T3 (entrega y pago en el carrito, si están cargados), T4 (sitemap, robots y datos estructurados), T7 y T8 (recordar nombre y barrio; ejemplo de Ocaña), T9 (compartir), T10 (búsqueda sin resultados → WhatsApp), P2 (filtro "Por completar"), P3 (contador de pedidos pendientes).

Pendiente de ustedes: cargar tiempo de entrega y medios de pago en Configuración (T3), y definir la URL del sitio con `NEXT_PUBLIC_SITE_URL` si usan dominio propio (si no, se toma la de Netlify).

## Ola 2: estado

Hecho: P1 (cambios en lote en Productos: activar, desactivar, categoría y distribuidor; al activar se omiten los de precio $0), T11 (barra fija del carrito con el total), T12 (etiqueta "Nuevo" y orden "Recién llegados"), P5 (recordatorio de copia de seguridad en el inicio, con la fecha de la última copia; requiere la migración `20261122000100_respaldo.sql`).

Pendiente: trampa de foco en la ventana emergente.

## Ola 3 y pedidos del dueño: estado

Hecho:
- **Pago contra entrega** visible en portada, franja de confianza, ficha, carrito, preguntas frecuentes, pie, términos y mensaje de WhatsApp, con la excepción de los productos bajo pedido.
- **Productos bajo pedido:** casilla en el formulario del producto y en el lote. Se pueden pedir sin stock (máximo 20 por pedido), no descuentan ni devuelven stock, el pedido congela la marca por ítem, y la tienda avisa que pueden requerir anticipo. Migración `20261123000100_bajo_pedido.sql`.
- **Historial de cambios** de precio, costo, stock, estado y bajo pedido (con quién y cuándo) en la edición de cada producto. El stock que mueven los pedidos no se anota.
- **Métricas de uso anónimas** (contadores por día, sin IP ni cookies): visitas, productos vistos, agregados al carrito, clics en WhatsApp y en la promoción, más conversión a pedidos y productos más vistos, en el inicio del panel. Migración `20261123000200_historial_metricas.sql`. Solo cuentan en producción.

Pendiente: reseñas (calificaciones, comentarios con fotos, filtro por estrellas): requieren decidir moderación y compradores verificados; ver "Reseñas" abajo. Y la trampa de foco de la ventana emergente.

## Cómo ser competitivo en Ocaña (ideas, de mayor a menor retorno)

Las comparaciones son de criterio general, no de una revisión de la competencia en Ocaña.

| # | Idea | Impacto | Esfuerzo | Notas |
|---|---|---|---|---|
| C1 | **Perfil de empresa en Google** (gratis) | Alto | Bajo | Hace que aparezcan al buscar "tecnología en Ocaña", con dirección, horario, WhatsApp, fotos y **reseñas de Google**: prueba social real sin construir reseñas propias. Es lo primero. |
| C2 | **WhatsApp Business bien configurado** | Alto | Bajo | Catálogo nativo, respuestas rápidas, mensaje de bienvenida y de ausencia, etiquetas por estado de pedido. |
| C3 | **Enlaces de anuncio que agregan al carrito** | Alto | Ya existe | `/producto/<slug>?agregar=1` agrega el producto al abrir la página. Úsenlo en estados de WhatsApp, Instagram y Facebook. |
| C4 | **Mostrar quiénes son** | Alto | Bajo | Foto del equipo o del local, punto de entrega y horario. Con "pago contra entrega" es lo que más baja la desconfianza. |
| C5 | **Plazo de entrega real y destacado** | Alto | Bajo | Si en Ocaña entregan el mismo día o al siguiente, decirlo en la portada: es la ventaja sobre los envíos nacionales que tardan días. Cargarlo en Configuración → tiempo de entrega. |
| C6 | **Pagos digitales como opción** (Nequi, Daviplata, transferencia) | Medio | Bajo | Sirve sobre todo para el anticipo de los bajo pedido. Se acuerda por WhatsApp; no requiere pasarela. |
| C7 | **Combos y "se compra junto"** (cargador + cable, audífonos + estuche) | Medio | Medio | Sube el valor de cada pedido. |
| C8 | **Código de descuento de primera compra y "trae a un amigo"** | Medio | Medio | Aprovecha el boca a boca local. |
| C9 | **Consulta de pedido por código** | Medio | Medio | Cuidado: los códigos son consecutivos (PED-0001…); si se consulta solo con el código, alguien podría contar los pedidos del negocio. Hay que pedir código + nombre. |
| C10 | **Garantía real por categoría** | Medio | Bajo | Definirla (qué cubre y por cuánto) y publicarla solo cuando sea cierta. |
| C11 | **Estándar de fotos y videos cortos** | Alto | Bajo | Fondo claro, 1:1, y un video corto por producto estrella. Es lo que más pesa al comparar con Mercado Libre. |

**Reseñas (cuando haya compras).** Diseño recomendado: solo compradores verificados (código de pedido + nombre), aprobación previa desde el panel, calificación de 1 a 5 y comentario; fotos en una segunda etapa. Con eso salen "Mejor valorados" en el orden y el filtro por estrellas, y las estrellas aparecen en Google (datos estructurados). Mientras tanto, C1 (reseñas de Google) cubre lo mismo sin construir nada.

## Corregido durante la auditoría

- Los botones verdes de WhatsApp del carrito tenían el texto claro en el tema Black Friday (contraste 1,8:1). Ahora usan texto verde oscuro (7,5:1).
- Coral de ofertas (clásico): de 3,45:1 a 4,6:1. Rojo de Black Friday: de 3,55:1 a 4,8:1.
