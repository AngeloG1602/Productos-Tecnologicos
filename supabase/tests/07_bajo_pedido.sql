-- Productos bajo pedido: se pueden pedir sin stock, y confirmar/cancelar NUNCA dejan stock
-- negativo ni "inventan" stock. Una sola transacción con ROLLBACK al final.
begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a007', 'admin7@prueba.local');
insert into public.administradores (user_id, nombre) values ('00000000-0000-0000-0000-00000000a007', 'Admin 7');
update public.socios set activo = false;
insert into public.socios (nombre, porcentaje) values ('Socio Único', 100);

insert into public.categorias (nombre, slug) values ('Prueba bajo pedido', 'prueba-bp');
insert into public.productos (categoria_id, nombre, slug, precio_venta, stock, activo, bajo_pedido)
select c.id, p.nombre, p.slug, p.precio, p.stock, true, p.bp
from public.categorias c,
     (values ('Bajo pedido X', 'bp-x', 50000, 0, true),
             ('Normal Y',      'bp-y', 10000, 2, false)) as p (nombre, slug, precio, stock, bp)
where c.slug = 'prueba-bp';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, 30000, 40 from public.productos where slug = 'bp-x';
insert into public.producto_costos (producto_id, costo, margen_pct)
select id, 6000, 40 from public.productos where slug = 'bp-y';

do $$ begin
  perform set_config('prueba.bp_x', (select id::text from public.productos where slug = 'bp-x'), true);
  perform set_config('prueba.bp_y', (select id::text from public.productos where slug = 'bp-y'), true);
end $$;

-- Visitante anónimo: crea un pedido con un bajo pedido sin stock + un producto normal
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
declare
  r jsonb;
  cliente constant jsonb := '{"nombre":"Laura","ciudad":"Ocaña - Centro","acepta_politica":true}';
begin
  r := public.crear_pedido(jsonb_build_array(
         jsonb_build_object('producto_id', current_setting('prueba.bp_x')::uuid, 'cantidad', 3),
         jsonb_build_object('producto_id', current_setting('prueba.bp_y')::uuid, 'cantidad', 1)), cliente);
  if not (r ->> 'ok')::boolean then raise exception 'FALLA: el bajo pedido sin stock debe poder pedirse: %', r; end if;
  if r ->> 'total' <> '160000' then raise exception 'FALLA total (3 x 50000 + 10000): %', r; end if;
  if not exists (select 1 from jsonb_array_elements(r -> 'items') i
                 where i ->> 'nombre' = 'Bajo pedido X' and (i ->> 'bajo_pedido')::boolean) then
    raise exception 'FALLA: la respuesta no marca el ítem bajo pedido: %', r;
  end if;
  raise notice 'OK  bajo pedido sin stock se puede pedir (cantidad 3) y la respuesta lo marca';

  -- El producto normal sigue limitado por su stock
  r := public.crear_pedido(jsonb_build_array(jsonb_build_object('producto_id', current_setting('prueba.bp_y')::uuid, 'cantidad', 5)), cliente);
  if (r ->> 'ok')::boolean or (r -> 'items' -> 0 ->> 'cantidad')::int <> 2 then
    raise exception 'FALLA: el producto normal debe seguir limitado por stock: %', r;
  end if;
  raise notice 'OK  el producto normal sigue limitado por su stock';
end $$;

-- Admin: confirmar descuenta solo el normal; el bajo pedido no toca stock
reset role;
do $$
begin
  if not (select bajo_pedido from public.pedido_items where nombre_snapshot = 'Bajo pedido X') then
    raise exception 'FALLA: pedido_items no congeló bajo_pedido';
  end if;
  raise notice 'OK  el pedido congela bajo_pedido por ítem';
end $$;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a007","role":"authenticated"}';

do $$
declare
  v_pedido uuid := (select id from public.pedidos order by created_at desc limit 1);
begin
  perform public.confirmar_pedido(v_pedido);
  if (select stock from public.productos where slug = 'bp-x') <> 0 then
    raise exception 'FALLA: confirmar tocó el stock del bajo pedido';
  end if;
  if (select stock from public.productos where slug = 'bp-y') <> 1 then
    raise exception 'FALLA: confirmar no descontó el producto normal';
  end if;
  raise notice 'OK  confirmar: normal 2→1, bajo pedido sigue en 0 (nunca negativo)';

  -- El admin cambia el producto a "normal" DESPUÉS del pedido: cancelar se guía por lo congelado
  update public.productos set bajo_pedido = false where slug = 'bp-x';
  perform public.cancelar_pedido(v_pedido);
  if (select stock from public.productos where slug = 'bp-x') <> 0 then
    raise exception 'FALLA: cancelar inventó stock para un ítem que era bajo pedido';
  end if;
  if (select stock from public.productos where slug = 'bp-y') <> 2 then
    raise exception 'FALLA: cancelar no devolvió el stock del normal';
  end if;
  raise notice 'OK  cancelar: devuelve solo lo que se descontó (normal 1→2, bajo pedido sigue en 0)';
end $$;

-- guardar_producto guarda y duplicar copia la marca
do $$
declare
  v_id uuid := gen_random_uuid();
  v_copia uuid;
begin
  perform public.guardar_producto(v_id, null, 'Encargo Z', 'bp-z', '', '{}', 1000, 40, 1400, null, 0, true, false, null, true);
  if not (select bajo_pedido from public.productos where id = v_id) then
    raise exception 'FALLA: guardar_producto no guardó bajo_pedido';
  end if;
  v_copia := public.duplicar_producto(v_id);
  if not (select bajo_pedido from public.productos where id = v_copia) then
    raise exception 'FALLA: duplicar_producto no copió bajo_pedido';
  end if;
  raise notice 'OK  guardar_producto guarda y duplicar_producto copia la marca bajo pedido';
end $$;

reset role;
rollback;
