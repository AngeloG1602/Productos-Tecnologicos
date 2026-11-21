-- Sube el catálogo de accesorios a partir de las capturas del proveedor (57 productos).
-- Crea las categorías nuevas que falten y cada producto con su costo, margen (calculado
-- solo) y precio de venta (costo + 40 %, redondeado hacia arriba a múltiplos de $100,
-- valor por defecto de la especificación [POR CONFIRMAR]).
--
-- Quedan INACTIVOS (no se ven en la tienda) hasta que les pongas las fotos buenas desde
-- el panel y los actives. La imagen de referencia (la captura) la sube
-- scripts/subir-capturas.mjs; este SQL ya deja la ruta apuntando a ella.
-- Se puede correr varias veces sin duplicar: usa el slug de cada producto.
--
-- Productos sin precio o sin stock visible en la captura entran con 0 (ver docs en
-- supabase/importacion/productos-capturas.json, campo "nota").
--
-- Uso: SQL Editor → New query → pegar → Run. Debe devolver "productos_capturas = 57".

begin;

insert into public.categorias (nombre, slug, orden)
select v.nombre, v.slug, (select coalesce(max(orden), 0) from public.categorias) + v.n
from (values
    ('Cuidado personal', 'cuidado-personal', 1),
    ('Tablets', 'tablets', 2),
    ('Relojes inteligentes', 'relojes-inteligentes', 3),
    ('Televisores y TDT', 'televisores-y-tdt', 4),
    ('Movilidad y juguetes', 'movilidad-y-juguetes', 5)
) as v (nombre, slug, n)
on conflict (slug) do nothing;

