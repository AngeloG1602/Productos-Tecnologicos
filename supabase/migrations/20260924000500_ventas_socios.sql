-- B5 · Migración 5: socios y resumen de ventas para el panel admin
-- (Los pedidos ya se confirman/cancelan/entregan con las funciones de la migración 3.)

-- ─────────────────────────────────────────────────────────────
-- guardar_socios(p_socios): guarda la lista completa de socios de una vez.
-- p_socios: [{ "id": uuid|null, "nombre": text, "porcentaje": number, "activo": bool }]
--   id null → socio nuevo. Los socios que no vengan en la lista se desactivan
--   (no se borran: el reparto de pedidos viejos guarda su nombre y porcentaje).
-- Al final, los activos deben sumar exactamente 100 % (RN-07).
-- Devuelve cuántos socios quedaron activos.
-- ─────────────────────────────────────────────────────────────

create or replace function public.guardar_socios(p_socios jsonb)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_item   jsonb;
  v_id     uuid;
  v_ids    uuid[] := '{}';
  v_nombre text;
  v_pct    numeric;
  v_suma   numeric;
  v_activos int;
begin
  perform public.exigir_admin();

  if p_socios is null or jsonb_typeof(p_socios) <> 'array' or jsonb_array_length(p_socios) = 0 then
    raise exception 'Agrega al menos un socio.' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_socios) loop
    v_nombre := btrim(coalesce(v_item ->> 'nombre', ''));
    if length(v_nombre) not between 1 and 80 then
      raise exception 'Cada socio necesita un nombre (máximo 80 caracteres).' using errcode = '22023';
    end if;
    -- CASE: el cast a numeric solo ocurre si el texto ya pasó la expresión regular
    v_pct := case
               when jsonb_typeof(v_item -> 'porcentaje') = 'number'
                    and (v_item ->> 'porcentaje') ~ '^[0-9]{1,3}(\.[0-9]{1,2})?$'
                 then (v_item ->> 'porcentaje')::numeric
             end;
    if v_pct is null or v_pct <= 0 or v_pct > 100 then
      raise exception 'El porcentaje de "%" debe ser mayor que 0 y máximo 100 (hasta 2 decimales).', v_nombre
        using errcode = '22023';
    end if;
    if jsonb_typeof(v_item -> 'activo') is distinct from 'boolean' then
      raise exception 'Datos de socio inválidos.' using errcode = '22023';
    end if;

    if coalesce(v_item ->> 'id', '') <> '' then
      update public.socios
         set nombre = v_nombre,
             porcentaje = v_pct,
             activo = (v_item ->> 'activo')::boolean
       where id = (v_item ->> 'id')::uuid
      returning id into v_id;
      if not found then
        raise exception 'Uno de los socios ya no existe; recarga la página.' using errcode = 'P0002';
      end if;
    else
      insert into public.socios (nombre, porcentaje, activo)
      values (v_nombre, v_pct, (v_item ->> 'activo')::boolean)
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;
  end loop;

  update public.socios set activo = false where activo and not (id = any (v_ids));

  select coalesce(sum(porcentaje), 0), count(*) into v_suma, v_activos from public.socios where activo;
  if v_suma <> 100 then
    raise exception 'Los porcentajes de los socios activos deben sumar 100 %% (ahora suman %).', v_suma
      using errcode = '22023';
  end if;

  return v_activos;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- resumen_ventas(p_desde, p_hasta): datos del dashboard (RF-18).
-- Cuentan solo pedidos confirmados y entregados (RN-07), según la fecha en que
-- se confirmaron, en hora de Colombia, con ambos días incluidos.
-- ─────────────────────────────────────────────────────────────

create or replace function public.resumen_ventas(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inicio timestamptz;
  v_fin    timestamptz;
  v_resumen jsonb;
begin
  perform public.exigir_admin();

  if p_desde is null or p_hasta is null or p_hasta < p_desde then
    raise exception 'El rango de fechas no es válido.' using errcode = '22023';
  end if;
  v_inicio := p_desde::timestamp at time zone 'America/Bogota';
  v_fin    := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  with vendidos as (
    select p.*
    from public.pedidos p
    where p.estado in ('confirmado', 'entregado')
      and p.confirmado_at >= v_inicio
      and p.confirmado_at < v_fin
  )
  select jsonb_build_object(
    'pedidos',  (select count(*) from vendidos),
    'ventas',   (select coalesce(sum(total_venta), 0)::bigint from vendidos),
    'costo',    (select coalesce(sum(total_costo), 0)::bigint from vendidos),
    'ganancia', (select coalesce(sum(ganancia), 0)::bigint from vendidos),
    'reparto',  (
      select coalesce(jsonb_agg(jsonb_build_object('socio', socio_nombre, 'monto', monto) order by monto desc, socio_nombre), '[]'::jsonb)
      from (
        select r.socio_nombre, sum(r.monto)::bigint as monto
        from public.pedido_reparto r
        join vendidos v on v.id = r.pedido_id
        group by r.socio_nombre
      ) x
    ),
    'pendientes', (select count(*) from public.pedidos where estado = 'pendiente'),
    'vencidos',   (select count(*) from public.pedidos where estado = 'pendiente' and created_at < now() - interval '7 days')
  )
  into v_resumen;

  return v_resumen;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────

revoke execute on function public.guardar_socios(jsonb), public.resumen_ventas(date, date)
  from public, anon, authenticated;
grant execute on function public.guardar_socios(jsonb), public.resumen_ventas(date, date)
  to authenticated; -- exigen admin adentro
