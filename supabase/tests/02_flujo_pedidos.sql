-- Prueba del flujo completo de pedidos: crear → confirmar → entregar / cancelar,
-- stock, reparto entre socios, congelamiento de datos y permisos por rol.
--
-- Pensada para la base local (scripts/probar-bd.sh), porque crea usuarios de
-- prueba en auth.users. Todo ocurre en una transacción con ROLLBACK al final.

begin;

-- ─────────────────────────────────────────────────────────────
-- Preparación (como postgres)
-- ─────────────────────────────────────────────────────────────
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'admin@prueba.local'),
  ('00000000-0000-0000-0000-00000000b001', 'intruso@prueba.local');
insert into public.administradores (user_id, nombre)
values ('00000000-0000-0000-0000-00000000a001', 'Admin de prueba');

insert into public.categorias (nombre, slug) values ('Prueba flujo', 'prueba-flujo');
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo)
select c.id, p.nombre, p.slug, p.precio, p.stock, p.activo
from public.categorias c,
     (values ('Producto A', 'pf-a', 10000, 5, true),
             ('Producto B', 'pf-b',  3000, 1, true),
             ('Producto C', 'pf-c',  5000, 5, false)) as p (nombre, slug, precio, stock, activo)
where c.slug = 'prueba-flujo';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, case slug when 'pf-a' then 7000 when 'pf-b' then 1000 else 3000 end, 40
from public.productos where slug like 'pf-%';

-- Socios de prueba 60/40 (se desactivan los existentes)
update public.socios set activo = false;
insert into public.socios (nombre, porcentaje) values ('Socio A', 60), ('Socio B', 40);

-- Ids de los productos de prueba en variables de la transacción (prueba.pf_a, …)
do $$ begin
  perform set_config('prueba.' || replace(slug, '-', '_'), id::text, true)
  from public.productos where slug like 'pf-%';
end $$;

-- ─────────────────────────────────────────────────────────────
-- Visitante anónimo: crear_pedido
-- ─────────────────────────────────────────────────────────────
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
declare
  r jsonb;
  cliente constant jsonb := '{"nombre":"Laura Gómez","ciudad":"Bogotá - Chapinero","notas":"En la tarde","acepta_politica":true}';
