-- Datos de prueba (B1). Se pueden ejecutar varias veces sin duplicar.
-- Precios según RN-01: redondear_arriba(costo × 1,40, 100). Un caso con ajuste manual
-- (audífonos a $45.000) y casos de stock alto, bajo, agotado e inactivo (RN-03).

insert into public.categorias (nombre, slug, orden) values
  ('Cargadores',  'cargadores',  1),
  ('Cables',      'cables',      2),
  ('Audífonos',   'audifonos',   3),
  ('Parlantes',   'parlantes',   4),
  ('Power banks', 'power-banks', 5),
  ('Accesorios',  'accesorios',  6)
on conflict (slug) do nothing;

with datos (categoria, nombre, slug, descripcion, costo, margen, precio, stock, activo, destacado) as (
  values
    ('cargadores',  'Cargador USB-C 20W',          'cargador-usb-c-20w',          'Carga rápida Power Delivery para celulares y tabletas.',             12000, 40, 16800,  25, true,  true),
    ('cargadores',  'Cargador de carro doble USB', 'cargador-carro-doble-usb',    'Dos puertos USB-A, 2.4 A. Compatible con cualquier encendedor.',      8500, 40, 11900,   3, true,  false),
    ('cables',      'Cable USB-C a USB-C 1 m',     'cable-usb-c-a-usb-c-1m',      'Cable trenzado, soporta carga rápida de hasta 60 W.',                  4000, 40,  5600,  50, true,  false),
    ('cables',      'Cable Lightning 1 m',         'cable-lightning-1m',          'Cable USB-A a Lightning para iPhone.',                                 5500, 40,  7700,   0, true,  false),
    ('audifonos',   'Audífonos Bluetooth X',       'audifonos-bluetooth-x',       'Inalámbricos con estuche de carga y hasta 20 horas de batería.',      32000, 40, 45000,  10, true,  true),
    ('audifonos',   'Audífonos de cable 3,5 mm',   'audifonos-cable-3-5mm',       'Con micrófono y control de volumen.',                                  6000, 40,  8400,  15, true,  false),
    ('parlantes',   'Parlante Bluetooth mini',     'parlante-bluetooth-mini',     'Resistente a salpicaduras, 5 W, hasta 8 horas de música.',            38000, 40, 53200,   4, true,  true),
    ('power-banks', 'Power bank 10.000 mAh',       'power-bank-10000mah',         'Dos salidas USB y entrada USB-C. Carga un celular unas 2 veces.',     45000, 40, 63000,   8, true,  false),
    ('power-banks', 'Power bank 20.000 mAh',       'power-bank-20000mah',         'Carga rápida 22,5 W con pantalla de porcentaje.',                     70000, 40, 98000,   2, true,  false),
    ('accesorios',  'Soporte de celular para carro','soporte-celular-carro',      'Se ajusta a la rejilla del aire. Giro de 360°.',                       7000, 40,  9800,  12, true,  false),
    ('accesorios',  'Vidrio templado universal',   'vidrio-templado-universal',   'Protector de pantalla 9H. Indica el modelo al hacer el pedido.',       2500, 40,  3500, 100, true,  false),
    ('accesorios',  'Hub USB-C 4 en 1',            'hub-usb-c-4-en-1',            'HDMI 4K, dos USB-A y USB-C PD. (Inactivo: no debe verse en la tienda)',35000, 40, 49000,   6, false, false)
),
insertados as (
  insert into public.productos (categoria_id, nombre, slug, descripcion, precio_venta, stock, activo, destacado)
  select c.id, d.nombre, d.slug, d.descripcion, d.precio, d.stock, d.activo, d.destacado
  from datos d
  join public.categorias c on c.slug = d.categoria
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.producto_costos (producto_id, costo, margen_pct)
select i.id, d.costo, d.margen
from insertados i
join datos d on d.slug = i.slug;

-- Socios [POR CONFIRMAR]: 2 socios al 50/50
insert into public.socios (nombre, porcentaje)
select nombre, porcentaje
from (values ('Socio 1', 50), ('Socio 2', 50)) as s (nombre, porcentaje)
where not exists (select 1 from public.socios);

-- Número de WhatsApp de prueba (cámbialo en Configuración)
update public.configuracion
   set whatsapp_numero = '573000000000'
 where id = 1 and whatsapp_numero is null;
