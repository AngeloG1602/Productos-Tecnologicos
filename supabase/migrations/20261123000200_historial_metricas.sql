-- Ola 3: historial de cambios de productos y métricas de uso (sin datos personales).

-- ─────────────────────────────────────────────────────────────
-- 1) Historial de cambios de precio, costo, stock, estado y "bajo pedido"
-- ─────────────────────────────────────────────────────────────
-- Un trigger anota cada cambio con fecha y quién lo hizo. El stock que mueven los pedidos
-- (confirmar/cancelar) NO se anota: esas funciones marcan app.origen = 'pedido'.

create table public.historial_productos (
  id              bigint generated always as identity primary key,
  producto_id     uuid references public.productos (id) on delete cascade,
  producto_nombre text not null,
  campo           text not null check (campo in ('precio_venta', 'costo', 'stock', 'activo', 'bajo_pedido')),
  anterior        text,
  nuevo           text,
  usuario_id      uuid,
  created_at      timestamptz not null default now()
);

create index historial_productos_producto_idx on public.historial_productos (producto_id, created_at desc);

alter table public.historial_productos enable row level security;
grant select on public.historial_productos to authenticated;
create policy "historial: solo admins leen"
  on public.historial_productos for select to authenticated
  using ((select public.es_admin()));

create function public.anotar_historial_producto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_desde_pedido boolean := coalesce(current_setting('app.origen', true), '') = 'pedido';
begin
  if new.precio_venta is distinct from old.precio_venta then
    insert into public.historial_productos (producto_id, producto_nombre, campo, anterior, nuevo, usuario_id)
    values (new.id, new.nombre, 'precio_venta', old.precio_venta::text, new.precio_venta::text, auth.uid());
  end if;
  if new.stock is distinct from old.stock and not v_desde_pedido then
    insert into public.historial_productos (producto_id, producto_nombre, campo, anterior, nuevo, usuario_id)
    values (new.id, new.nombre, 'stock', old.stock::text, new.stock::text, auth.uid());
  end if;
  if new.activo is distinct from old.activo then
    insert into public.historial_productos (producto_id, producto_nombre, campo, anterior, nuevo, usuario_id)
    values (new.id, new.nombre, 'activo', old.activo::text, new.activo::text, auth.uid());
  end if;
  if new.bajo_pedido is distinct from old.bajo_pedido then
    insert into public.historial_productos (producto_id, producto_nombre, campo, anterior, nuevo, usuario_id)
    values (new.id, new.nombre, 'bajo_pedido', old.bajo_pedido::text, new.bajo_pedido::text, auth.uid());
  end if;
  return new;
end;
$$;

create trigger productos_historial
  after update on public.productos
  for each row execute function public.anotar_historial_producto();

create function public.anotar_historial_costo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.costo is distinct from old.costo then
    insert into public.historial_productos (producto_id, producto_nombre, campo, anterior, nuevo, usuario_id)
    select new.producto_id, p.nombre, 'costo', old.costo::text, new.costo::text, auth.uid()
    from public.productos p where p.id = new.producto_id;
  end if;
  return new;
end;
$$;

create trigger producto_costos_historial
  after update on public.producto_costos
  for each row execute function public.anotar_historial_costo();

revoke execute on function public.anotar_historial_producto(), public.anotar_historial_costo()
  from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2) Métricas de uso: contadores por día, sin cookies ni datos personales
-- ─────────────────────────────────────────────────────────────
-- Solo se suma 1 a un contador (día + tipo de evento + producto opcional). No se guarda IP,
-- dispositivo ni nada que identifique a una persona. El público solo puede SUMAR por la función
-- registrar_evento(); no puede leer la tabla. Un visitante malicioso podría inflar los números
-- (no puede leer ni borrar nada): son cifras orientativas, no contables.

create table public.metricas_dia (
  dia         date not null,
  tipo        text not null check (tipo in
    ('vista_inicio', 'vista_producto', 'agregar_carrito', 'clic_whatsapp', 'ver_promocion', 'clic_promocion')),
  producto_id uuid not null default '00000000-0000-0000-0000-000000000000',
  cantidad    int not null default 0 check (cantidad >= 0),
  primary key (dia, tipo, producto_id)
);

alter table public.metricas_dia enable row level security;
grant select on public.metricas_dia to authenticated;
create policy "metricas: solo admins leen"
  on public.metricas_dia for select to authenticated
  using ((select public.es_admin()));

create function public.registrar_evento(p_tipo text, p_producto uuid default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_producto uuid := '00000000-0000-0000-0000-000000000000';
begin
  -- Tipo desconocido: se ignora en silencio (nunca se rompe la tienda por una métrica)
  if p_tipo not in ('vista_inicio', 'vista_producto', 'agregar_carrito', 'clic_whatsapp', 'ver_promocion', 'clic_promocion') then
    return;
  end if;
  if p_producto is not null then
    if not exists (select 1 from public.productos where id = p_producto) then
      return;
    end if;
    v_producto := p_producto;
  end if;

  insert into public.metricas_dia (dia, tipo, producto_id, cantidad)
  values ((now() at time zone 'America/Bogota')::date, p_tipo, v_producto, 1)
  on conflict (dia, tipo, producto_id) do update set cantidad = public.metricas_dia.cantidad + 1;
end;
$$;

revoke execute on function public.registrar_evento(text, uuid) from public, anon, authenticated;
grant execute on function public.registrar_evento(text, uuid) to anon, authenticated;

-- Resúmenes para el panel (respetan RLS: un no-admin recibe vacío).
create function public.metricas_resumen(p_desde date, p_hasta date)
returns table (tipo text, total bigint)
language sql
stable
set search_path = ''
as $$
  select m.tipo, sum(m.cantidad)::bigint
  from public.metricas_dia m
  where m.dia between p_desde and p_hasta
  group by m.tipo
$$;

create function public.metricas_top_productos(p_desde date, p_hasta date, p_limite int default 5)
returns table (producto_id uuid, nombre text, vistas bigint, agregados bigint)
language sql
stable
set search_path = ''
as $$
  select m.producto_id,
         p.nombre,
         coalesce(sum(m.cantidad) filter (where m.tipo = 'vista_producto'), 0)::bigint as vistas,
         coalesce(sum(m.cantidad) filter (where m.tipo = 'agregar_carrito'), 0)::bigint as agregados
  from public.metricas_dia m
  join public.productos p on p.id = m.producto_id
  where m.dia between p_desde and p_hasta
    and m.tipo in ('vista_producto', 'agregar_carrito')
  group by m.producto_id, p.nombre
  order by vistas desc, agregados desc
  limit greatest(1, least(coalesce(p_limite, 5), 20))
$$;

revoke execute on function public.metricas_resumen(date, date), public.metricas_top_productos(date, date, int)
  from public, anon, authenticated;
grant execute on function public.metricas_resumen(date, date), public.metricas_top_productos(date, date, int)
  to authenticated;
