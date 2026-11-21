-- Ventana emergente de promoción de la tienda (una sola, editable desde el panel).
-- Una fila fija (id = 1), igual que "configuracion". El público NO lee la tabla: usa
-- promocion_activa(), que solo devuelve algo si la promoción está activa, dentro de sus
-- fechas y (si apunta a un producto) el producto sigue activo. Nada de costos ni márgenes.

create table public.promocion (
  id          int primary key default 1 check (id = 1),
  activa      bool not null default false,
  titulo      text not null default '' check (length(btrim(titulo)) <= 80),
  texto       text not null default '' check (length(texto) <= 240),
  boton_texto text not null default 'Ver ahora' check (length(btrim(boton_texto)) between 1 and 30),
  producto_id uuid references public.productos (id) on delete set null,
  desde       timestamptz,
  hasta       timestamptz,
  updated_at  timestamptz not null default now(),
  check (desde is null or hasta is null or hasta > desde)
);

insert into public.promocion (id) values (1);

create trigger promocion_updated_at
  before update on public.promocion
  for each row execute function public.tocar_updated_at();

alter table public.promocion enable row level security;

grant select, update on public.promocion to authenticated;

create policy "promocion: admins leen"
  on public.promocion for select to authenticated
  using ((select public.es_admin()));
create policy "promocion: admins editan"
  on public.promocion for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Lo que ve el público: una fila o ninguna. updated_at sirve de "versión": si el admin cambia
-- la promoción, a quien ya la cerró se le vuelve a mostrar.
create function public.promocion_activa()
returns table (
  titulo          text,
  texto           text,
  boton_texto     text,
  version         timestamptz,
  producto_slug   text,
  producto_nombre text,
  producto_imagen text,
  precio_venta    int,
  precio_anterior int,
  stock           int
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.titulo, p.texto, p.boton_texto, p.updated_at,
         pr.slug, pr.nombre, pr.imagenes[1], pr.precio_venta, pr.precio_anterior, pr.stock
  from public.promocion p
  left join public.productos pr on pr.id = p.producto_id and pr.activo
  where p.id = 1
    and p.activa
    and (p.desde is null or p.desde <= now())
    and (p.hasta is null or p.hasta >= now())
    -- con producto elegido, el producto debe seguir activo; sin producto, debe haber un título
    and ((p.producto_id is not null and pr.id is not null) or (p.producto_id is null and btrim(p.titulo) <> ''))
$$;

revoke execute on function public.promocion_activa() from public;
grant execute on function public.promocion_activa() to anon, authenticated;