begin
  -- Precio distinto al de la BD → no se crea, se informa el cambio
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 1, 'precio', 9000)), cliente);
  if (r ->> 'ok')::boolean or r -> 'cambios' -> 0 ->> 'tipo' <> 'precio'
     or (r -> 'items' -> 0 ->> 'precio_unitario')::int <> 10000 then
    raise exception 'FALLA precio cambiado: %', r;
  end if;
  raise notice 'OK  precio cambiado → no se crea y se informa';

  -- Más cantidad que stock → se ajusta a lo disponible
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 7)), cliente);
  if (r ->> 'ok')::boolean or r -> 'cambios' -> 0 ->> 'tipo' <> 'stock'
     or (r -> 'items' -> 0 ->> 'cantidad')::int <> 5 then
    raise exception 'FALLA stock insuficiente: %', r;
  end if;
  raise notice 'OK  cantidad mayor al stock → se ajusta a 5';

  -- Producto inactivo o inexistente → no disponible
  r := public.crear_pedido(jsonb_build_array(
         jsonb_build_object('producto_id', current_setting('prueba.pf_c')::uuid, 'cantidad', 1),
         jsonb_build_object('producto_id', gen_random_uuid(), 'cantidad', 1)), cliente);
  if (r ->> 'ok')::boolean or jsonb_array_length(r -> 'items') <> 0
     or jsonb_array_length(r -> 'cambios') <> 2
     or exists (select 1 from jsonb_array_elements(r -> 'cambios') c where c ->> 'tipo' <> 'no_disponible') then
    raise exception 'FALLA producto no disponible: %', r;
  end if;
  raise notice 'OK  inactivo / inexistente → no_disponible';

  -- Sin aceptar la política → error
  begin
    perform public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 1)),
                                '{"nombre":"X","ciudad":"Y","acepta_politica":false}');
    raise exception 'FALLA: se creó pedido sin aceptar la política';
  exception when invalid_parameter_value then
    raise notice 'OK  sin aceptar política → error';
  end;

  -- Cantidades inválidas → error
  begin
    perform public.crear_pedido('[{"producto_id":"00000000-0000-0000-0000-000000000000","cantidad":1.5}]', cliente);
    raise exception 'FALLA: aceptó cantidad 1.5';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.crear_pedido('[{"producto_id":"00000000-0000-0000-0000-000000000000","cantidad":"2"}]', cliente);
    raise exception 'FALLA: aceptó cantidad como texto';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.crear_pedido('[{"producto_id":"no-es-uuid","cantidad":1}]', cliente);
    raise exception 'FALLA: aceptó producto_id inválido';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.crear_pedido('[]', cliente);
    raise exception 'FALLA: aceptó carrito vacío';
  exception when invalid_parameter_value then null;
  end;
  raise notice 'OK  datos inválidos → error';

  -- Pedido 1 válido (líneas repetidas se suman): 3×A + 1×B = 33.000; costo 22.000
  r := public.crear_pedido(jsonb_build_array(
         jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 2, 'precio', 10000),
         jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 1, 'precio', 10000),
         jsonb_build_object('producto_id', current_setting('prueba.pf_b')::uuid, 'cantidad', 1, 'precio', 3000)), cliente);
  if not (r ->> 'ok')::boolean or (r ->> 'total')::int <> 33000 or jsonb_array_length(r -> 'items') <> 2
     or r::text like '%costo%' or r ->> 'codigo' !~ '^PED-[0-9]{4,}$' then
    raise exception 'FALLA pedido válido: %', r;
  end if;
  perform set_config('prueba.p1', r ->> 'codigo', true);
  raise notice 'OK  pedido % creado, total 33.000, sin costos en la respuesta', r ->> 'codigo';

  -- Pedido 2: 1×B (la última unidad; ambos pedidos compiten por ella)
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.pf_b')::uuid, 'cantidad', 1)), cliente);
  if not (r ->> 'ok')::boolean then raise exception 'FALLA pedido 2: %', r; end if;
  perform set_config('prueba.p2', r ->> 'codigo', true);

  -- Crear pedidos NO reserva stock (RN-04)
  if (select count(*) from public.productos where slug = 'pf-b' and stock = 1) <> 1 then
    raise exception 'FALLA: crear pedido movió el stock';
  end if;
  raise notice 'OK  crear pedidos no reserva stock';
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Usuario autenticado que NO es admin
-- ─────────────────────────────────────────────────────────────
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000b001","role":"authenticated"}';

do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.producto_costos;
  if v_n <> 0 then raise exception 'FALLA: no-admin ve costos'; end if;
  select count(*) into v_n from public.pedidos;
  if v_n <> 0 then raise exception 'FALLA: no-admin ve pedidos'; end if;
  select count(*) into v_n from public.socios;
  if v_n <> 0 then raise exception 'FALLA: no-admin ve socios'; end if;
  select count(*) into v_n from public.productos where slug = 'pf-c';
  if v_n <> 0 then raise exception 'FALLA: no-admin ve productos inactivos'; end if;
  raise notice 'OK  no-admin no ve costos, pedidos, socios ni inactivos';

  begin
    insert into public.productos (nombre, slug, precio_venta) values ('X', 'x-intruso', 1);
    raise exception 'FALLA: no-admin creó un producto';
  exception when insufficient_privilege then
    raise notice 'OK  no-admin no puede crear productos (RLS)';
  end;

  update public.productos set precio_venta = 1 where slug = 'pf-a';
  get diagnostics v_n = row_count;
  if v_n <> 0 then raise exception 'FALLA: no-admin editó un producto'; end if;
  raise notice 'OK  no-admin no puede editar productos (RLS)';

  begin
    perform public.confirmar_pedido((select id from public.pedidos limit 1));
    raise exception 'FALLA: no-admin confirmó un pedido';
  exception when insufficient_privilege then
    raise notice 'OK  no-admin no puede confirmar pedidos';
  end;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Administrador
