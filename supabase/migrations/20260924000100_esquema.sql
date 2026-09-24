-- B1 · Migración 1: esquema base
-- Tablas, restricciones y triggers del modelo de datos (ESPECIFICACION.md §5).
-- Montos en pesos colombianos enteros (int).

-- ─────────────────────────────────────────────────────────────
-- Utilidades
-- ─────────────────────────────────────────────────────────────

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Catálogo
-- ─────────────────────────────────────────────────────────────

create table public.categorias (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(btrim(nombre)) between 1 and 60),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  orden      int  not null default 0,
  created_at timestamptz not null default now()
);

create table public.productos (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.categorias (id) on delete set null,
  nombre       text not null check (length(btrim(nombre)) between 1 and 120),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descripcion  text not null default '',
  imagenes     text[] not null default '{}' check (cardinality(imagenes) <= 4), -- RF-11
  precio_venta int  not null check (precio_venta >= 0),
  stock        int  not null default 0 check (stock >= 0),
  activo       bool not null default true,
  destacado    bool not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index productos_categoria_idx on public.productos (categoria_id);
create index productos_activo_idx on public.productos (activo) where activo;

create trigger productos_updated_at
  before update on public.productos
  for each row execute function public.tocar_updated_at();

-- Costo y margen: tabla separada, SOLO admins (regla 1 de CLAUDE.md).
create table public.producto_costos (
  producto_id uuid primary key references public.productos (id) on delete cascade,
  costo       int not null check (costo >= 0),
  margen_pct  numeric(6, 2) not null check (margen_pct >= 0)
);

-- ─────────────────────────────────────────────────────────────
-- Socios (RN-07)
-- ─────────────────────────────────────────────────────────────

create table public.socios (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(btrim(nombre)) between 1 and 80),
  porcentaje numeric(5, 2) not null check (porcentaje > 0 and porcentaje <= 100),
  activo     bool not null default true,
  created_at timestamptz not null default now()
);

-- Los porcentajes de los socios activos deben sumar exactamente 100 %.
-- Se valida al final de la transacción (diferido), para poder editar
-- varios socios juntos. Sin socios activos no se exige nada.
create or replace function public.validar_porcentajes_socios()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total numeric;
begin
  select coalesce(sum(porcentaje), 0) into v_total
  from public.socios
  where activo;

  if v_total <> 0 and v_total <> 100 then
    raise exception 'Los porcentajes de los socios activos deben sumar 100 %% (suman %).', v_total
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger socios_suman_100
  after insert or update or delete on public.socios
  deferrable initially deferred
  for each row execute function public.validar_porcentajes_socios();

-- ─────────────────────────────────────────────────────────────
-- Pedidos (RN-05, RN-06, RN-07)
-- ─────────────────────────────────────────────────────────────

create type public.pedido_estado as enum ('pendiente', 'confirmado', 'entregado', 'cancelado');

create sequence public.pedidos_codigo_seq;

-- PED-0001, PED-0002, … (desde PED-10000 simplemente crece el número de dígitos)
create or replace function public.generar_codigo_pedido()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'PED-' || lpad(n::text, greatest(4, length(n::text)), '0')
  from (select nextval('public.pedidos_codigo_seq') as n) s
$$;

create table public.pedidos (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique default public.generar_codigo_pedido(),
  estado         public.pedido_estado not null default 'pendiente',
  cliente_nombre text not null check (length(btrim(cliente_nombre)) between 1 and 80),
  cliente_ciudad text not null check (length(btrim(cliente_ciudad)) between 1 and 120),
  notas          text not null default '' check (length(notas) <= 500),
  total_venta    int not null check (total_venta >= 0),
  total_costo    int not null check (total_costo >= 0),
  ganancia       int not null,
  created_at     timestamptz not null default now(),
  confirmado_at  timestamptz,
  entregado_at   timestamptz,
  cancelado_at   timestamptz
);

create index pedidos_estado_idx on public.pedidos (estado, created_at desc);
create index pedidos_confirmado_at_idx on public.pedidos (confirmado_at) where confirmado_at is not null;

-- Ítems congelados al crear el pedido (RN-06).
-- Si luego se elimina el producto, el ítem conserva su nombre y precios.
create table public.pedido_items (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos (id) on delete cascade,
  producto_id     uuid references public.productos (id) on delete set null,
  nombre_snapshot text not null,
  cantidad        int  not null check (cantidad > 0),
  precio_unitario int  not null check (precio_unitario >= 0),
  costo_unitario  int  not null check (costo_unitario >= 0)
);

create index pedido_items_pedido_idx on public.pedido_items (pedido_id);
create index pedido_items_producto_idx on public.pedido_items (producto_id);

-- Reparto congelado al confirmar el pedido (RN-07).
create table public.pedido_reparto (
  id           uuid primary key default gen_random_uuid(),
  pedido_id    uuid not null references public.pedidos (id) on delete cascade,
  socio_id     uuid references public.socios (id) on delete set null,
  socio_nombre text not null,
  porcentaje   numeric(5, 2) not null,
  monto        int not null
);

create index pedido_reparto_pedido_idx on public.pedido_reparto (pedido_id);

-- ─────────────────────────────────────────────────────────────
-- Configuración (una sola fila)
-- ─────────────────────────────────────────────────────────────

create table public.configuracion (
  id                smallint primary key default 1 check (id = 1),
  whatsapp_numero   text check (whatsapp_numero ~ '^[0-9]{8,15}$'), -- con indicativo, sin + ni espacios
  margen_default    numeric(6, 2) not null default 40 check (margen_default >= 0),
  redondeo          int not null default 100 check (redondeo > 0),
  umbral_stock_bajo int not null default 5 check (umbral_stock_bajo >= 0),
  texto_envio       text not null default '(El costo de envío se confirma por este medio)'
);

insert into public.configuracion (id) values (1);

-- ─────────────────────────────────────────────────────────────
-- Administradores (RN-10)
-- ─────────────────────────────────────────────────────────────
-- Las cuentas se crean a mano en Supabase Auth y luego se agregan aquí.
-- Estar autenticado NO basta para ser admin: hay que estar en esta tabla.

create table public.administradores (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null default '',
  created_at timestamptz not null default now()
);
