-- B1 · Migración 2: seguridad
-- RLS en TODAS las tablas con políticas explícitas + permisos (GRANT) mínimos.
-- Regla general:
--   anon           → solo categorías, productos activos y configuración pública (vía función)
--   authenticated  → igual que anon, salvo que sea admin (tabla administradores)
--   admin          → todo, pero el estado de los pedidos solo cambia vía RPC

-- ─────────────────────────────────────────────────────────────
-- ¿El usuario actual es administrador?
-- ─────────────────────────────────────────────────────────────

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.administradores where user_id = auth.uid()
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- Activar RLS
-- ─────────────────────────────────────────────────────────────

alter table public.categorias      enable row level security;
alter table public.productos       enable row level security;
alter table public.producto_costos enable row level security;
alter table public.socios          enable row level security;
alter table public.pedidos         enable row level security;
alter table public.pedido_items    enable row level security;
alter table public.pedido_reparto  enable row level security;
alter table public.configuracion   enable row level security;
alter table public.administradores enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Permisos por tabla (defensa en profundidad: además de RLS)
-- ─────────────────────────────────────────────────────────────

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Lectura pública del catálogo
grant select on public.categorias, public.productos to anon, authenticated;

-- Escritura del catálogo (RLS la limita a admins)
grant insert, update, delete on public.categorias, public.productos to authenticated;
grant select, insert, update, delete on public.producto_costos, public.socios to authenticated;

-- Pedidos: solo lectura para admins. Crear/confirmar/cancelar/entregar va por RPC.
grant select on public.pedidos, public.pedido_items, public.pedido_reparto to authenticated;

-- Configuración: lectura y edición para admins (lo público va por configuracion_publica()).
grant select, update on public.configuracion to authenticated;

-- Administradores: cada usuario puede ver si él mismo es admin.
grant select on public.administradores to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Políticas
-- ─────────────────────────────────────────────────────────────
-- Se usa (select public.es_admin()) para que Postgres lo evalúe una vez por consulta.

-- categorias
create policy "categorias: lectura pública"
  on public.categorias for select to anon, authenticated
  using (true);
create policy "categorias: admins insertan"
  on public.categorias for insert to authenticated
  with check ((select public.es_admin()));
create policy "categorias: admins editan"
  on public.categorias for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "categorias: admins eliminan"
  on public.categorias for delete to authenticated
  using ((select public.es_admin()));

-- productos (los inactivos solo los ven los admins, RN-03)
create policy "productos: lectura de activos o admin"
  on public.productos for select to anon, authenticated
  using (activo or (select public.es_admin()));
create policy "productos: admins insertan"
  on public.productos for insert to authenticated
  with check ((select public.es_admin()));
create policy "productos: admins editan"
  on public.productos for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "productos: admins eliminan"
  on public.productos for delete to authenticated
  using ((select public.es_admin()));

-- producto_costos (SOLO admins)
create policy "producto_costos: solo admins"
  on public.producto_costos for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- socios (SOLO admins)
create policy "socios: solo admins"
  on public.socios for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- pedidos, ítems y reparto (SOLO admins, solo lectura)
create policy "pedidos: admins leen"
  on public.pedidos for select to authenticated
  using ((select public.es_admin()));
create policy "pedido_items: admins leen"
  on public.pedido_items for select to authenticated
  using ((select public.es_admin()));
create policy "pedido_reparto: admins leen"
  on public.pedido_reparto for select to authenticated
  using ((select public.es_admin()));

-- configuracion (SOLO admins; el público usa configuracion_publica())
create policy "configuracion: admins leen"
  on public.configuracion for select to authenticated
  using ((select public.es_admin()));
create policy "configuracion: admins editan"
  on public.configuracion for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- administradores
create policy "administradores: ver el propio registro o admin"
  on public.administradores for select to authenticated
  using (user_id = (select auth.uid()) or (select public.es_admin()));

-- ─────────────────────────────────────────────────────────────
-- Configuración pública
-- ─────────────────────────────────────────────────────────────
-- Solo los campos que necesita la tienda. margen_default y redondeo no salen.

create or replace function public.configuracion_publica()
returns table (whatsapp_numero text, umbral_stock_bajo int, texto_envio text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.whatsapp_numero, c.umbral_stock_bajo, c.texto_envio
  from public.configuracion c
  where c.id = 1
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos de ejecución de funciones
-- ─────────────────────────────────────────────────────────────
-- Postgres da EXECUTE a PUBLIC por defecto y Supabase además a anon/authenticated:
-- se quita a todo y se concede solo lo necesario.

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.configuracion_publica() to anon, authenticated;

-- Las funciones que se creen de aquí en adelante tampoco quedan ejecutables
-- por defecto: cada migración concede EXECUTE explícitamente.
-- (El permiso de PUBLIC es global en Postgres, por eso se quita sin "in schema".)
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges revoke execute on functions from public;
