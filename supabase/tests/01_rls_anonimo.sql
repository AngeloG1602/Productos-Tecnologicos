-- Verificación del criterio de B1:
--   "Un usuario anónimo puede leer productos pero no costos ni pedidos."
--
-- Se puede ejecutar en el SQL Editor de Supabase o con psql.
-- Crea sus propios datos dentro de una transacción y hace ROLLBACK al final:
-- no deja rastro. Si algo falla, se detiene con un error que dice qué.

begin;

-- Datos propios de la prueba (como postgres)
insert into public.categorias (nombre, slug) values ('Prueba RLS', 'prueba-rls');
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo)
select id, 'Activo RLS', 'prueba-rls-activo', 10000, 5, true from public.categorias where slug = 'prueba-rls';
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo)
select id, 'Inactivo RLS', 'prueba-rls-inactivo', 10000, 5, false from public.categorias where slug = 'prueba-rls';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, 7000, 40 from public.productos where slug like 'prueba-rls-%';

-- A partir de aquí, somos un visitante anónimo
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
declare
  v_n int;
  v_json jsonb;
  v_tabla text;
begin
  -- 1. Puede leer categorías y productos activos
  select count(*) into v_n from public.categorias where slug = 'prueba-rls';
  if v_n <> 1 then raise exception 'FALLA: anónimo no ve categorías'; end if;

  select count(*) into v_n from public.productos where slug = 'prueba-rls-activo';
  if v_n <> 1 then raise exception 'FALLA: anónimo no ve productos activos'; end if;
  raise notice 'OK  anónimo lee categorías y productos activos';

  -- 2. No ve productos inactivos
  select count(*) into v_n from public.productos where slug = 'prueba-rls-inactivo';
  if v_n <> 0 then raise exception 'FALLA: anónimo ve productos inactivos'; end if;
  raise notice 'OK  anónimo no ve productos inactivos';

  -- 3. No puede leer tablas privadas (costos, pedidos, socios, configuración…)
  foreach v_tabla in array array[
    'producto_costos', 'pedidos', 'pedido_items', 'pedido_reparto',
    'socios', 'configuracion', 'administradores'
  ] loop
    begin
      execute format('select count(*) from public.%I', v_tabla) into v_n;
      raise exception 'FALLA: anónimo pudo leer %', v_tabla;
    exception when insufficient_privilege then
      raise notice 'OK  anónimo no puede leer %', v_tabla;
    end;
  end loop;

  -- 4. No puede escribir en el catálogo
  begin
    update public.productos set precio_venta = 1 where slug = 'prueba-rls-activo';
    raise exception 'FALLA: anónimo pudo editar productos';
  exception when insufficient_privilege then
    raise notice 'OK  anónimo no puede editar productos';
  end;

  begin
    insert into public.categorias (nombre, slug) values ('X', 'x-anonimo');
    raise exception 'FALLA: anónimo pudo crear categorías';
  exception when insufficient_privilege then
    raise notice 'OK  anónimo no puede crear categorías';
  end;

  -- 5. No puede confirmar ni cancelar pedidos
  begin
    perform public.confirmar_pedido(gen_random_uuid());
    raise exception 'FALLA: anónimo pudo ejecutar confirmar_pedido';
  exception when insufficient_privilege then
    raise notice 'OK  anónimo no puede ejecutar confirmar_pedido';
  end;

  begin
    perform public.cancelar_pedido(gen_random_uuid());
    raise exception 'FALLA: anónimo pudo ejecutar cancelar_pedido';
  exception when insufficient_privilege then
    raise notice 'OK  anónimo no puede ejecutar cancelar_pedido';
  end;

  -- 6. Funciones nuevas no quedan ejecutables por defecto
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname not in ('es_admin', 'configuracion_publica', 'crear_pedido')
  ) then
    raise exception 'FALLA: hay funciones de public ejecutables por anónimo que no deberían';
  end if;
  raise notice 'OK  anónimo solo puede ejecutar es_admin, configuracion_publica y crear_pedido';

  -- 7. La configuración pública sí está disponible, sin margen ni redondeo
  select to_jsonb(c) into v_json from public.configuracion_publica() c;
  if v_json is null or v_json ? 'margen_default' or v_json ? 'redondeo' then
    raise exception 'FALLA: configuracion_publica() no devuelve lo esperado: %', v_json;
  end if;
  raise notice 'OK  configuracion_publica() sin datos privados: %', v_json;

  -- 8. Puede crear un pedido, pero luego no puede leerlo
  v_json := public.crear_pedido(
    jsonb_build_array(jsonb_build_object(
      'producto_id', (select id from public.productos where slug = 'prueba-rls-activo'),
      'cantidad', 1, 'precio', 10000)),
    '{"nombre":"Prueba","ciudad":"Bogotá","acepta_politica":true}'
  );
  if not (v_json ->> 'ok')::boolean or v_json::text like '%costo%' then
    raise exception 'FALLA: crear_pedido como anónimo: %', v_json;
  end if;
  raise notice 'OK  anónimo crea pedido % sin recibir costos', v_json ->> 'codigo';
end
$$;

rollback;
