-- Prueba del Bloque 5: guardar_socios y resumen_ventas (dashboard).
-- Todo en una transacción con ROLLBACK al final.

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a005', 'admin5@prueba.local'),
  ('00000000-0000-0000-0000-00000000b005', 'intruso5@prueba.local');
insert into public.administradores (user_id, nombre) values ('00000000-0000-0000-0000-00000000a005', 'Admin');

insert into public.categorias (nombre, slug) values ('Prueba ventas', 'prueba-ventas');
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo)
select id, 'Producto V', 'pv-a', 10000, 20, true from public.categorias where slug = 'prueba-ventas';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, 6000, 40 from public.productos where slug = 'pv-a';

do $$ begin
  perform set_config('prueba.pv', (select id::text from public.productos where slug = 'pv-a'), true);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Admin: socios
-- ─────────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a005","role":"authenticated"}';

do $$
declare
  v_n int;
  v_a uuid;
  v_b uuid;
begin
  -- Lista nueva: los socios que ya existían (seed) y no vienen en la lista quedan inactivos
  v_n := public.guardar_socios('[{"id":null,"nombre":"Socio A","porcentaje":60,"activo":true},
                                 {"id":null,"nombre":"Socio B","porcentaje":40,"activo":true}]');
  if v_n <> 2 or (select sum(porcentaje) from public.socios where activo) <> 100
     or (select count(*) from public.socios where activo) <> 2 then
    raise exception 'FALLA guardar_socios 60/40';
  end if;
  raise notice 'OK  guardar_socios reemplaza la lista (60/40) y desactiva los que no vienen';

  v_a := (select id from public.socios where nombre = 'Socio A' and activo);
  v_b := (select id from public.socios where nombre = 'Socio B' and activo);

  -- No suman 100 → error y nada cambia
  begin
    perform public.guardar_socios(jsonb_build_array(
      jsonb_build_object('id', v_a, 'nombre', 'Socio A', 'porcentaje', 60, 'activo', true),
      jsonb_build_object('id', v_b, 'nombre', 'Socio B', 'porcentaje', 30, 'activo', true)));
    raise exception 'FALLA: aceptó socios que suman 90 %%';
  exception when invalid_parameter_value then
    if sqlerrm !~ 'suman 90' then raise exception 'FALLA mensaje: %', sqlerrm; end if;
  end;
  if (select porcentaje from public.socios where id = v_b) <> 40 then
    raise exception 'FALLA: el intento fallido cambió datos';
  end if;
  raise notice 'OK  si no suman 100 %% → error claro y no cambia nada';

  -- Porcentajes inválidos
  begin
    perform public.guardar_socios('[{"id":null,"nombre":"X","porcentaje":0,"activo":true}]');
    raise exception 'FALLA: aceptó porcentaje 0';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.guardar_socios('[{"id":null,"nombre":"X","porcentaje":"50","activo":true}]');
    raise exception 'FALLA: aceptó porcentaje como texto';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.guardar_socios('[{"id":null,"nombre":"X","porcentaje":12.345,"activo":true}]');
    raise exception 'FALLA: aceptó 3 decimales';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.guardar_socios('[{"id":null,"nombre":"  ","porcentaje":100,"activo":true}]');
    raise exception 'FALLA: aceptó nombre vacío';
  exception when invalid_parameter_value then null;
  end;
  raise notice 'OK  porcentajes y nombres inválidos → error';

  -- Editar existentes y agregar uno: 50 / 30 / 20
  v_n := public.guardar_socios(jsonb_build_array(
    jsonb_build_object('id', v_a, 'nombre', 'Socio A', 'porcentaje', 50, 'activo', true),
    jsonb_build_object('id', v_b, 'nombre', 'Socio B', 'porcentaje', 30, 'activo', true),
    jsonb_build_object('id', null, 'nombre', 'Socio C', 'porcentaje', 20, 'activo', true)));
  if v_n <> 3 then raise exception 'FALLA: esperaba 3 socios activos, hay %', v_n; end if;
  raise notice 'OK  editar y agregar socios (50/30/20)';
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Admin: pedidos y resumen de ventas
-- ─────────────────────────────────────────────────────────────
do $$
declare
  cliente constant jsonb := '{"nombre":"Cliente","ciudad":"Bogotá","acepta_politica":true}';
  v_pv uuid := current_setting('prueba.pv')::uuid;
  r jsonb;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid;
  v_hoy date := (now() at time zone 'America/Bogota')::date;