with datos (categoria, nombre, slug, descripcion, costo, precio, stock) as (
  values
    ('audifonos', 'Audífonos inalámbricos i12 colores', 'audifonos-inalambricos-i12-colores', 'Audífonos inalámbricos i12 (InPods 12) en colores azul, amarillo, rosado y verde. Bluetooth 5.3 con estuche de carga.', 13000, 18200, 78),
    ('accesorios', 'Micrófono de solapa inalámbrico F11', 'microfono-de-solapa-inalambrico-f11', 'Micrófono de solapa inalámbrico F11 con protector antiviento y receptor para el celular. Ideal para grabar videos y transmisiones en vivo.', 40000, 56000, 2),
    ('audifonos', 'Audífonos open ear UBU', 'audifonos-open-ear-ubu', 'Audífonos inalámbricos UBU tipo open ear: se ajustan a la oreja sin tapar el oído, para escuchar música y llamadas sin perder el sonido del entorno.', 32000, 44800, 36),
    ('cables', 'Cable USB a Tipo-C 120W Fenix Tech', 'cable-usb-a-tipo-c-120w-fenix-tech', 'Cable de carga rápida USB a Tipo-C de hasta 120 W, marca Fenix Tech.', 0, 0, 0),
    ('cables', 'Cable Tipo-C a Tipo-C 240W con soporte UBU-103', 'cable-tipo-c-a-tipo-c-240w-con-soporte-ubu-103', 'Cable Tipo-C a Tipo-C de carga rápida de hasta 240 W con soporte, referencia UBU-103.', 15000, 21000, 43),
    ('cables', 'Cable Tipo-C a Tipo-C 240W LN-113', 'cable-tipo-c-a-tipo-c-240w-ln-113', 'Cable Tipo-C a Tipo-C de carga rápida de hasta 240 W con soporte, marca Luan, referencia LN-113.', 8500, 11900, 20),
    ('audifonos', 'Audífonos inalámbricos M10', 'audifonos-inalambricos-m10', 'Audífonos inalámbricos M10 con estuche de carga con indicador digital de batería. Bluetooth 5.3.', 0, 0, 0),
    ('cargadores', 'Cargador 45W iOS UBU', 'cargador-45w-ios-ubu', 'Cargador de pared UBU de 45 W para iPhone (iOS), carga rápida.', 0, 0, 0),
    ('cargadores', 'Cargador con cable CS-Tech 4A', 'cargador-con-cable-cs-tech-4a', 'Kit cargador de pared + cable USB CS-Tech, carga rápida de 4 A.', 0, 0, 0),
    ('cargadores', 'Cargador 2 en 1 6A UBU', 'cargador-2-en-1-6a-ubu', 'Cargador de pared UBU 2 en 1 de 6 A.', 7000, 9800, 0),
    ('cargadores', 'Cargador 20W iOS UBU', 'cargador-20w-ios-ubu', 'Cargador de pared UBU de 20 W para iPhone (iOS), carga rápida.', 30000, 42000, 55),
    ('cargadores', 'Cargador 120W GaN UBU', 'cargador-120w-gan-ubu', 'Cargador de pared UBU GaN de hasta 120 W con cable incluido, carga rápida.', 22000, 30800, 103),
    ('cargadores', 'Cargador 180W GaN UBU', 'cargador-180w-gan-ubu', 'Cargador de pared UBU GaN de 180 W súper rápido, con cable incluido.', 28000, 39200, 0),
    ('cargadores', 'Cargador 45W UBU', 'cargador-45w-ubu', 'Cargador de pared UBU de 45 W con cable Tipo-C trenzado incluido.', 15000, 21000, 0),
    ('cargadores', 'Cubo Samsung 25W (certificado 1.1 RF)', 'cubo-samsung-25w-certificado-1-1-rf', 'Adaptador de pared de 25 W con carga rápida PD y entrada Tipo-C.', 14000, 19600, 52),
    ('cargadores', 'Cargador Turbo 67W UBU', 'cargador-turbo-67w-ubu', 'Cargador de pared UBU Turbo de hasta 67 W con cable incluido.', 17000, 23800, 94),
    ('cargadores', 'Cubo USB 4A LN-201', 'cubo-usb-4a-ln-201', 'Cubo de pared Luan Fast Charger Travel de 4 A, referencia LN-201.', 6000, 8400, 85),
    ('cargadores', 'Cubo USB 5.2A LN-203', 'cubo-usb-5-2a-ln-203', 'Cubo de pared Luan Fast Charger Travel de 5.2 A, referencia LN-203.', 7000, 9800, 63),
    ('cuidado-personal', 'Combo 3 en 1 aguacate RE-2513', 'combo-3-en-1-aguacate-re-2513', 'Combo 3 en 1 Shine Therapy con aguacate: plancha alisadora, rizador y cepillo moldeador para peinar en casa.', 95000, 133000, 0),
    ('cargadores', 'Cubo Samsung 45W (certificado 1.1 RF)', 'cubo-samsung-45w-certificado-1-1-rf', 'Adaptador de pared de 45 W con carga rápida PD y entrada Tipo-C.', 17000, 23800, 0),
    ('cuidado-personal', 'Máquina de corte MP8023 Maxtop 3 en 1', 'maquina-de-corte-mp8023-maxtop-3-en-1', 'Kit Maxtop MP-8023 3 en 1: máquina profesional para cortar cabello, con accesorios de recorte.', 28000, 39200, 0),
    ('cuidado-personal', 'Combo secador + plancha RE2517 7 en 1', 'combo-secador-plancha-re2517-7-en-1', 'Combo 7 en 1 con secador de cabello, plancha y accesorios (difusor, boquillas y peine).', 70000, 98000, 0),
    ('cuidado-personal', 'Rizadora 7 en 1 Vex Style Core Titanium', 'rizadora-7-en-1-vex-style-core-titanium', 'Rizadora 7 en 1 Vex Beauty Style Core Titanium con múltiples barriles intercambiables para distintos tipos de rizo y ondas.', 320000, 448000, 0),
    ('cuidado-personal', 'Secador pequeño NV662', 'secador-pequeno-nv662', 'Secador de cabello compacto de 1000 W. Disponible en azul y rosado.', 12000, 16800, 25),
    ('cuidado-personal', 'Secador RE-2058', 'secador-re-2058', 'Secador de cabello profesional 3 en 1 con boquillas y difusor.', 37000, 51800, 12),
    ('cuidado-personal', 'Máquina profesional VGR V-951', 'maquina-profesional-vgr-v-951', 'Recortadora profesional VGR V-951 con pantalla digital.', 41000, 57400, 0),
    ('cuidado-personal', 'Plancha RE-1825', 'plancha-re-1825', 'Plancha alisadora para cabello, referencia RE-1825.', 27000, 37800, 13),
    ('cuidado-personal', 'Plancha RE-1826', 'plancha-re-1826', 'Plancha alisadora para cabello, referencia RE-1826.', 27000, 37800, 13),
    ('tablets', 'Tablet Redmi Pad 2 9.7" 128GB/4GB gris', 'tablet-redmi-pad-2-9-7-128gb-4gb-gris', 'Tablet Xiaomi Redmi Pad 2 de 9,7 pulgadas con 128 GB de almacenamiento y 4 GB de RAM, color gris.', 555000, 777000, 1),
    ('tablets', 'Tablet Samsung Galaxy Tab A11 128GB', 'tablet-samsung-galaxy-tab-a11-128gb', 'Tablet Samsung Galaxy Tab A11 con 128 GB de almacenamiento.', 530000, 742000, 1),
    ('cuidado-personal', 'Secador 2003', 'secador-2003', 'Secador de cabello profesional con protección térmica.', 30000, 42000, 67),
    ('accesorios', 'Soporte de celular Rain Cover Vex', 'soporte-de-celular-rain-cover-vex', 'Soporte de celular para moto o bicicleta con funda impermeable (rain cover). Marca Vex.', 15000, 21000, 19),
    ('accesorios', 'Soporte de celular para carro RP7 Vex', 'soporte-de-celular-para-carro-rp7-vex', 'Soporte de celular para carro (car mount) Vex, referencia RP7.', 10000, 14000, 49),
    ('accesorios', 'Linterna grande VIP', 'linterna-grande-vip', 'Linterna LED recargable por USB con luz frontal y lateral. Incluye estuche rígido y cable de carga.', 15000, 21000, 13),
    ('accesorios', 'Linterna LED pequeña', 'linterna-led-pequena', 'Linterna LED compacta recargable por USB, con estuche. Fácil de llevar.', 8000, 11200, 12),
    ('movilidad-y-juguetes', 'Patines en línea Premium PT-SK8888-13', 'patines-en-linea-premium-pt-sk8888-13', 'Patines en línea Premium Technology (referencia PT-SK8888-13): modelo semiprofesional de talla ajustable con tres ruedas grandes, pensado para dar velocidad y estabilidad en recorridos recreativos o entrenamientos en pavimento.

Especificaciones técnicas
• Marca y modelo: Premium Technology, referencia PT-SK8888-13.
• Ruedas: 3 ruedas de 100 mm de diámetro y alto rebote.
• Rodamientos: balineras ABEC-9 para una rodada suave y precisa.
• Chasis: estructura reforzada en aluminio, ligera y resistente a impactos.
• Bota rígida con acolchado interno transpirable y cierre con cordones, correa de velcro y hebilla de seguridad superior.

Tallas y colores
• Tallas expandibles con botón de ajuste; habitualmente S (28-33), M (34-38) y L (39-43).
• Colores: morado, rosado, azul, rojo y blanco.', 120000, 168000, 15),
    ('movilidad-y-juguetes', 'Patineta SL-3BZ-2', 'patineta-sl-3bz-2', 'Patineta SL-3BZ-2: monopatín infantil de 3 ruedas con estampado estilo graffiti, manubrio ajustable y ruedas con luces LED, pensado para dar estabilidad y seguridad a los niños en su aprendizaje.

Características
• 3 ruedas (dos delanteras y una trasera) que facilitan el equilibrio.
• Ruedas en PU con luces LED que encienden con el movimiento, sin baterías.
• Manillar en T regulable con seguro para adaptarse a la estatura del niño.
• Plataforma ancha antideslizante con estampados tipo graffiti y puños ergonómicos en colores neón (verde, rosado y naranja).
• Freno de pie en la rueda trasera y giro por inclinación del cuerpo.

Especificaciones generales
• Manubrio en tubo metálico y base en plástico reforzado (ABS/PP).
• Edad recomendada: de 3 a 8 años.
• Soporta entre 45 y 60 kg.
• Altura del manubrio regulable de 65 a 85 cm aproximadamente.', 70000, 98000, 9),
    ('movilidad-y-juguetes', 'Patineta SL-4Z', 'patineta-sl-4z', 'Patineta Scooter infantil SL-4Z: monopatín de 4 ruedas con luces LED, estructura reforzada y manubrio de altura graduable para niños.

Características
• Estabilidad: 4 ruedas (dos delanteras y una trasera doble) con dirección por inclinación del cuerpo.
• Ruedas con luces LED de colores que encienden al rodar, sin baterías.
• Manubrio telescópico graduable en varios niveles y abatible para guardarla o transportarla.
• Base amplia antideslizante, puños de espuma ergonómicos y freno de pedal en la rueda trasera.

Especificaciones aproximadas
• Estructura en acero o aluminio reforzado, plataforma en plástico ABS y ruedas en PU.
• Edad recomendada: de 3 a 8 años.
• Soporta hasta 50 a 70 kg.
• Largo total de 55 a 72 cm; altura del manillar ajustable de 75 a 88 cm.', 65000, 91000, 10),
    ('movilidad-y-juguetes', 'Pistola de hidrogel ST719B', 'pistola-de-hidrogel-st719b', 'Pistola de Hidrogel Disparo de Élite (referencia ST719B): lanzador recreativo eléctrico automático que dispara esferas de gel hidratadas.

Especificaciones
• Referencia: ST719B (línea Disparo de Élite).
• Dimensiones aproximadas: 86 cm de largo por 29 cm de alto.
• Disparo eléctrico automático con motor interno para disparos continuos.
• Batería de litio recargable (por cable USB).
• Munición compatible: esferas de hidrogel biodegradables de 7 a 8 mm de diámetro.
• Edad recomendada: a partir de los 8 años.

Características
• Diseño táctico con acabado camuflado (azul, verde o rojo/negro).
• Depósito superior transparente que alimenta las esferas por gravedad.
• El paquete estándar suele incluir silenciador o boquilla desmontable, gafas de protección, correa de transporte, batería recargable y munición deshidratada.

Recomendaciones
• Sumerge las bolitas secas en agua de 3 a 4 horas antes de usarlas.
• Usa siempre las gafas protectoras y evita apuntar al rostro o a los ojos.', 65000, 91000, 16),
    ('movilidad-y-juguetes', 'Patineta eléctrica T2 Mobulaa', 'patineta-electrica-t2-mobulaa', 'La Patineta Eléctrica Mobulaa T2 es un modelo urbano ligero y plegable, ideal para trayectos cortos y desplazamientos diarios.

Motor y rendimiento
• Motor eléctrico sin escobillas (brushless) de 250 W.
• Velocidad máxima: hasta 24 km/h.
• Inclinación máxima: sube pendientes de hasta 15 grados.

Batería y autonomía
• Batería de litio de 36V / 7,8Ah.
• Autonomía real de 12 a 18 km por carga.
• Tiempo de carga completa: de 3 a 4 horas.

Estructura y dimensiones
• Marco de acero aleado con sistema plegable rápido para guardarla o transportarla.
• Peso: 14 kg.
• Carga máxima soportada: 99 kg (incluyendo al conductor y su equipaje).
• Dimensiones aproximadas: 110 cm de alto, 111 cm de largo y 43 cm de ancho.

Ruedas, seguridad y extras
• Llantas de 8,5 pulgadas.
• Freno electrónico delantero y freno de disco trasero.
• Luz frontal LED, luz trasera de freno y pantalla digital en el manubrio que muestra velocidad y nivel de batería.

Por su potencia y velocidad no requiere matrícula, placa, SOAT ni licencia de conducción. Se recomienda circular por ciclorrutas usando casco certificado.', 800000, 1120000, 14),
    ('televisores-y-tdt', 'Decodificador TDT Premium DVB-T2', 'decodificador-tdt-premium-dvb-t2', 'Decodificador de televisión digital terrestre (TDT) Premium DVB-T2 en alta definición.', 41000, 57400, 15),
    ('televisores-y-tdt', 'Decodificador TDT VIP DVB-T2', 'decodificador-tdt-vip-dvb-t2', 'Receptor de televisión digital terrestre DVB-T2 VIP, Full HD 1080, para señal TDT en Colombia.', 40000, 56000, 8),
    ('televisores-y-tdt', 'Televisor Unitec 32" QLED HD webOS (32HDQ)', 'televisor-unitec-32-qled-hd-webos-32hdq', 'El Televisor Unitec de 32 pulgadas (referencia 32HDQ) es un Smart TV que combina un panel QLED HD con el sistema operativo webOS TV de LG.

Pantalla e imagen
• Tamaño: 32 pulgadas.
• Tecnología de panel: QLED (puntos cuánticos para mejorar el brillo y el volumen de color).
• Resolución: HD de 1366 x 768 píxeles.
• Sintonizador: compatible con Televisión Digital Terrestre (DVB-T2), NTSC-M y PAL-M/N.

Rendimiento y sistema inteligente
• Sistema operativo: webOS TV (con acceso a plataformas como Netflix, YouTube y Prime Video).
• Procesador: ARM Quad Core CA55 de 4 núcleos.
• Memoria: 1.5 GB de RAM DDR y 8 GB de almacenamiento interno eMMC.
• Control: compatible con la aplicación móvil LG ThinQ e incluye control remoto adicional tipo Magic (con funciones de puntero y comandos de voz según versión de caja).

Conectividad y multimedia
• Conexiones inalámbricas: Wi-Fi y Bluetooth integrados.
• Puertos físicos: entradas HDMI, puertos USB y salida de audio óptico digital.
• Formatos compatibles: audio (MP3, AC3, PCM), imágenes (JPEG, PNG, BMP, GIF) y video (H.264, H.265, VP9, AV1, MPEG4).', 620000, 868000, 2),
    ('accesorios', 'Radio de comunicación Baofeng', 'radio-de-comunicacion-baofeng', 'Radio portátil de comunicación Baofeng (walkie-talkie).', 60000, 84000, 3),
    ('power-banks', 'Power bank 10000 mAh UBU-301', 'power-bank-10000-mah-ubu-301', 'Power bank UBU de 10000 mAh, referencia UBU-301.', 50000, 70000, 45),
    ('power-banks', 'Power bank 20000 mAh 4 en 1 CS-Tech', 'power-bank-20000-mah-4-en-1-cs-tech', 'Power bank CS-Tech de 20000 mAh con 4 cables integrados (4 en 1) y carga rápida PD de 22.5 W.', 44000, 61600, 15),
    ('audifonos', 'Audífonos inalámbricos Pro 2 versión i12', 'audifonos-inalambricos-pro-2-version-i12', 'Audífonos inalámbricos tipo Pro 2 (versión i12) con estuche de carga.', 15000, 21000, 61),
    ('televisores-y-tdt', 'Televisor Unitec 43" QLED FHD webOS (43FHDQ)', 'televisor-unitec-43-qled-fhd-webos-43fhdq', 'El Televisor Unitec de 43 pulgadas QLED FHD (modelo 43FHDQ) es un Smart TV que integra tecnología de puntos cuánticos (QLED) con resolución Full HD y el sistema operativo webOS TV.

Especificaciones técnicas
• Pantalla y resolución: panel QLED de 43 pulgadas y resolución Full HD (1920 x 1080 píxeles), con colores más vivos y mejor contraste que un panel LED convencional.
• Sistema operativo: webOS TV, plataforma licenciada por LG con acceso a la tienda de aplicaciones (Netflix, YouTube, Prime Video, entre otras) y compatibilidad con la app móvil LG ThinQ.
• Procesador y memoria: procesador ARM Advance Quad-Core (CA55 x 4), 1.5 GB de RAM DDR y 8 GB de almacenamiento interno (eMMC) para aplicaciones.
• Sintonizador de televisión: digital terrestre DVB-T2 (compatible con la señal TDT en Colombia), además de los estándares analógicos PAL-M/N y NTSC-M.
• Formatos multimedia compatibles: audio (MP3, AC3, PCM), imagen (JPEG, PNG, BMP, GIF) y video (MPEG2, MPEG4, H.264, H.265, VP8, VP9 y AV1).', 945000, 1323000, 2),
    ('relojes-inteligentes', 'Reloj Xiaomi Redmi Watch 3 negro (Gr. A)', 'reloj-xiaomi-redmi-watch-3-negro-gr-a', 'Reloj inteligente Xiaomi Redmi Watch 3 en color negro, con Bluetooth para llamadas.', 130000, 182000, 6),
    ('relojes-inteligentes', 'Reloj Xiaomi Redmi Watch 4 (Gr. A)', 'reloj-xiaomi-redmi-watch-4-gr-a', 'Reloj inteligente Xiaomi Redmi Watch 4.', 205000, 287000, 7),
    ('relojes-inteligentes', 'Reloj Xiaomi Redmi Watch 5 Active (Gr. A)', 'reloj-xiaomi-redmi-watch-5-active-gr-a', 'Reloj inteligente Xiaomi Redmi Watch 5 Active (color plata mate): gran pantalla, autonomía prolongada y llamadas por Bluetooth desde la muñeca.

Pantalla y diseño
• Pantalla LCD cuadrada de 2 pulgadas, 320 × 385 píxeles (250 PPP) y brillo de hasta 500 nits.
• Dimensiones de 49,1 × 40,4 × 11,4 mm y peso de 30,6 gramos sin la correa.
• Marco de plástico con revestimiento metálico y correa de TPU ajustable (135 a 205 mm).
• Más de 200 esferas intercambiables desde la aplicación.

Batería y conectividad
• Batería de 470 mAh: hasta 18 días en uso normal y hasta 12 días en uso intensivo.
• Carga con cable magnético incluido en la caja.
• Llamadas Bluetooth con altavoz integrado y doble micrófono con cancelación de ruido.
• Xiaomi HyperOS, Bluetooth 5.3; compatible con Android 8.0 o iOS 12.0 en adelante.

Salud, deporte y resistencia
• Sensor de frecuencia cardíaca, oxígeno en sangre (SpO2) y acelerómetro.
• Seguimiento continuo de ritmo cardíaco, estrés, sueño y salud femenina.
• Más de 140 modos de entrenamiento con detección automática de actividad. No tiene GPS integrado: usa el GPS del teléfono para registrar rutas.
• Resistencia al agua 5 ATM: apto para lluvia, salpicaduras y natación en aguas poco profundas.', 160000, 224000, 9),
    ('relojes-inteligentes', 'Reloj Xiaomi Redmi Watch 5 (Gr. A)', 'reloj-xiaomi-redmi-watch-5-gr-a', 'Reloj inteligente Xiaomi Redmi Watch 5 (versión estándar): pantalla AMOLED ultragrande con biseles delgados de 2 mm, GPS integrado y hasta 24 días de autonomía.

Especificaciones técnicas
• Pantalla: AMOLED cuadrada de 2,07 pulgadas, 432 × 514 píxeles (324 PPP), 60 Hz y brillo máximo de 1.500 nits. Relación pantalla-cuerpo del 82 % y cristal 2.5D.
• Diseño y materiales: marco de aleación de aluminio, corona giratoria de acero inoxidable y correa de TPU ajustable (135–205 mm). Mide 47,5 × 41,1 × 11,3 mm y pesa 33,5 gramos sin correa.
• Batería: 550 mAh, hasta 24 días de uso típico (cerca de 12 días con Always-On Display).
• Conectividad y llamadas: Bluetooth 5.3 con llamadas desde la muñeca, altavoz y doble micrófono con cancelación de ruido del viento. 164 MB de almacenamiento interno para música y grabadora de voz independiente.
• Posicionamiento: GNSS con GPS, Galileo, GLONASS, BeiDou y QZSS.
• Salud y deporte: frecuencia cardíaca, oxígeno en sangre (SpO₂), sueño y estrés; más de 150 modos deportivos y resistencia al agua 5 ATM.
• Sistema: Xiaomi HyperOS con más de 200 esferas personalizables y motor lineal háptico. Compatible con Android 8.0 o superior e iOS 12.0 o superior.', 220000, 308000, 6),
    ('relojes-inteligentes', 'Reloj Xiaomi Redmi Watch 5 Lite (Gr. A)', 'reloj-xiaomi-redmi-watch-5-lite-gr-a', 'Reloj inteligente Xiaomi Redmi Watch 5 Lite: ligero, con pantalla AMOLED, GPS integrado y llamadas por Bluetooth. Versión en color dorado claro (Light Gold), con marco de acabado brillante y correa de silicona TPU.

Pantalla y diseño
• Pantalla cuadrada AMOLED de 1,96 pulgadas con modo Always-On Display (AOD).
• Resolución de 410 × 502 píxeles y brillo máximo de hasta 600 nits.
• Dimensiones de 48,1 × 39,2 × 10,6 mm y peso de 29,2 gramos sin la correa.
• Marco de plástico con acabado metálico NCVM y correa de TPU ajustable (135 a 205 mm).
• Resistencia al agua 5 ATM.

Batería y conectividad
• Batería de 470 mAh con carga magnética: hasta 18 días en uso normal, 12 en uso intenso y 7 con Always-On Display activo.
• Llamadas por Bluetooth con altavoz y doble micrófono con reducción de ruido.
• GNSS integrado (GPS, Galileo, GLONASS, BeiDou y QZSS) para registrar rutas sin llevar el teléfono.
• Xiaomi HyperOS, Bluetooth 5.3; se vincula con la app Mi Fitness en Android 8.0 o iOS 12.0 en adelante.

Salud y deporte
• Sensor de frecuencia cardíaca, oxígeno en sangre (SpO₂), acelerómetro y giroscopio.
• Más de 150 modos deportivos y más de 200 esferas personalizables.
• Monitoreo de sueño y estrés, salud femenina, control de cámara y música, widgets y asistente de voz.', 140000, 196000, 4),
    ('relojes-inteligentes', 'Reloj Xiaomi Redmi Watch 3 Active (Gr. A)', 'reloj-xiaomi-redmi-watch-3-active-gr-a', 'Reloj inteligente Xiaomi Redmi Watch 3 Active, con Bluetooth para llamadas.', 120000, 168000, 10),
    ('power-banks', 'Power bank 33W 20000 mAh', 'power-bank-33w-20000-mah', 'Power bank de 20000 mAh con carga rápida de hasta 33 W y cable integrado.', 97000, 135800, 7),
    ('audifonos', 'Manos libres básico D21', 'manos-libres-basico-d21', 'Manos libres con cable D21, sonido Extra Bass, ideal para deporte y uso diario.', 2500, 3500, 46),
    ('accesorios', 'SIM card Claro prepago', 'sim-card-claro-prepago', 'SIM card Claro prepago.', 1500, 2100, 100)
),
insertados as (
  insert into public.productos (categoria_id, nombre, slug, descripcion, precio_venta, stock, activo, destacado)
  select c.id, d.nombre, d.slug, d.descripcion, d.precio, d.stock, false, false
  from datos d
  join public.categorias c on c.slug = d.categoria
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.producto_costos (producto_id, costo, margen_pct)
select i.id, d.costo,
       case when d.costo = 0 then 0 else round(((d.precio - d.costo)::numeric / d.costo) * 100, 2) end
from insertados i
join datos d on d.slug = i.slug;

-- Imagen de referencia: <id>/1.jpg dentro del bucket "productos" (la sube el script).
update public.productos
set imagenes = array[id::text || '/1.jpg']
where slug in ('audifonos-inalambricos-i12-colores', 'microfono-de-solapa-inalambrico-f11', 'audifonos-open-ear-ubu', 'cable-usb-a-tipo-c-120w-fenix-tech', 'cable-tipo-c-a-tipo-c-240w-con-soporte-ubu-103', 'cable-tipo-c-a-tipo-c-240w-ln-113', 'audifonos-inalambricos-m10', 'cargador-45w-ios-ubu', 'cargador-con-cable-cs-tech-4a', 'cargador-2-en-1-6a-ubu', 'cargador-20w-ios-ubu', 'cargador-120w-gan-ubu', 'cargador-180w-gan-ubu', 'cargador-45w-ubu', 'cubo-samsung-25w-certificado-1-1-rf', 'cargador-turbo-67w-ubu', 'cubo-usb-4a-ln-201', 'cubo-usb-5-2a-ln-203', 'combo-3-en-1-aguacate-re-2513', 'cubo-samsung-45w-certificado-1-1-rf', 'maquina-de-corte-mp8023-maxtop-3-en-1', 'combo-secador-plancha-re2517-7-en-1', 'rizadora-7-en-1-vex-style-core-titanium', 'secador-pequeno-nv662', 'secador-re-2058', 'maquina-profesional-vgr-v-951', 'plancha-re-1825', 'plancha-re-1826', 'tablet-redmi-pad-2-9-7-128gb-4gb-gris', 'tablet-samsung-galaxy-tab-a11-128gb', 'secador-2003', 'soporte-de-celular-rain-cover-vex', 'soporte-de-celular-para-carro-rp7-vex', 'linterna-grande-vip', 'linterna-led-pequena', 'patines-en-linea-premium-pt-sk8888-13', 'patineta-sl-3bz-2', 'patineta-sl-4z', 'pistola-de-hidrogel-st719b', 'patineta-electrica-t2-mobulaa', 'decodificador-tdt-premium-dvb-t2', 'decodificador-tdt-vip-dvb-t2', 'televisor-unitec-32-qled-hd-webos-32hdq', 'radio-de-comunicacion-baofeng', 'power-bank-10000-mah-ubu-301', 'power-bank-20000-mah-4-en-1-cs-tech', 'audifonos-inalambricos-pro-2-version-i12', 'televisor-unitec-43-qled-fhd-webos-43fhdq', 'reloj-xiaomi-redmi-watch-3-negro-gr-a', 'reloj-xiaomi-redmi-watch-4-gr-a', 'reloj-xiaomi-redmi-watch-5-active-gr-a', 'reloj-xiaomi-redmi-watch-5-gr-a', 'reloj-xiaomi-redmi-watch-5-lite-gr-a', 'reloj-xiaomi-redmi-watch-3-active-gr-a', 'power-bank-33w-20000-mah', 'manos-libres-basico-d21', 'sim-card-claro-prepago')
  and cardinality(imagenes) = 0;

select count(*) as productos_capturas
from public.productos
where slug in ('audifonos-inalambricos-i12-colores', 'microfono-de-solapa-inalambrico-f11', 'audifonos-open-ear-ubu', 'cable-usb-a-tipo-c-120w-fenix-tech', 'cable-tipo-c-a-tipo-c-240w-con-soporte-ubu-103', 'cable-tipo-c-a-tipo-c-240w-ln-113', 'audifonos-inalambricos-m10', 'cargador-45w-ios-ubu', 'cargador-con-cable-cs-tech-4a', 'cargador-2-en-1-6a-ubu', 'cargador-20w-ios-ubu', 'cargador-120w-gan-ubu', 'cargador-180w-gan-ubu', 'cargador-45w-ubu', 'cubo-samsung-25w-certificado-1-1-rf', 'cargador-turbo-67w-ubu', 'cubo-usb-4a-ln-201', 'cubo-usb-5-2a-ln-203', 'combo-3-en-1-aguacate-re-2513', 'cubo-samsung-45w-certificado-1-1-rf', 'maquina-de-corte-mp8023-maxtop-3-en-1', 'combo-secador-plancha-re2517-7-en-1', 'rizadora-7-en-1-vex-style-core-titanium', 'secador-pequeno-nv662', 'secador-re-2058', 'maquina-profesional-vgr-v-951', 'plancha-re-1825', 'plancha-re-1826', 'tablet-redmi-pad-2-9-7-128gb-4gb-gris', 'tablet-samsung-galaxy-tab-a11-128gb', 'secador-2003', 'soporte-de-celular-rain-cover-vex', 'soporte-de-celular-para-carro-rp7-vex', 'linterna-grande-vip', 'linterna-led-pequena', 'patines-en-linea-premium-pt-sk8888-13', 'patineta-sl-3bz-2', 'patineta-sl-4z', 'pistola-de-hidrogel-st719b', 'patineta-electrica-t2-mobulaa', 'decodificador-tdt-premium-dvb-t2', 'decodificador-tdt-vip-dvb-t2', 'televisor-unitec-32-qled-hd-webos-32hdq', 'radio-de-comunicacion-baofeng', 'power-bank-10000-mah-ubu-301', 'power-bank-20000-mah-4-en-1-cs-tech', 'audifonos-inalambricos-pro-2-version-i12', 'televisor-unitec-43-qled-fhd-webos-43fhdq', 'reloj-xiaomi-redmi-watch-3-negro-gr-a', 'reloj-xiaomi-redmi-watch-4-gr-a', 'reloj-xiaomi-redmi-watch-5-active-gr-a', 'reloj-xiaomi-redmi-watch-5-gr-a', 'reloj-xiaomi-redmi-watch-5-lite-gr-a', 'reloj-xiaomi-redmi-watch-3-active-gr-a', 'power-bank-33w-20000-mah', 'manos-libres-basico-d21', 'sim-card-claro-prepago');

commit;
