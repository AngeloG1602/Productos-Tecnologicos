-- Prueba de lo que agrega el Bloque 4: precio anterior, guardar/duplicar
-- producto, y las políticas de Storage del bucket "productos".

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a002', 'admin4@prueba.local'),
  ('00000000-0000-0000-0000-00000000b002', 'intruso4@prueba.local');
insert into public.administradores (user_id, nombre) values ('00000000-0000-0000-0000-00000000a002', 'Admin');

insert into public.categorias (nombre, slug) values ('Prueba admin', 'prueba-admin');

-- ─────────────────────────────────────────────────────────────
-- Como admin
-- ─────────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000a002","role":"authenticated"}';

do $$
declare
  v_cat uuid := (select id from public.categorias where slug = 'prueba-admin');
  v_id uuid := gen_random_uuid();
  v_dup uuid;
  v_n int;
  v_prod public.productos;
begin
  -- Crear (el id lo genera el panel antes de llamar): costo 12.000, margen 40% → sugerido 16.800 (RN-01)
  v_id := public.guardar_producto(v_id, v_cat, 'Producto Admin', 'producto-admin', 'Descripción', '{}',
                                   12000, 40, 16800, null, 10, true, false);
  select * into v_prod from public.productos where id = v_id;
  if v_prod.nombre <> 'Producto Admin' or v_prod.precio_venta <> 16800 then
    raise exception 'FALLA crear producto: %', row_to_json(v_prod);
  end if;
  select costo, margen_pct into strict v_n, v_n from public.producto_costos where producto_id = v_id; -- solo valida que existe
  raise notice 'OK  guardar_producto crea producto + costo';

  -- Slug repetido → error amigable
  begin
    perform public.guardar_producto(gen_random_uuid(), v_cat, 'Otro', 'producto-admin', '', '{}', 1000, 40, 1400, null, 1, true, false);
    raise exception 'FALLA: aceptó un slug repetido';
  exception when invalid_parameter_value then
    if sqlerrm !~ 'dirección' then raise exception 'FALLA: mensaje inesperado: %', sqlerrm; end if;
    raise notice 'OK  slug repetido → error amigable';
  end;

  -- Precio anterior debe ser mayor al actual
  begin
    perform public.guardar_producto(v_id, v_cat, 'Producto Admin', 'producto-admin', '', '{}', 12000, 40, 16800, 15000, 10, true, false);
    raise exception 'FALLA: aceptó precio_anterior menor';
  exception when invalid_parameter_value then
    raise notice 'OK  precio_anterior debe ser mayor al precio actual';
  end;

  -- Actualizar: sube el precio anterior válido, baja el precio (queda bajo costo) y cambia el costo
  v_id := public.guardar_producto(v_id, v_cat, 'Producto Admin', 'producto-admin', '', '{}', 12000, 8, 13000, 20000, 10, true, true);
  select * into v_prod from public.productos where id = v_id;
  if v_prod.precio_anterior <> 20000 or v_prod.destacado <> true or v_prod.precio_venta <> 13000 then
    raise exception 'FALLA actualizar producto: %', row_to_json(v_prod);
  end if;
  raise notice 'OK  guardar_producto actualiza (mismo id, no crea uno nuevo)';

  -- Duplicar: copia inactiva, stock 0, mismo costo/margen, slug distinto
  v_dup := public.duplicar_producto(v_id);
  select * into v_prod from public.productos where id = v_dup;
  if v_prod.slug <> 'producto-admin-copia' or v_prod.activo <> false or v_prod.stock <> 0
     or v_prod.nombre <> 'Producto Admin (copia)' or v_prod.precio_venta <> 13000 then
    raise exception 'FALLA duplicar_producto: %', row_to_json(v_prod);
  end if;
  if (select margen_pct from public.producto_costos where producto_id = v_dup) <> 8 then
    raise exception 'FALLA: la copia no llevó el costo/margen';
  end if;
  -- Duplicar la copia otra vez: no choca de slug (usa -copia-2)
  perform public.duplicar_producto(v_dup);
  if (select count(*) from public.productos where slug like 'producto-admin-copia%') <> 2 then
    raise exception 'FALLA: duplicar la copia no generó un slug distinto';
  end if;
  raise notice 'OK  duplicar_producto: copia inactiva, stock 0, mismo costo/margen, sin chocar slugs';

  -- Storage: el admin puede subir, actualizar y borrar en el bucket "productos"
  insert into storage.objects (bucket_id, name) values ('productos', v_id || '/1.webp');
  update storage.objects set name = v_id || '/1.webp' where bucket_id = 'productos' and name = v_id || '/1.webp';
  delete from storage.objects where bucket_id = 'productos' and name = v_id || '/1.webp';
  raise notice 'OK  admin sube/actualiza/borra imágenes del bucket productos';

  -- No puede escribir en otro bucket que no sea "productos"
  begin
    insert into storage.objects (bucket_id, name) values ('otro-bucket', 'x');
    raise exception 'FALLA: admin escribió fuera del bucket productos';
  exception when insufficient_privilege then
    raise notice 'OK  ni el admin puede escribir fuera del bucket productos';
  end;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Usuario autenticado que NO es admin
-- ─────────────────────────────────────────────────────────────
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-00000000b002","role":"authenticated"}';

do $$
begin
  begin
    perform public.guardar_producto(gen_random_uuid(), null, 'X', 'x-intruso', '', '{}', 1000, 40, 1400, null, 1, true, false);
    raise exception 'FALLA: no-admin pudo crear un producto vía guardar_producto';
  exception when insufficient_privilege then
    raise notice 'OK  no-admin no puede ejecutar guardar_producto';
  end;

  begin
    perform public.duplicar_producto((select id from public.productos where slug = 'producto-admin'));
    raise exception 'FALLA: no-admin pudo duplicar un producto';
  exception when insufficient_privilege then
    raise notice 'OK  no-admin no puede ejecutar duplicar_producto';
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('productos', 'x/1.webp');
    raise exception 'FALLA: no-admin pudo subir una imagen';
  exception when insufficient_privilege then
    raise notice 'OK  no-admin no puede subir imágenes';
  end;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Visitante anónimo
-- ─────────────────────────────────────────────────────────────
reset role;
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

do $$
declare
  v_n int;
begin
  -- Puede ver las imágenes (bucket público)
  select count(*) into v_n from storage.objects where bucket_id = 'productos';
  if v_n is null then raise exception 'FALLA: anónimo no puede leer el bucket productos'; end if;
  raise notice 'OK  anónimo puede leer el bucket productos (lectura pública)';

  begin
    insert into storage.objects (bucket_id, name) values ('productos', 'x/1.webp');
    raise exception 'FALLA: anónimo pudo subir una imagen';
  exception when insufficient_privilege then
    raise notice 'OK  anónimo no puede subir imágenes';
  end;

  begin
    perform public.guardar_producto(gen_random_uuid(), null, 'X', 'x-anon', '', '{}', 1000, 40, 1400, null, 1, true, false);
    raise exception 'FALLA: anónimo pudo ejecutar guardar_producto';
  exception when insufficient_privilege then
    raise notice 'OK  anónimo no puede ejecutar guardar_producto';
  end;
end
$$;

rollback;