begin
  -- P1: 2 × 10.000 (ganancia 8.000) → confirmado
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', v_pv, 'cantidad', 2)), cliente);
  p1 := (select id from public.pedidos where codigo = r ->> 'codigo');
  perform public.confirmar_pedido(p1);
  -- P2: 1 × 10.000 (ganancia 4.000) → confirmado y entregado
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', v_pv, 'cantidad', 1)), cliente);
  p2 := (select id from public.pedidos where codigo = r ->> 'codigo');
  perform public.confirmar_pedido(p2);
  perform public.entregar_pedido(p2);
  -- P3: pendiente
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', v_pv, 'cantidad', 1)), cliente);
  p3 := (select id from public.pedidos where codigo = r ->> 'codigo');
  perform set_config('prueba.p3', p3::text, true);
  -- P4: cancelado (no cuenta)
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', v_pv, 'cantidad', 1)), cliente);
  p4 := (select id from public.pedidos where codigo = r ->> 'codigo');
  perform public.confirmar_pedido(p4);
  perform public.cancelar_pedido(p4);

  r := public.resumen_ventas(v_hoy, v_hoy);
  if (r ->> 'pedidos')::int <> 2 or (r ->> 'ventas')::int <> 30000 or (r ->> 'costo')::int <> 18000
     or (r ->> 'ganancia')::int <> 12000 then
    raise exception 'FALLA resumen de hoy: %', r;
  end if;
  raise notice 'OK  resumen: 2 pedidos, ventas 30.000, costo 18.000, ganancia 12.000 (sin pendientes ni cancelados)';

  if r -> 'reparto' <> '[{"socio":"Socio A","monto":6000},{"socio":"Socio B","monto":3600},{"socio":"Socio C","monto":2400}]'::jsonb then
    raise exception 'FALLA reparto: %', r -> 'reparto';
  end if;
  raise notice 'OK  reparto por socio: 6.000 / 3.600 / 2.400 = 12.000';

  if (r ->> 'pendientes')::int <> 1 or (r ->> 'vencidos')::int <> 0 then
    raise exception 'FALLA pendientes/vencidos: %', r;
  end if;
  raise notice 'OK  1 pedido pendiente, 0 vencidos';

  r := public.resumen_ventas(v_hoy - 30, v_hoy - 1);
  if (r ->> 'pedidos')::int <> 0 or (r ->> 'ventas')::int <> 0 or r -> 'reparto' <> '[]'::jsonb then
    raise exception 'FALLA rango sin ventas: %', r;
  end if;
  raise notice 'OK  un rango sin ventas da ceros';

  begin
    perform public.resumen_ventas(v_hoy, v_hoy - 1);
    raise exception 'FALLA: aceptó un rango al revés';
  exception when invalid_parameter_value then
    raise notice 'OK  rango de fechas inválido → error';
  end;
end
$$;

-- Envejecer el pedido pendiente (como postgres) para probar "vencidos"
reset role;
update public.pedidos set created_at = now() - interval '8 days' where id = current_setting('prueba.p3')::uuid;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a005","role":"authenticated"}';

do $$
declare
  v_hoy date := (now() at time zone 'America/Bogota')::date;
begin
  if (public.resumen_ventas(v_hoy, v_hoy) ->> 'vencidos')::int <> 1 then
    raise exception 'FALLA: no cuenta el pedido vencido';
  end if;
  raise notice 'OK  pendiente con más de 7 días cuenta como vencido';
end
$$;

-- ─────────────────────────────────────────────────────────────
-- No admin y anónimo
-- ─────────────────────────────────────────────────────────────
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000b005","role":"authenticated"}';

do $$
begin
  begin
    perform public.resumen_ventas(current_date, current_date);
    raise exception 'FALLA: no-admin vio el resumen de ventas';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.guardar_socios('[{"id":null,"nombre":"Yo","porcentaje":100,"activo":true}]');
    raise exception 'FALLA: no-admin cambió los socios';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK  no-admin no puede ver ventas ni cambiar socios';
end
$$;

reset role;
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
begin
  begin
    perform public.resumen_ventas(current_date, current_date);
    raise exception 'FALLA: anónimo vio el resumen de ventas';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK  anónimo no puede ver ventas';
end
$$;

rollback;
