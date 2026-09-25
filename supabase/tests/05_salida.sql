-- Prueba del Bloque 6: datos legales públicos y límite de pedidos seguidos.
-- Todo en una transacción con ROLLBACK al final.

begin;

insert into public.categorias (nombre, slug) values ('Prueba salida', 'prueba-salida');
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo)
select id, 'Producto S', 'ps-a', 10000, 50, true from public.categorias where slug = 'prueba-salida';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, 6000, 40 from public.productos where slug = 'ps-a';

do $$ begin
  perform set_config('prueba.ps', (select id::text from public.productos where slug = 'ps-a'), true);
end $$;

update public.configuracion
set legal_nombre = 'Comercio de Prueba', legal_documento = 'CC 123', legal_correo = 'hola@prueba.co',
    garantia_meses = 6, metodos_pago = 'Nequi o transferencia'
where id = 1;

-- ─────────────────────────────────────────────────────────────
-- Restricciones de la configuración
-- ─────────────────────────────────────────────────────────────
do $$ begin
  begin
    update public.configuracion set legal_correo = 'no-es-correo' where id = 1;
    raise exception 'FALLA correo inválido aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.configuracion set garantia_meses = 0 where id = 1;
    raise exception 'FALLA garantía de 0 meses aceptada';
  exception when check_violation then null;
  end;
  raise notice 'OK  la tabla rechaza correo inválido y garantía fuera de rango';
end $$;

-- ─────────────────────────────────────────────────────────────
-- Anónimo: lee los datos legales, pero no el margen ni pedidos_origen
-- ─────────────────────────────────────────────────────────────
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
declare
  c record;
begin
  select * into c from public.configuracion_publica();
  if c.legal_nombre <> 'Comercio de Prueba' or c.garantia_meses <> 6 or c.metodos_pago <> 'Nequi o transferencia' then
    raise exception 'FALLA configuracion_publica sin datos legales: %', c;
  end if;
  raise notice 'OK  configuracion_publica() entrega los datos legales';

  begin
    perform 1 from public.pedidos_origen;
    raise exception 'FALLA anónimo pudo leer pedidos_origen';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK  anónimo no puede leer pedidos_origen';

  begin
    perform public.limitar_pedidos();
    raise exception 'FALLA anónimo pudo ejecutar limitar_pedidos';
  exception when insufficient_privilege or feature_not_supported then null;
  end;
  raise notice 'OK  anónimo no puede ejecutar limitar_pedidos()';
end $$;

-- ─────────────────────────────────────────────────────────────
-- Límite por origen: 3 pedidos en 10 minutos desde la misma IP
-- ─────────────────────────────────────────────────────────────
set local "request.headers" = '{"x-forwarded-for":"203.0.113.7, 10.0.0.1"}';

do $$
declare
  items   constant jsonb := jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.ps')::uuid, 'cantidad', 1));
  cliente constant jsonb := '{"nombre":"Cliente","ciudad":"Cali","acepta_politica":true}';
  r jsonb;
begin
  for i in 1..3 loop
    r := public.crear_pedido(items, cliente);
    if not (r ->> 'ok')::boolean then raise exception 'FALLA pedido % rechazado: %', i, r; end if;
  end loop;

  begin
    perform public.crear_pedido(items, cliente);
    raise exception 'FALLA el 4.º pedido seguido de la misma IP pasó';
  exception when sqlstate '22023' then
    if sqlerrm not like 'Ya enviaste varios pedidos seguidos%' then raise; end if;
  end;
  raise notice 'OK  el 4.º pedido en 10 minutos desde la misma IP se rechaza con mensaje claro';
end $$;

-- Otra IP (cf-connecting-ip tiene prioridad sobre x-forwarded-for) sí puede pedir
set local "request.headers" = '{"cf-connecting-ip":"198.51.100.20","x-forwarded-for":"203.0.113.7"}';

do $$
declare
  r jsonb;
begin
  r := public.crear_pedido(
    jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.ps')::uuid, 'cantidad', 1)),
    '{"nombre":"Otra","ciudad":"Cali","acepta_politica":true}');
  if not (r ->> 'ok')::boolean then raise exception 'FALLA otra IP rechazada: %', r; end if;
  raise notice 'OK  otra IP sí puede pedir';
end $$;

reset role;

-- La IP no se guarda en claro
do $$ begin
  if exists (select 1 from public.pedidos_origen where origen like '%203.0.113.7%' or origen like '%198.51.100.20%') then
    raise exception 'FALLA la IP quedó guardada en claro';
  end if;
  if (select count(*) from public.pedidos_origen) <> 4 then
    raise exception 'FALLA se esperaban 4 registros de origen, hay %', (select count(*) from public.pedidos_origen);
  end if;
  raise notice 'OK  pedidos_origen guarda solo un resumen de la IP';
end $$;

-- Pasados 10 minutos, la misma IP puede volver a pedir
update public.pedidos_origen set creado_at = now() - interval '11 minutes';

set local role anon;
set local "request.headers" = '{"x-forwarded-for":"203.0.113.7"}';

do $$
declare
  r jsonb;
begin
  r := public.crear_pedido(
    jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.ps')::uuid, 'cantidad', 1)),
    '{"nombre":"Cliente","ciudad":"Cali","acepta_politica":true}');
  if not (r ->> 'ok')::boolean then raise exception 'FALLA la IP sigue bloqueada después de 10 minutos: %', r; end if;
  raise notice 'OK  pasados 10 minutos la misma IP vuelve a poder pedir';
end $$;

reset role;

-- Los registros de más de un día se borran solos (al llegar el siguiente pedido con IP)
update public.pedidos_origen set creado_at = now() - interval '2 days';

set local role anon;
set local "request.headers" = '{"x-forwarded-for":"192.0.2.50"}';
select public.crear_pedido(
  jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.ps')::uuid, 'cantidad', 1)),
  '{"nombre":"Cliente","ciudad":"Cali","acepta_politica":true}') is not null as creado \gset
reset role;

do $$ begin
  if exists (select 1 from public.pedidos_origen where creado_at < now() - interval '1 day') then
    raise exception 'FALLA no se borraron los registros viejos de pedidos_origen';
  end if;
  raise notice 'OK  los registros de origen de más de un día se borran';
end $$;

-- ─────────────────────────────────────────────────────────────
-- Tope global: 30 pedidos por hora (sin IP, como desde el SQL Editor)
-- ─────────────────────────────────────────────────────────────
do $$ begin
  perform set_config('prueba.hora',
    (select count(*)::text from public.pedidos where created_at > now() - interval '1 hour'), true);
end $$;

set local role anon;
set local "request.headers" = '';

do $$
declare
  items   constant jsonb := jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.ps')::uuid, 'cantidad', 1));
  cliente constant jsonb := '{"nombre":"Cliente","ciudad":"Cali","acepta_politica":true}';
  v_hora int;
begin
  -- Ya hay 6 de esta prueba (más los que haya en la base en la última hora)
  v_hora := current_setting('prueba.hora')::int;
  if v_hora >= 30 then raise exception 'FALLA la base ya tenía % pedidos en la última hora', v_hora; end if;

  for i in v_hora + 1 .. 30 loop
    perform public.crear_pedido(items, cliente);
  end loop;

  begin
    perform public.crear_pedido(items, cliente);
    raise exception 'FALLA el pedido 31 de la hora pasó';
  exception when sqlstate '22023' then
    if sqlerrm not like 'Estamos recibiendo muchos pedidos%' then raise; end if;
  end;
  raise notice 'OK  tope global: el pedido 31 de la hora se rechaza';
end $$;

reset role;

rollback;
