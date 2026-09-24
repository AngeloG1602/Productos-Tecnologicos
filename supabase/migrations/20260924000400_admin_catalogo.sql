-- B4 · Migración 4: lo que necesita el panel admin para el catálogo
-- Precio anterior (para mostrar descuentos), imágenes (Storage) y las
-- funciones que crean/editan/duplican productos de forma atómica.

-- ─────────────────────────────────────────────────────────────
-- Precio anterior (opcional). Si se usa, debe ser mayor al precio actual;
-- si no, no sería un descuento real.
-- ─────────────────────────────────────────────────────────────

alter table public.productos
  add column precio_anterior int check (precio_anterior is null or precio_anterior > precio_venta);

-- ─────────────────────────────────────────────────────────────
-- Imágenes de productos (Storage): bucket público, solo admins escriben.
-- Convención de nombre: "<producto_id>/<n>.webp" (ver lib/imagenes.ts).
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "productos storage: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'productos');

create policy "productos storage: admins suben"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos' and (select public.es_admin()));

create policy "productos storage: admins actualizan"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()))
  with check (bucket_id = 'productos' and (select public.es_admin()));

create policy "productos storage: admins borran"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()));

-- ─────────────────────────────────────────────────────────────
-- guardar_producto: crea o actualiza un producto y su costo/margen en una
-- sola transacción (evita que quede un producto sin costo si algo falla).
-- p_id lo genera el panel (crypto.randomUUID()) ANTES de llamar a esta
-- función: así puede subir las fotos a "<p_id>/1.webp" antes de guardar.
-- Es upsert: si el id no existe, lo crea; si existe, lo actualiza.
-- ─────────────────────────────────────────────────────────────

create or replace function public.guardar_producto(
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
  p_destacado boolean
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

  insert into public.producto_costos (producto_id, costo, margen_pct)
  values (v_id, p_costo, p_margen_pct)
  on conflict (producto_id) do update set costo = excluded.costo, margen_pct = excluded.margen_pct;

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya existe un producto con esa dirección (slug); cámbiala.' using errcode = '22023';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- duplicar_producto: copia un producto (mismas fotos, costo y margen) como
-- variante inactiva y con stock 0, para editar lo que cambie y activarla.
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
    insert into public.producto_costos (producto_id, costo, margen_pct)
    values (v_nuevo_id, v_costo.costo, v_costo.margen_pct);
  end if;

  return v_nuevo_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────

revoke execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean)
  from public, anon, authenticated;
revoke execute on function public.duplicar_producto(uuid) from public, anon, authenticated;

grant execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean)
  to authenticated; -- exige admin adentro
grant execute on function public.duplicar_producto(uuid) to authenticated; -- exige admin adentro
