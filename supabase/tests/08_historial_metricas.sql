-- Historial de productos y métricas: se anota lo que cambia el admin (no el stock de los pedidos)
-- y el público solo puede sumar contadores. Una transacción con ROLLBACK.
begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a008', 'admin8@prueba.local');
insert into public.administradores (user_id, nombre) values ('00000000-0000-0000-0000-00000000a008', 'Admin 8');
update public.socios set activo = false;
insert into public.socios (nombre, porcentaje) values ('Socio Único', 100);

insert into public.categorias (nombre, slug) values ('Prueba historial', 'prueba-hist');
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo)
select id, 'Producto H', 'hist-h', 10000, 5, true from public.categorias where slug = 'prueba-hist';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, 6000, 40 from public.productos where slug = 'hist-h';

-- ── Historial (como admin)
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a008","role":"authenticated"}';

do $$
declare
  v_id uuid := (select id from public.productos where slug = 'hist-h');
  n int;
begin
  update public.productos set precio_venta = 12000, stock = 9 where id = v_id;
  update public.producto_costos set costo = 7000 where producto_id = v_id;
  update public.productos set nombre = 'Producto H renombrado' where id = v_id; -- no se anota

  select count(*) into n from public.historial_productos where producto_id = v_id;
  if n <> 3 then raise exception 'FALLA: se esperaban 3 anotaciones (precio, stock, costo), hay %', n; end if;
  if not exists (select 1 from public.historial_productos
                 where producto_id = v_id and campo = 'precio_venta' and anterior = '10000' and nuevo = '12000'
                   and usuario_id = '00000000-0000-0000-0000-00000000a008') then
    raise exception 'FALLA: el cambio de precio no quedó con valores y usuario';
  end if;
  raise notice 'OK  el historial anota precio, stock y costo con valores anterior/nuevo y quién';

  -- El stock que mueve un pedido no se anota
  perform set_config('app.origen', 'pedido', true);
  update public.productos set stock = stock - 1 where id = v_id;
  perform set_config('app.origen', '', true);
  select count(*) into n from public.historial_productos where producto_id = v_id and campo = 'stock';
  if n <> 1 then raise exception 'FALLA: el stock de un pedido no debe anotarse (hay % de stock)', n; end if;
  raise notice 'OK  el stock que mueven los pedidos no ensucia el historial';
end $$;

-- ── Visitante anónimo: solo suma contadores
reset role;
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
declare
  v_id uuid := (select id from public.productos where slug = 'hist-h');
  n int;
begin
  perform public.registrar_evento('vista_inicio');
  perform public.registrar_evento('vista_inicio');
  perform public.registrar_evento('vista_producto', v_id);
  perform public.registrar_evento('evento_inventado');           -- se ignora
  perform public.registrar_evento('vista_producto', gen_random_uuid()); -- producto inexistente: se ignora
  reset role;
  select cantidad into n from public.metricas_dia where tipo = 'vista_inicio';
  if n <> 2 then raise exception 'FALLA: vista_inicio debía sumar 2, suma %', n; end if;
  select count(*) into n from public.metricas_dia;
  if n <> 2 then raise exception 'FALLA: solo debían existir 2 contadores, hay %', n; end if;
  raise notice 'OK  anon suma contadores; tipos o productos inválidos se ignoran';

  set local role anon;
  select count(*) into n from public.metricas_dia;
  if n <> 0 then raise exception 'FALLA: anon leyó métricas'; end if;
  select count(*) into n from public.historial_productos;
  if n <> 0 then raise exception 'FALLA: anon leyó el historial'; end if;
  raise notice 'OK  anon no lee métricas ni historial';
end $$;

-- ── Resúmenes (RLS): el admin ve los totales; un usuario sin rol de admin recibe vacío
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a008","role":"authenticated"}';
do $$
declare
  n bigint;
begin
  select total into n from public.metricas_resumen(current_date - 1, current_date + 1) where tipo = 'vista_inicio';
  if n is distinct from 2 then raise exception 'FALLA: metricas_resumen debía dar 2 vistas de inicio, dio %', n; end if;
  if (select count(*) from public.metricas_top_productos(current_date - 1, current_date + 1)) <> 1 then
    raise exception 'FALLA: metricas_top_productos debía listar 1 producto';
  end if;
  raise notice 'OK  el admin ve los resúmenes de métricas';
end $$;

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
do $$
begin
  if exists (select 1 from public.metricas_resumen(current_date - 1, current_date + 1)) then
    raise exception 'FALLA: un no-admin recibió métricas';
  end if;
  raise notice 'OK  un no-admin recibe resúmenes vacíos';
end $$;

reset role;
rollback;
