-- Productos "bajo pedido": se fabrican o se consiguen por encargo, así que se pueden pedir
-- aunque no haya stock y pueden requerir anticipo (los demás se pagan contra entrega).
--
-- Reglas que se mantienen (CLAUDE.md):
--  * El stock nunca queda negativo: los productos bajo pedido NO descuentan ni devuelven stock.
--  * El pedido congela si cada ítem era bajo pedido (pedido_items.bajo_pedido), igual que
--    congela nombre y precio: si el admin cambia el producto después, confirmar/cancelar
--    se comportan según lo que el cliente pidió.
--  * crear_pedido sigue tomando precio y disponibilidad de la base, nunca del navegador.

alter table public.productos
  add column bajo_pedido bool not null default false;

alter table public.pedido_items
  add column bajo_pedido bool not null default false;

-- ─────────────────────────────────────────────────────────────
-- crear_pedido: la disponibilidad y la cantidad de un bajo pedido no dependen del stock
-- ─────────────────────────────────────────────────────────────

create or replace function public.crear_pedido(p_items jsonb, p_cliente jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nombre     text;
  v_ciudad     text;
  v_notas      text;
  v_acepta     boolean;
  v_items      jsonb;
  v_cambios    jsonb;
  v_total      int;
  v_costo      int;
  v_pedido_id  uuid;
  v_codigo     text;
begin
  -- Datos del cliente (RN-09)
  if p_cliente is null or jsonb_typeof(p_cliente) <> 'object' then
    raise exception 'Faltan los datos del cliente.' using errcode = '22023';
  end if;

  v_nombre := btrim(coalesce(p_cliente ->> 'nombre', ''));
  v_ciudad := btrim(coalesce(p_cliente ->> 'ciudad', ''));
  v_notas  := btrim(coalesce(p_cliente ->> 'notas', ''));
  v_acepta := coalesce(p_cliente -> 'acepta_politica' = 'true'::jsonb, false);

  if length(v_nombre) not between 1 and 80 then
    raise exception 'Escribe tu nombre (máximo 80 caracteres).' using errcode = '22023';
  end if;
  if length(v_ciudad) not between 1 and 120 then
    raise exception 'Escribe tu ciudad y barrio (máximo 120 caracteres).' using errcode = '22023';
  end if;
  if length(v_notas) > 500 then
    raise exception 'Las notas no pueden superar 500 caracteres.' using errcode = '22023';
  end if;
  if not v_acepta then
    raise exception 'Debes aceptar la política de tratamiento de datos.' using errcode = '22023';
  end if;

  -- Ítems del carrito
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'El carrito está vacío o no es válido.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    where jsonb_typeof(e) <> 'object'
       or coalesce(e ->> 'producto_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       -- cantidad: entero entre 1 y 999 (CASE garantiza que el cast va después del regex)
       or case
            when jsonb_typeof(e -> 'cantidad') = 'number' and (e ->> 'cantidad') ~ '^[0-9]{1,3}$'
              then (e ->> 'cantidad')::int < 1
            else true
          end
       -- precio visto (opcional): entero >= 0
       or case
            when jsonb_typeof(e -> 'precio') is null or jsonb_typeof(e -> 'precio') = 'null' then false
            when jsonb_typeof(e -> 'precio') = 'number' and (e ->> 'precio') ~ '^[0-9]{1,9}$' then false
            else true
          end
  ) then
    raise exception 'El carrito tiene datos inválidos.' using errcode = '22023';
  end if;

  -- Comparar lo pedido con la BD (precio y stock SIEMPRE de la BD)
  with solicitados as (
    select (e ->> 'producto_id')::uuid        as producto_id,
           sum((e ->> 'cantidad')::int)::int  as cantidad,
           max((e ->> 'precio')::int)         as precio_visto
    from jsonb_array_elements(p_items) e
    group by 1
  ),
  calculo as (
    select s.producto_id,
           s.cantidad                                   as cantidad_solicitada,
           s.precio_visto,
           coalesce(p.activo, false) and (coalesce(p.bajo_pedido, false) or p.stock > 0) as disponible,
           coalesce(p.bajo_pedido, false)               as bajo_pedido,
           p.nombre,
           p.precio_venta,
           p.stock,
           coalesce(c.costo, 0)                         as costo,
           -- Bajo pedido: no depende del stock (se fabrica o se consigue por encargo)
           case when coalesce(p.activo, false)
                then (case when coalesce(p.bajo_pedido, false) then s.cantidad else least(s.cantidad, p.stock) end)
                else 0 end as cantidad
    from solicitados s
    left join public.productos p on p.id = s.producto_id
    left join public.producto_costos c on c.producto_id = p.id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
        'producto_id',     producto_id,
        'nombre',          nombre,
        'cantidad',        cantidad,
        'precio_unitario', precio_venta,
        'subtotal',        cantidad * precio_venta,
        'bajo_pedido',     bajo_pedido
      ) order by nombre) filter (where cantidad > 0), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
        'producto_id',         producto_id,
        'nombre',              nombre,
        'tipo',                case
                                 when not disponible then 'no_disponible'
                                 when cantidad < cantidad_solicitada then 'stock'
                                 else 'precio'
                               end,
        'cantidad_solicitada', cantidad_solicitada,
        'cantidad',            cantidad,
        'precio_anterior',     precio_visto,
        'precio_actual',       precio_venta
      ) order by nombre) filter (
        where not disponible
           or cantidad < cantidad_solicitada
           or (precio_visto is not null and precio_visto <> precio_venta)
      ), '[]'::jsonb),
    coalesce(sum(cantidad * precio_venta), 0)::int,
    coalesce(sum(cantidad * costo), 0)::int
  into v_items, v_cambios, v_total, v_costo
  from calculo;

  if jsonb_array_length(v_cambios) > 0 then
    return jsonb_build_object(
      'ok',      false,
      'motivo',  'cambios',
      'cambios', v_cambios,
      'items',   v_items,
      'total',   v_total
    );
  end if;

  -- Registrar el pedido congelando nombre, precio y costo (RN-06)
  insert into public.pedidos (cliente_nombre, cliente_ciudad, notas, total_venta, total_costo, ganancia)
  values (v_nombre, v_ciudad, v_notas, v_total, v_costo, v_total - v_costo)
  returning id, codigo into v_pedido_id, v_codigo;

  insert into public.pedido_items
    (pedido_id, producto_id, nombre_snapshot, cantidad, precio_unitario, costo_unitario, bajo_pedido)
  select v_pedido_id, p.id, p.nombre, (i ->> 'cantidad')::int, p.precio_venta, coalesce(c.costo, 0), p.bajo_pedido
  from jsonb_array_elements(v_items) i
  join public.productos p on p.id = (i ->> 'producto_id')::uuid
  left join public.producto_costos c on c.producto_id = p.id;

  return jsonb_build_object(
    'ok',     true,
    'codigo', v_codigo,
    'total',  v_total,
    'items',  v_items
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- confirmar_pedido / cancelar_pedido: ignoran los ítems bajo pedido al mover stock
-- ─────────────────────────────────────────────────────────────

create or replace function public.confirmar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pedido    public.pedidos;
  v_item      record;
  v_stock     int;
  v_socio     record;
  v_n_socios  int;
  v_suma_pct  numeric;
  v_i         int := 0;
  v_monto     int;
  v_asignado  int := 0;
begin
  perform public.exigir_admin();
  -- Marca de origen: el historial de productos no registra el stock que mueven los pedidos.
  perform set_config('app.origen', 'pedido', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.estado <> 'pendiente' then
    raise exception 'Solo se pueden confirmar pedidos pendientes (el pedido % está %).',
      v_pedido.codigo, v_pedido.estado using errcode = '55000';
  end if;

  select count(*), coalesce(sum(porcentaje), 0) into v_n_socios, v_suma_pct
  from public.socios where activo;
  if v_n_socios = 0 or v_suma_pct <> 100 then
    raise exception 'Los porcentajes de los socios activos deben sumar 100 %% antes de confirmar pedidos.'
      using errcode = '55000';
  end if;

  -- Descontar stock (orden fijo por producto para evitar bloqueos cruzados)
  for v_item in
    select producto_id, max(nombre_snapshot) as nombre, sum(cantidad)::int as cantidad
    from public.pedido_items
    where pedido_id = p_pedido_id
      and not bajo_pedido -- los bajo pedido no descuentan stock
    group by producto_id
    order by producto_id
  loop
    if v_item.producto_id is null then
      raise exception 'El producto "%" ya no existe; no se puede descontar su stock.', v_item.nombre
        using errcode = '55000';
    end if;

    update public.productos
       set stock = stock - v_item.cantidad
     where id = v_item.producto_id
       and stock >= v_item.cantidad;

    if not found then
      select stock into v_stock from public.productos where id = v_item.producto_id;
      raise exception 'Stock insuficiente para "%": hay %, el pedido necesita %.',
        v_item.nombre, coalesce(v_stock, 0), v_item.cantidad using errcode = '55000';
    end if;
  end loop;

  -- Congelar el reparto
  for v_socio in
    select id, nombre, porcentaje from public.socios where activo order by created_at, id
  loop
    v_i := v_i + 1;
    if v_i = v_n_socios then
      v_monto := v_pedido.ganancia - v_asignado;
    else
      v_monto := round(v_pedido.ganancia * v_socio.porcentaje / 100)::int;
    end if;
    v_asignado := v_asignado + v_monto;

    insert into public.pedido_reparto (pedido_id, socio_id, socio_nombre, porcentaje, monto)
    values (p_pedido_id, v_socio.id, v_socio.nombre, v_socio.porcentaje, v_monto);
  end loop;

  update public.pedidos
     set estado = 'confirmado', confirmado_at = now()
   where id = p_pedido_id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'estado', 'confirmado');
end;
$$;

create or replace function public.cancelar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
  v_item   record;
begin
  perform public.exigir_admin();
  -- Marca de origen: el historial de productos no registra el stock que mueven los pedidos.
  perform set_config('app.origen', 'pedido', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.estado not in ('pendiente', 'confirmado') then
    raise exception 'No se puede cancelar el pedido % (está %).',
      v_pedido.codigo, v_pedido.estado using errcode = '55000';
  end if;

  if v_pedido.estado = 'confirmado' then
    for v_item in
      select producto_id, sum(cantidad)::int as cantidad
      from public.pedido_items
      where pedido_id = p_pedido_id and producto_id is not null
        and not bajo_pedido -- los bajo pedido no descontaron stock, así que no se devuelve
      group by producto_id
      order by producto_id
    loop
      update public.productos
         set stock = stock + v_item.cantidad
       where id = v_item.producto_id;
    end loop;

    delete from public.pedido_reparto where pedido_id = p_pedido_id;
  end if;

  update public.pedidos
     set estado = 'cancelado', cancelado_at = now()
   where id = p_pedido_id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'estado', 'cancelado');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- guardar_producto: se agrega p_bajo_pedido (al final, opcional). La firma cambia, así que
-- se elimina la anterior y se crea de nuevo.
-- ─────────────────────────────────────────────────────────────

drop function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean, uuid);

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
  p_distribuidor_id uuid default null,
  p_bajo_pedido boolean default false
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
    (id, categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado, bajo_pedido)
  values
    (p_id, p_categoria_id, btrim(p_nombre), p_slug, coalesce(p_descripcion, ''), coalesce(p_imagenes, '{}'),
     p_precio_venta, p_precio_anterior, p_stock, p_activo, p_destacado, coalesce(p_bajo_pedido, false))
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
    destacado = excluded.destacado,
    bajo_pedido = excluded.bajo_pedido
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

revoke execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean, uuid, boolean)
  to authenticated; -- exige admin adentro

-- duplicar_producto: misma firma; ahora también copia la marca "bajo pedido".

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
    (categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado, bajo_pedido)
  values
    (v_origen.categoria_id, v_origen.nombre || ' (copia)', v_slug, v_origen.descripcion, v_origen.imagenes,
     v_origen.precio_venta, v_origen.precio_anterior, 0, false, false, v_origen.bajo_pedido)
  returning id into v_nuevo_id;

  select * into v_costo from public.producto_costos where producto_id = p_producto_id;
  if found then
    insert into public.producto_costos (producto_id, costo, margen_pct, distribuidor_id)
    values (v_nuevo_id, v_costo.costo, v_costo.margen_pct, v_costo.distribuidor_id);
  end if;

  return v_nuevo_id;
end;
$$;
