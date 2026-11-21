-- Promoción emergente: el público solo ve la activa y vigente; solo admins la editan.
-- Se corre después de las migraciones (ver scripts/probar-bd.sh).
begin;

do $$
declare
  v_prod uuid;
  n int;
begin
  -- Por defecto está apagada: el público no recibe nada.
  select count(*) into n from public.promocion_activa();
  if n <> 0 then raise exception 'FALLA: la promoción apagada no debe verse'; end if;
  raise notice 'OK  promoción apagada: no se ve';

  -- Activa, solo texto
  update public.promocion set activa = true, titulo = 'Oferta', texto = 'Solo hoy' where id = 1;
  select count(*) into n from public.promocion_activa();
  if n <> 1 then raise exception 'FALLA: la promoción activa con título debe verse'; end if;

  -- Fuera de fechas
  update public.promocion set desde = now() + interval '1 day' where id = 1;
  select count(*) into n from public.promocion_activa();
  if n <> 0 then raise exception 'FALLA: promoción que aún no empieza no debe verse'; end if;
  update public.promocion set desde = now() - interval '2 days', hasta = now() - interval '1 day' where id = 1;
  select count(*) into n from public.promocion_activa();
  if n <> 0 then raise exception 'FALLA: promoción vencida no debe verse'; end if;
  raise notice 'OK  respeta fechas de inicio y fin';

  -- Con producto: si el producto se desactiva, deja de verse
  update public.promocion set desde = null, hasta = null where id = 1;
  select id into v_prod from public.productos where activo limit 1;
  update public.promocion set producto_id = v_prod where id = 1;
  select count(*) into n from public.promocion_activa();
  if n <> 1 then raise exception 'FALLA: promoción con producto activo debe verse'; end if;
  update public.productos set activo = false where id = v_prod;
  select count(*) into n from public.promocion_activa();
  if n <> 0 then raise exception 'FALLA: promoción de un producto inactivo no debe verse'; end if;
  raise notice 'OK  promoción de producto inactivo no se muestra';

  -- Rango de fechas inválido
  begin
    update public.promocion set desde = now(), hasta = now() - interval '1 day' where id = 1;
    raise exception 'FALLA: aceptó hasta anterior a desde';
  exception when check_violation then
    raise notice 'OK  rechaza fechas invertidas';
  end;
end $$;

-- Un visitante anónimo no ve ni edita la tabla (RLS), solo usa la función.
update public.promocion set activa = true, titulo = 'Oferta', producto_id = null, desde = null, hasta = null where id = 1;
set local role anon;
do $$
declare
  n int;
begin
  select count(*) into n from public.promocion;
  if n <> 0 then raise exception 'FALLA: anon leyó % fila(s) de promocion', n; end if;
  raise notice 'OK  anon no ve filas de la tabla promocion';

  begin
    update public.promocion set titulo = 'Hackeado' where id = 1;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FALLA: anon editó promocion'; end if;
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'OK  anon no edita la promoción';

  select count(*) into n from public.promocion_activa();
  if n <> 1 then raise exception 'FALLA: anon no recibió la promoción activa por la función'; end if;
  raise notice 'OK  anon recibe la promoción activa solo por promocion_activa()';
end $$;
reset role;

rollback;
