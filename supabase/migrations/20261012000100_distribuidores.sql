-- Distribuidor interno por producto (pedido del cliente, post-B6).
-- Clasificación de quién les provee cada producto. Es SOLO para los admins:
-- vive junto al costo y el margen en producto_costos, que ya tiene RLS
-- "solo admins" (regla 1 de CLAUDE.md) — así nunca llega a rutas públicas,
-- sin tocar la tabla "productos" (de lectura pública) ni sus políticas.

create table public.distribuidores (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(btrim(nombre)) between 1 and 80),
  created_at timestamptz not null default now()
);

-- Sin distinguir mayúsculas/minúsculas, para no crear "Juan" y "juan" por separado
-- (se usa al agregar uno nuevo "al vuelo" desde el formulario de producto).
create unique index distribuidores_nombre_idx on public.distribuidores (lower(btrim(nombre)));

alter table public.distribuidores enable row level security;

grant select, insert, update, delete on public.distribuidores to authenticated;

create policy "distribuidores: solo admins"
  on public.distribuidores for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

alter table public.producto_costos
  add column distribuidor_id uuid references public.distribuidores (id) on delete set null;

-- ─────────────────────────────────────────────────────────────
-- guardar_producto: se agrega p_distribuidor_id (opcional, al final para no
-- romper llamadas existentes). La firma cambia, así que se reemplaza
-- eliminando primero la versión anterior (no se puede hacer con solo
-- "create or replace" cuando cambian los parámetros).
-- ─────────────────────────────────────────────────────────────

drop function if exists public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean);

create function public.guardar_producto(
  p_id uuid,
  p_categoria_id uuid,
  p_nombre text,
  p_slug text,
  p_descripcion text,
  p_imagenes text[],
  p_costo int,
  p_margen_pct numeric,
  p_precio_venta int,
  p_precio_anterior int,
  p_stock int,
  p_activo boolean,
  p_destacado boolean,
  p_distribuidor_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.exigir_admin();

  if p_id is null then
    raise exception 'Falta el identificador del producto.' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_nombre, ''))) not between 1 and 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres.' using errcode = '22023';
  end if;
  if coalesce(p_slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'La dirección (slug) solo puede tener minúsculas, números y guiones.' using errcode = '22023';
  end if;
  if p_costo is null or p_margen_pct is null or p_precio_venta is null or p_stock is null then
    raise exception 'Costo, margen, precio y stock son obligatorios.' using errcode = '22023';
  end if;
  if p_costo < 0 or p_margen_pct < 0 or p_precio_venta < 0 or p_stock < 0 then
    raise exception 'Costo, margen, precio y stock no pueden ser negativos.' using errcode = '22023';
  end if;
  if p_precio_anterior is not null and p_precio_anterior <= p_precio_venta then
    raise exception 'El precio anterior debe ser mayor que el precio actual.' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_imagenes, '{}')) > 4 then
    raise exception 'Máximo 4 imágenes por producto.' using errcode = '22023';
  end if;
  if p_distribuidor_id is not null and not exists (select 1 from public.distribuidores where id = p_distribuidor_id) then
    raise exception 'Ese distribuidor ya no existe; recarga la página.' using errcode = '22023';
  end if;

  insert into public.productos
    (id, categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado)
  values
    (p_id, p_categoria_id, btrim(p_nombre), p_slug, coalesce(p_descripcion, ''), coalesce(p_imagenes, '{}'),
     p_precio_venta, p_precio_anterior, p_stock, p_activo, p_destacado)
  on conflict (id) do update set
    categoria_id = excluded.categoria_id,
    nombre = excluded.nombre,
    slug = excluded.slug,
    descripcion = excluded.descripcion,
    imagenes = excluded.imagenes,
    precio_venta = excluded.precio_venta,
    precio_anterior = excluded.precio_anterior,
    stock = excluded.stock,
    activo = excluded.activo,
    destacado = excluded.destacado
  returning id into v_id;

  insert into public.producto_costos (producto_id, costo, margen_pct, distribuidor_id)
  values (v_id, p_costo, p_margen_pct, p_distribuidor_id)
  on conflict (producto_id) do update set
    costo = excluded.costo,
    margen_pct = excluded.margen_pct,
    distribuidor_id = excluded.distribuidor_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya existe un producto con esa dirección (slug); cámbiala.' using errcode = '22023';
end;
$$;

revoke execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean, uuid)
  from public, anon, authenticated;
grant execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean, uuid)
  to authenticated; -- exige admin adentro

-- ─────────────────────────────────────────────────────────────
-- duplicar_producto: la firma no cambia (sigue recibiendo solo el id), así
-- que basta con "create or replace"; ahora también copia el distribuidor
-- (ya viaja solo, porque toma la fila completa de producto_costos).
-- ─────────────────────────────────────────────────────────────

create or replace function public.duplicar_producto(p_producto_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_origen public.productos;
  v_costo public.producto_costos;
  v_nuevo_id uuid;
  v_slug text;
  v_sufijo int := 1;
begin
  perform public.exigir_admin();

  select * into v_origen from public.productos where id = p_producto_id;
  if not found then
    raise exception 'Producto no encontrado.' using errcode = 'P0002';
  end if;

  v_slug := v_origen.slug || '-copia';
  while exists (select 1 from public.productos where slug = v_slug) loop
    v_sufijo := v_sufijo + 1;
    v_slug := v_origen.slug || '-copia-' || v_sufijo;
  end loop;

  insert into public.productos
    (categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado)
  values
    (v_origen.categoria_id, v_origen.nombre || ' (copia)', v_slug, v_origen.descripcion, v_origen.imagenes,
     v_origen.precio_venta, v_origen.precio_anterior, 0, false, false)
  returning id into v_nuevo_id;

  select * into v_costo from public.producto_costos where producto_id = p_producto_id;
  if found then
    insert into public.producto_costos (producto_id, costo, margen_pct, distribuidor_id)
    values (v_nuevo_id, v_costo.costo, v_costo.margen_pct, v_costo.distribuidor_id);
  end if;

  return v_nuevo_id;
end;
$$;
