-- Sube el catálogo inicial de celulares (iPhones) que dio el cliente.
-- Crea la categoría "Celulares" si no existe, y cada producto con su costo,
-- margen (calculado solo) y precio de venta. Stock: 5 unidades cada uno.
--
-- Quedan INACTIVOS (no se ven en la tienda) hasta que les agregues fotos desde
-- el panel y los actives ahí mismo (edición rápida en Productos, columna Activo).
-- Se puede correr varias veces sin duplicar: usa el slug (la dirección) de cada
-- producto para no repetirlo si ya existe.
--
-- Uso: SQL Editor → New query → pegar → Run. Debe devolver "celulares_creados = 18"
-- la primera vez (0 si lo vuelves a correr, porque ya estarían creados).

begin;

insert into public.categorias (nombre, slug, orden)
select 'Celulares', 'celulares', coalesce(max(orden), 0) + 1 from public.categorias
on conflict (slug) do nothing;

with datos (nombre, slug, costo, precio, stock) as (
  values
    ('iPhone 17 Pro Max 256GB eSIM (Blanco)',           'iphone-17-pro-max-256gb-esim-blanco',           4060000, 4190000, 5),
    ('iPhone 17 Pro Max 256GB eSIM (Azul / Naranja)',   'iphone-17-pro-max-256gb-esim-azul-naranja',     4040000, 4170000, 5),
    ('iPhone 17 Pro 256GB eSIM (Blanco)',               'iphone-17-pro-256gb-esim-blanco',               3870000, 4020000, 5),
    ('iPhone 17 256GB SIM (Negro, Azul)',                'iphone-17-256gb-sim-negro-azul',                3020000, 3170000, 5),
    ('iPhone 17 256GB eSIM (Negro)',                     'iphone-17-256gb-esim-negro',                    2950000, 3090000, 5),
    ('iPhone 17 256GB SIM Activado (Negro, Verde)',      'iphone-17-256gb-sim-activado-negro-verde',      2850000, 2990000, 5),
    ('iPhone 16 Pro CPO 256GB eSIM (Negro)',             'iphone-16-pro-cpo-256gb-esim-negro',            3200000, 3380000, 5),
    ('iPhone 16 Pro CPO 128GB eSIM (Negro)',             'iphone-16-pro-cpo-128gb-esim-negro',            3015000, 3180000, 5),
    ('iPhone 16 128GB SIM (Negro, Azul, Verde)',         'iphone-16-128gb-sim-negro-azul-verde',           2500000, 2650000, 5),
    ('iPhone 16 128GB SIM Activado (Negro)',             'iphone-16-128gb-sim-activado-negro',            2380000, 2510000, 5),
    ('iPhone 15 Pro Max 256GB DUOS CPO (Blanco, Negro)', 'iphone-15-pro-max-256gb-duos-cpo-blanco-negro',  3350000, 3520000, 5),
    ('iPhone 15 Pro Max 256GB eSIM CPO (Negro)',         'iphone-15-pro-max-256gb-esim-cpo-negro',         3090000, 3240000, 5),
    ('iPhone 15 Pro CPO 256GB eSIM (Negro, Azul)',       'iphone-15-pro-cpo-256gb-esim-negro-azul',        2615000, 2750000, 5),
    ('iPhone 15 Pro CPO 128GB eSIM (Negro)',             'iphone-15-pro-cpo-128gb-esim-negro',             2445000, 2570000, 5),
    ('iPhone 15 128GB SIM (Azul, Negro)',                'iphone-15-128gb-sim-azul-negro',                 2180000, 2320000, 5),
    ('iPhone 15 128GB SIM Activado (Negro, Azul)',       'iphone-15-128gb-sim-activado-negro-azul',        2000000, 2120000, 5),
    ('iPhone 14 128GB eSIM Activados (Negro, Blanco)',   'iphone-14-128gb-esim-activados-negro-blanco',    1750000, 1870000, 5),
    ('iPhone 13 128GB SIM Activados (Negro)',            'iphone-13-128gb-sim-activados-negro',            1680000, 1790000, 5)
),
insertados as (
  insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo, destacado)
  select c.id, d.nombre, d.slug, d.precio, d.stock, false, false
  from datos d, (select id from public.categorias where slug = 'celulares') c
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.producto_costos (producto_id, costo, margen_pct)
select i.id, d.costo, round(((d.precio - d.costo)::numeric / d.costo) * 100, 2)
from insertados i
join datos d on d.slug = i.slug;

select count(*) as celulares_creados
from public.productos p
join public.categorias c on c.id = p.categoria_id and c.slug = 'celulares';

commit;