-- ─────────────────────────────────────────────────────────────
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}';

do $$
declare
  p1 uuid := (select id from public.pedidos where codigo = current_setting('prueba.p1'));
  p2 uuid := (select id from public.pedidos where codigo = current_setting('prueba.p2'));
  v_n int;
  v_ped public.pedidos;
  v_suma int;
  r jsonb;
begin
  if p1 is null or p2 is null then raise exception 'FALLA: admin no ve los pedidos'; end if;
  if (select count(*) from public.productos where slug = 'pf-c') <> 1
     or (select count(*) from public.producto_costos c join public.productos p on p.id = c.producto_id where p.slug like 'pf-%') <> 3 then
    raise exception 'FALLA: admin no ve inactivos o costos';
  end if;
  raise notice 'OK  admin ve pedidos, costos e inactivos';

  select * into v_ped from public.pedidos where id = p1;
  if v_ped.total_venta <> 33000 or v_ped.total_costo <> 22000 or v_ped.ganancia <> 11000 or v_ped.estado <> 'pendiente' then
    raise exception 'FALLA totales del pedido 1: %', row_to_json(v_ped);
  end if;
  raise notice 'OK  pedido 1: venta 33.000, costo 22.000, ganancia 11.000';

  -- El estado no se puede cambiar a mano (solo vía funciones)
  begin
    update public.pedidos set estado = 'confirmado' where id = p1;
    raise exception 'FALLA: admin cambió el estado sin la función';
  exception when insufficient_privilege then
    raise notice 'OK  el estado del pedido solo cambia vía funciones';
  end;

  -- RN-06: cambiar precio y costo después no altera el pedido
  update public.productos set precio_venta = 12000 where slug = 'pf-a';
  update public.producto_costos set costo = 8000 where producto_id = current_setting('prueba.pf_a')::uuid;
  select count(*) into v_n from public.pedido_items
  where pedido_id = p1 and producto_id = current_setting('prueba.pf_a')::uuid
    and precio_unitario = 10000 and costo_unitario = 7000 and cantidad = 3 and nombre_snapshot = 'Producto A';
  if v_n <> 1 then raise exception 'FALLA RN-06: el ítem cambió'; end if;
  raise notice 'OK  RN-06: el pedido conserva precio y costo originales';

  -- Confirmar pedido 1: descuenta stock y congela reparto 60/40
  r := public.confirmar_pedido(p1);
  if (select stock from public.productos where slug = 'pf-a') <> 2
     or (select stock from public.productos where slug = 'pf-b') <> 0 then
    raise exception 'FALLA: stock tras confirmar';
  end if;
  select coalesce(sum(monto), 0), count(*) into v_suma, v_n from public.pedido_reparto where pedido_id = p1;
  if v_n <> 2 or v_suma <> 11000
     or (select monto from public.pedido_reparto where pedido_id = p1 and socio_nombre = 'Socio A') not between 6599 and 6601 then
    raise exception 'FALLA reparto: % filas, suma %', v_n, v_suma;
  end if;
  if (select confirmado_at from public.pedidos where id = p1) is null then
    raise exception 'FALLA: sin confirmado_at';
  end if;
  raise notice 'OK  confirmar: stock A 5→2, B 1→0; reparto 6.600 / 4.400 = 11.000';

  begin
    perform public.confirmar_pedido(p1);
    raise exception 'FALLA: se confirmó dos veces';
  exception when object_not_in_prerequisite_state then
    raise notice 'OK  no se puede confirmar dos veces';
  end;

  -- Pedido 2 ya no tiene stock: falla y no deja nada a medias
  begin
    perform public.confirmar_pedido(p2);
    raise exception 'FALLA: confirmó sin stock';
  exception when object_not_in_prerequisite_state then
    raise notice 'OK  confirmar sin stock → error: %', sqlerrm;
  end;
  if (select stock from public.productos where slug = 'pf-b') <> 0
     or (select estado from public.pedidos where id = p2) <> 'pendiente'
     or exists (select 1 from public.pedido_reparto where pedido_id = p2) then
    raise exception 'FALLA: el intento fallido dejó cambios';
  end if;
  raise notice 'OK  el stock nunca queda negativo y no quedan cambios a medias';

  begin
    perform public.entregar_pedido(p2);
    raise exception 'FALLA: entregó un pedido pendiente';
  exception when object_not_in_prerequisite_state then
    raise notice 'OK  no se entrega un pedido pendiente';
  end;

  -- Cancelar pedido 1 (confirmado): devuelve stock y borra reparto
  perform public.cancelar_pedido(p1);
  if (select stock from public.productos where slug = 'pf-a') <> 5
     or (select stock from public.productos where slug = 'pf-b') <> 1
     or exists (select 1 from public.pedido_reparto where pedido_id = p1)
     or (select estado from public.pedidos where id = p1) <> 'cancelado'
     or (select cancelado_at from public.pedidos where id = p1) is null then
    raise exception 'FALLA: cancelar pedido confirmado';
  end if;
  raise notice 'OK  cancelar confirmado: devuelve stock A 2→5, B 0→1 y borra reparto';

  -- Ahora el pedido 2 sí se puede confirmar y entregar
  perform public.confirmar_pedido(p2);
  perform public.entregar_pedido(p2);
  select * into v_ped from public.pedidos where id = p2;
  if v_ped.estado <> 'entregado' or v_ped.entregado_at is null
     or (select stock from public.productos where slug = 'pf-b') <> 0 then
    raise exception 'FALLA: confirmar + entregar pedido 2';
  end if;
  raise notice 'OK  pedido 2 confirmado y entregado';

  begin
    perform public.cancelar_pedido(p2);
    raise exception 'FALLA: canceló un pedido entregado';
  exception when object_not_in_prerequisite_state then
    raise notice 'OK  no se cancela un pedido entregado';
  end;

  -- Cancelar pedido pendiente: sin efecto en stock
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 1)),
                           '{"nombre":"Otro","ciudad":"Cali","acepta_politica":true}');
  perform public.cancelar_pedido((select id from public.pedidos where codigo = r ->> 'codigo'));
  if (select stock from public.productos where slug = 'pf-a') <> 5 then
    raise exception 'FALLA: cancelar pendiente movió stock';
  end if;
  raise notice 'OK  cancelar pendiente no mueve stock';

  -- Socios que no suman 100 → no se puede confirmar
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.pf_a')::uuid, 'cantidad', 1)),
                           '{"nombre":"Otro","ciudad":"Cali","acepta_politica":true}');
  begin
    update public.socios set activo = false where nombre = 'Socio B';
    perform public.confirmar_pedido((select id from public.pedidos where codigo = r ->> 'codigo'));
    raise exception 'FALLA: confirmó con socios que suman 60 %%';
  exception when object_not_in_prerequisite_state then
    raise notice 'OK  socios que no suman 100 %% → no se confirma';
  end;

  -- Y la tabla misma rechaza porcentajes que no suman 100 al cerrar la transacción
  begin
    insert into public.socios (nombre, porcentaje) values ('Socio C', 10);
    set constraints public.socios_suman_100 immediate;
    raise exception 'FALLA: la tabla aceptó socios que suman 110 %%';
  exception when check_violation then
    raise notice 'OK  la tabla socios exige que los activos sumen 100 %%';
  end;
end
$$;

rollback;
