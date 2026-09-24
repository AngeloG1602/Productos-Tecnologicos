-- B1 · Migración 3: funciones de pedidos (RPC)
-- Toda la lógica que mueve dinero o stock vive aquí, dentro de Postgres.
-- Nunca se confía en precios que vengan del navegador (RNF-05).

-- ─────────────────────────────────────────────────────────────
-- crear_pedido(items, cliente) — única vía pública para crear pedidos
-- ─────────────────────────────────────────────────────────────
-- p_items:   [{ "producto_id": uuid, "cantidad": int, "precio": int (opcional, el que vio el cliente) }]
-- p_cliente: { "nombre": text, "ciudad": text, "notas": text, "acepta_politica": bool }
--
-- Respuesta:
--   Si todo cuadra con la BD → se registra el pedido:
--     { "ok": true, "codigo": "PED-0001", "total": 78600, "items": [...] }
--   Si cambió algo (stock, precio o disponibilidad) → NO se registra (RN-04):
--     { "ok": false, "motivo": "cambios", "cambios": [...], "items": [...ajustados] }
--   El cliente ajusta su carrito, avisa al usuario y vuelve a enviar.
--
-- Los ítems de la respuesta nunca incluyen el costo.

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
           coalesce(p.activo, false) and p.stock > 0    as disponible,
           p.nombre,
           p.precio_venta,
           p.stock,
           coalesce(c.costo, 0)                         as costo,
           case when coalesce(p.activo, false)
                then least(s.cantidad, p.stock) else 0 end as cantidad
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
        'subtotal',        cantidad * precio_venta
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
    (pedido_id, producto_id, nombre_snapshot, cantidad, precio_unitario, costo_unitario)
  select v_pedido_id, p.id, p.nombre, (i ->> 'cantidad')::int, p.precio_venta, coalesce(c.costo, 0)
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
-- Utilidad interna: exigir admin
-- ─────────────────────────────────────────────────────────────

create or replace function public.exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- confirmar_pedido(id) — pendiente → confirmado
-- ─────────────────────────────────────────────────────────────
-- En una sola transacción: descuenta stock (falla si no alcanza) y congela
-- el reparto entre socios activos (RN-05, RN-07).
-- Redondeo del reparto: cada socio recibe round(ganancia × % / 100) y el último
-- (por fecha de creación) se lleva la diferencia, para que la suma sea exacta.

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

-- ─────────────────────────────────────────────────────────────
-- cancelar_pedido(id) — pendiente|confirmado → cancelado
-- ─────────────────────────────────────────────────────────────
-- Si estaba confirmado: devuelve el stock y elimina el reparto congelado.
-- Los pedidos entregados no se pueden cancelar.

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
-- entregar_pedido(id) — confirmado → entregado (sin efecto en stock)
-- ─────────────────────────────────────────────────────────────
-- Como el estado de los pedidos no se edita directamente (evita saltarse el
-- descuento de stock), este paso también va por función.

create or replace function public.entregar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
begin
  perform public.exigir_admin();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.estado <> 'confirmado' then
    raise exception 'Solo se pueden marcar como entregados los pedidos confirmados (el pedido % está %).',
      v_pedido.codigo, v_pedido.estado using errcode = '55000';
  end if;

  update public.pedidos
     set estado = 'entregado', entregado_at = now()
   where id = p_pedido_id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'estado', 'entregado');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────

revoke execute on function
  public.crear_pedido(jsonb, jsonb),
  public.exigir_admin(),
  public.confirmar_pedido(uuid),
  public.cancelar_pedido(uuid),
  public.entregar_pedido(uuid)
from public, anon, authenticated;

grant execute on function public.crear_pedido(jsonb, jsonb) to anon, authenticated;
grant execute on function
  public.confirmar_pedido(uuid),
  public.cancelar_pedido(uuid),
  public.entregar_pedido(uuid)
to authenticated; -- además, cada función exige ser admin
