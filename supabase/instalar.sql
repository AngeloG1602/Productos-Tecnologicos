-- ============================================================================
-- INSTALACIÓN COMPLETA DE LA BASE DE DATOS (generado, no editar a mano)
-- Regenerar con: bash scripts/generar-instalar.sh
--
-- Pegar TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Úsalo solo en un proyecto NUEVO (vacío). Para cambios posteriores se
-- entregarán archivos de migración sueltos.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Archivo: supabase/migrations/20260924000100_esquema.sql
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- Archivo: supabase/migrations/20260924000200_seguridad.sql
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- Archivo: supabase/migrations/20260924000300_funciones_pedidos.sql
-- ────────────────────────────────────────────────────────────────────────────
-- B1 · Migración 3: funciones de pedidos (RPC)
-- Toda la lógica que mueve dinero o stock vive aquí, dentro de Postgres.
-- Nunca se confía en precios que vengan del navegador (RNF-05).

-- ─────────────────────────────────────────────────────────────
-- crear_pedido(items, cliente) — única vía pública para crear pedidos
-- ─────────────────────────────────────────────────────────────
-- p_items:   [{ "producto_id": uuid, "cantidad": int, "precio": int (opcional, el que vio el cliente) }]
-- p_cliente: { "nombre": text, "ciudad": text, "notas": text, "acepta_politica": bool }
--
-- Respuesta:
--   Si todo cuadra con la BD → se registra el pedido:
--     { "ok": true, "codigo": "PED-0001", "total": 78600, "items": [...] }
--   Si cambió algo (stock, precio o disponibilidad) → NO se registra (RN-04):
--     { "ok": false, "motivo": "cambios", "cambios": [...], "items": [...ajustados] }
--   El cliente ajusta su carrito, avisa al usuario y vuelve a enviar.
--
-- Los ítems de la respuesta nunca incluyen el costo.

create or replace function public.crear_pedido(p_items jsonb, p_cliente jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nombre     text;
  v_ciudad     text;
  v_notas      text;
  v_acepta     boolean;
  v_items      jsonb;
  v_cambios    jsonb;
  v_total      int;
  v_costo      int;
  v_pedido_id  uuid;
  v_codigo     text;
begin
  -- Datos del cliente (RN-09)
  if p_cliente is null or jsonb_typeof(p_cliente) <> 'object' then
    raise exception 'Faltan los datos del cliente.' using errcode = '22023';
  end if;

  v_nombre := btrim(coalesce(p_cliente ->> 'nombre', ''));
  v_ciudad := btrim(coalesce(p_cliente ->> 'ciudad', ''));
  v_notas  := btrim(coalesce(p_cliente ->> 'notas', ''));
  v_acepta := coalesce(p_cliente -> 'acepta_politica' = 'true'::jsonb, false);

  if length(v_nombre) not between 1 and 80 then
    raise exception 'Escribe tu nombre (máximo 80 caracteres).' using errcode = '22023';
  end if;
  if length(v_ciudad) not between 1 and 120 then
    raise exception 'Escribe tu ciudad y barrio (máximo 120 caracteres).' using errcode = '22023';
  end if;
  if length(v_notas) > 500 then
    raise exception 'Las notas no pueden superar 500 caracteres.' using errcode = '22023';
  end if;
  if not v_acepta then
    raise exception 'Debes aceptar la política de tratamiento de datos.' using errcode = '22023';
  end if;

  -- Ítems del carrito
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'El carrito está vacío o no es válido.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    where jsonb_typeof(e) <> 'object'
       or coalesce(e ->> 'producto_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       -- cantidad: entero entre 1 y 999 (CASE garantiza que el cast va después del regex)
       or case
            when jsonb_typeof(e -> 'cantidad') = 'number' and (e ->> 'cantidad') ~ '^[0-9]{1,3}$'
              then (e ->> 'cantidad')::int < 1
            else true
          end
       -- precio visto (opcional): entero >= 0
       or case
            when jsonb_typeof(e -> 'precio') is null or jsonb_typeof(e -> 'precio') = 'null' then false
            when jsonb_typeof(e -> 'precio') = 'number' and (e ->> 'precio') ~ '^[0-9]{1,9}$' then false
            else true
          end
  ) then
    raise exception 'El carrito tiene datos inválidos.' using errcode = '22023';
  end if;

  -- Comparar lo pedido con la BD (precio y stock SIEMPRE de la BD)
  with solicitados as (
    select (e ->> 'producto_id')::uuid        as producto_id,
           sum((e ->> 'cantidad')::int)::int  as cantidad,
           max((e ->> 'precio')::int)         as precio_visto
    from jsonb_array_elements(p_items) e
    group by 1
  ),
  calculo as (
    select s.producto_id,
           s.cantidad                                   as cantidad_solicitada,
           s.precio_visto,
           coalesce(p.activo, false) and p.stock > 0    as disponible,
           p.nombre,
           p.precio_venta,
           p.stock,
           coalesce(c.costo, 0)                         as costo,
           case when coalesce(p.activo, false)
                then least(s.cantidad, p.stock) else 0 end as cantidad
    from solicitados s
    left join public.productos p on p.id = s.producto_id
    left join public.producto_costos c on c.producto_id = p.id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
        'producto_id',     producto_id,
        'nombre',          nombre,
        'cantidad',        cantidad,
        'precio_unitario', precio_venta,
        'subtotal',        cantidad * precio_venta
      ) order by nombre) filter (where cantidad > 0), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
        'producto_id',         producto_id,
        'nombre',              nombre,
        'tipo',                case
                                 when not disponible then 'no_disponible'
                                 when cantidad < cantidad_solicitada then 'stock'
                                 else 'precio'
                               end,
        'cantidad_solicitada', cantidad_solicitada,
        'cantidad',            cantidad,
        'precio_anterior',     precio_visto,
        'precio_actual',       precio_venta
      ) order by nombre) filter (
        where not disponible
           or cantidad < cantidad_solicitada
           or (precio_visto is not null and precio_visto <> precio_venta)
      ), '[]'::jsonb),
    coalesce(sum(cantidad * precio_venta), 0)::int,
    coalesce(sum(cantidad * costo), 0)::int
  into v_items, v_cambios, v_total, v_costo
  from calculo;

  if jsonb_array_length(v_cambios) > 0 then
    return jsonb_build_object(
      'ok',      false,
      'motivo',  'cambios',
      'cambios', v_cambios,
      'items',   v_items,
      'total',   v_total
    );
  end if;

  -- Registrar el pedido congelando nombre, precio y costo (RN-06)
  insert into public.pedidos (cliente_nombre, cliente_ciudad, notas, total_venta, total_costo, ganancia)
  values (v_nombre, v_ciudad, v_notas, v_total, v_costo, v_total - v_costo)
  returning id, codigo into v_pedido_id, v_codigo;

  insert into public.pedido_items
    (pedido_id, producto_id, nombre_snapshot, cantidad, precio_unitario, costo_unitario)
  select v_pedido_id, p.id, p.nombre, (i ->> 'cantidad')::int, p.precio_venta, coalesce(c.costo, 0)
  from jsonb_array_elements(v_items) i
  join public.productos p on p.id = (i ->> 'producto_id')::uuid
  left join public.producto_costos c on c.producto_id = p.id;

  return jsonb_build_object(
    'ok',     true,
    'codigo', v_codigo,
    'total',  v_total,
    'items',  v_items
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Utilidad interna: exigir admin
-- ─────────────────────────────────────────────────────────────

create or replace function public.exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- confirmar_pedido(id) — pendiente → confirmado
-- ─────────────────────────────────────────────────────────────
-- En una sola transacción: descuenta stock (falla si no alcanza) y congela
-- el reparto entre socios activos (RN-05, RN-07).
-- Redondeo del reparto: cada socio recibe round(ganancia × % / 100) y el último
-- (por fecha de creación) se lleva la diferencia, para que la suma sea exacta.

create or replace function public.confirmar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pedido    public.pedidos;
  v_item      record;
  v_stock     int;
  v_socio     record;
  v_n_socios  int;
  v_suma_pct  numeric;
  v_i         int := 0;
  v_monto     int;
  v_asignado  int := 0;
begin
  perform public.exigir_admin();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.estado <> 'pendiente' then
    raise exception 'Solo se pueden confirmar pedidos pendientes (el pedido % está %).',
      v_pedido.codigo, v_pedido.estado using errcode = '55000';
  end if;

  select count(*), coalesce(sum(porcentaje), 0) into v_n_socios, v_suma_pct
  from public.socios where activo;
  if v_n_socios = 0 or v_suma_pct <> 100 then
    raise exception 'Los porcentajes de los socios activos deben sumar 100 %% antes de confirmar pedidos.'
      using errcode = '55000';
  end if;

  -- Descontar stock (orden fijo por producto para evitar bloqueos cruzados)
  for v_item in
    select producto_id, max(nombre_snapshot) as nombre, sum(cantidad)::int as cantidad
    from public.pedido_items
    where pedido_id = p_pedido_id
    group by producto_id
    order by producto_id
  loop
    if v_item.producto_id is null then
      raise exception 'El producto "%" ya no existe; no se puede descontar su stock.', v_item.nombre
        using errcode = '55000';
    end if;

    update public.productos
       set stock = stock - v_item.cantidad
     where id = v_item.producto_id
       and stock >= v_item.cantidad;

    if not found then
      select stock into v_stock from public.productos where id = v_item.producto_id;
      raise exception 'Stock insuficiente para "%": hay %, el pedido necesita %.',
        v_item.nombre, coalesce(v_stock, 0), v_item.cantidad using errcode = '55000';
    end if;
  end loop;

  -- Congelar el reparto
  for v_socio in
    select id, nombre, porcentaje from public.socios where activo order by created_at, id
  loop
    v_i := v_i + 1;
    if v_i = v_n_socios then
      v_monto := v_pedido.ganancia - v_asignado;
    else
      v_monto := round(v_pedido.ganancia * v_socio.porcentaje / 100)::int;
    end if;
    v_asignado := v_asignado + v_monto;

    insert into public.pedido_reparto (pedido_id, socio_id, socio_nombre, porcentaje, monto)
    values (p_pedido_id, v_socio.id, v_socio.nombre, v_socio.porcentaje, v_monto);
  end loop;

  update public.pedidos
     set estado = 'confirmado', confirmado_at = now()
   where id = p_pedido_id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'estado', 'confirmado');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- cancelar_pedido(id) — pendiente|confirmado → cancelado
-- ─────────────────────────────────────────────────────────────
-- Si estaba confirmado: devuelve el stock y elimina el reparto congelado.
-- Los pedidos entregados no se pueden cancelar.

create or replace function public.cancelar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
  v_item   record;
begin
  perform public.exigir_admin();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.estado not in ('pendiente', 'confirmado') then
    raise exception 'No se puede cancelar el pedido % (está %).',
      v_pedido.codigo, v_pedido.estado using errcode = '55000';
  end if;

  if v_pedido.estado = 'confirmado' then
    for v_item in
      select producto_id, sum(cantidad)::int as cantidad
      from public.pedido_items
      where pedido_id = p_pedido_id and producto_id is not null
      group by producto_id
      order by producto_id
    loop
      update public.productos
         set stock = stock + v_item.cantidad
       where id = v_item.producto_id;
    end loop;

    delete from public.pedido_reparto where pedido_id = p_pedido_id;
  end if;

  update public.pedidos
     set estado = 'cancelado', cancelado_at = now()
   where id = p_pedido_id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'estado', 'cancelado');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- entregar_pedido(id) — confirmado → entregado (sin efecto en stock)
-- ─────────────────────────────────────────────────────────────
-- Como el estado de los pedidos no se edita directamente (evita saltarse el
-- descuento de stock), este paso también va por función.

create or replace function public.entregar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
begin
  perform public.exigir_admin();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.estado <> 'confirmado' then
    raise exception 'Solo se pueden marcar como entregados los pedidos confirmados (el pedido % está %).',
      v_pedido.codigo, v_pedido.estado using errcode = '55000';
  end if;

  update public.pedidos
     set estado = 'entregado', entregado_at = now()
   where id = p_pedido_id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'estado', 'entregado');
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────

revoke execute on function
  public.crear_pedido(jsonb, jsonb),
  public.exigir_admin(),
  public.confirmar_pedido(uuid),
  public.cancelar_pedido(uuid),
  public.entregar_pedido(uuid)
from public, anon, authenticated;

grant execute on function public.crear_pedido(jsonb, jsonb) to anon, authenticated;
grant execute on function
  public.confirmar_pedido(uuid),
  public.cancelar_pedido(uuid),
  public.entregar_pedido(uuid)
to authenticated; -- además, cada función exige ser admin

-- ────────────────────────────────────────────────────────────────────────────
-- Archivo: supabase/migrations/20260924000400_admin_catalogo.sql
-- ────────────────────────────────────────────────────────────────────────────
-- B4 · Migración 4: lo que necesita el panel admin para el catálogo
-- Precio anterior (para mostrar descuentos), imágenes (Storage) y las
-- funciones que crean/editan/duplican productos de forma atómica.

-- ─────────────────────────────────────────────────────────────
-- Precio anterior (opcional). Si se usa, debe ser mayor al precio actual;
-- si no, no sería un descuento real.
-- ─────────────────────────────────────────────────────────────

alter table public.productos
  add column precio_anterior int check (precio_anterior is null or precio_anterior > precio_venta);

-- ─────────────────────────────────────────────────────────────
-- Imágenes de productos (Storage): bucket público, solo admins escriben.
-- Convención de nombre: "<producto_id>/<n>.webp" (ver lib/imagenes.ts).
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "productos storage: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'productos');

create policy "productos storage: admins suben"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos' and (select public.es_admin()));

create policy "productos storage: admins actualizan"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()))
  with check (bucket_id = 'productos' and (select public.es_admin()));

create policy "productos storage: admins borran"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()));

-- ─────────────────────────────────────────────────────────────
-- guardar_producto: crea o actualiza un producto y su costo/margen en una
-- sola transacción (evita que quede un producto sin costo si algo falla).
-- p_id lo genera el panel (crypto.randomUUID()) ANTES de llamar a esta
-- función: así puede subir las fotos a "<p_id>/1.webp" antes de guardar.
-- Es upsert: si el id no existe, lo crea; si existe, lo actualiza.
-- ─────────────────────────────────────────────────────────────

create or replace function public.guardar_producto(
  p_id uuid,
  p_categoria_id uuid,
  p_nombre text,
  p_slug text,
  p_descripcion text,
  p_imagenes text[],
  p_costo int,
  p_margen_pct numeric,
  p_precio_venta int,
  p_precio_anterior int,
  p_stock int,
  p_activo boolean,
  p_destacado boolean
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.exigir_admin();

  if p_id is null then
    raise exception 'Falta el identificador del producto.' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_nombre, ''))) not between 1 and 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres.' using errcode = '22023';
  end if;
  if coalesce(p_slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'La dirección (slug) solo puede tener minúsculas, números y guiones.' using errcode = '22023';
  end if;
  if p_costo is null or p_margen_pct is null or p_precio_venta is null or p_stock is null then
    raise exception 'Costo, margen, precio y stock son obligatorios.' using errcode = '22023';
  end if;
  if p_costo < 0 or p_margen_pct < 0 or p_precio_venta < 0 or p_stock < 0 then
    raise exception 'Costo, margen, precio y stock no pueden ser negativos.' using errcode = '22023';
  end if;
  if p_precio_anterior is not null and p_precio_anterior <= p_precio_venta then
    raise exception 'El precio anterior debe ser mayor que el precio actual.' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_imagenes, '{}')) > 4 then
    raise exception 'Máximo 4 imágenes por producto.' using errcode = '22023';
  end if;

  insert into public.productos
    (id, categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado)
  values
    (p_id, p_categoria_id, btrim(p_nombre), p_slug, coalesce(p_descripcion, ''), coalesce(p_imagenes, '{}'),
     p_precio_venta, p_precio_anterior, p_stock, p_activo, p_destacado)
  on conflict (id) do update set
    categoria_id = excluded.categoria_id,
    nombre = excluded.nombre,
    slug = excluded.slug,
    descripcion = excluded.descripcion,
    imagenes = excluded.imagenes,
    precio_venta = excluded.precio_venta,
    precio_anterior = excluded.precio_anterior,
    stock = excluded.stock,
    activo = excluded.activo,
    destacado = excluded.destacado
  returning id into v_id;

  insert into public.producto_costos (producto_id, costo, margen_pct)
  values (v_id, p_costo, p_margen_pct)
  on conflict (producto_id) do update set costo = excluded.costo, margen_pct = excluded.margen_pct;

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya existe un producto con esa dirección (slug); cámbiala.' using errcode = '22023';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- duplicar_producto: copia un producto (mismas fotos, costo y margen) como
-- variante inactiva y con stock 0, para editar lo que cambie y activarla.
-- ─────────────────────────────────────────────────────────────

create or replace function public.duplicar_producto(p_producto_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_origen public.productos;
  v_costo public.producto_costos;
  v_nuevo_id uuid;
  v_slug text;
  v_sufijo int := 1;
begin
  perform public.exigir_admin();

  select * into v_origen from public.productos where id = p_producto_id;
  if not found then
    raise exception 'Producto no encontrado.' using errcode = 'P0002';
  end if;

  v_slug := v_origen.slug || '-copia';
  while exists (select 1 from public.productos where slug = v_slug) loop
    v_sufijo := v_sufijo + 1;
    v_slug := v_origen.slug || '-copia-' || v_sufijo;
  end loop;

  insert into public.productos
    (categoria_id, nombre, slug, descripcion, imagenes, precio_venta, precio_anterior, stock, activo, destacado)
  values
    (v_origen.categoria_id, v_origen.nombre || ' (copia)', v_slug, v_origen.descripcion, v_origen.imagenes,
     v_origen.precio_venta, v_origen.precio_anterior, 0, false, false)
  returning id into v_nuevo_id;

  select * into v_costo from public.producto_costos where producto_id = p_producto_id;
  if found then
    insert into public.producto_costos (producto_id, costo, margen_pct)
    values (v_nuevo_id, v_costo.costo, v_costo.margen_pct);
  end if;

  return v_nuevo_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────

revoke execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean)
  from public, anon, authenticated;
revoke execute on function public.duplicar_producto(uuid) from public, anon, authenticated;

grant execute on function public.guardar_producto(uuid, uuid, text, text, text, text[], int, numeric, int, int, int, boolean, boolean)
  to authenticated; -- exige admin adentro
grant execute on function public.duplicar_producto(uuid) to authenticated; -- exige admin adentro

-- ────────────────────────────────────────────────────────────────────────────
-- Archivo: supabase/migrations/20260924000500_ventas_socios.sql
-- ────────────────────────────────────────────────────────────────────────────
-- B5 · Migración 5: socios y resumen de ventas para el panel admin
-- (Los pedidos ya se confirman/cancelan/entregan con las funciones de la migración 3.)

-- ─────────────────────────────────────────────────────────────
-- guardar_socios(p_socios): guarda la lista completa de socios de una vez.
-- p_socios: [{ "id": uuid|null, "nombre": text, "porcentaje": number, "activo": bool }]
--   id null → socio nuevo. Los socios que no vengan en la lista se desactivan
--   (no se borran: el reparto de pedidos viejos guarda su nombre y porcentaje).
-- Al final, los activos deben sumar exactamente 100 % (RN-07).
-- Devuelve cuántos socios quedaron activos.
-- ─────────────────────────────────────────────────────────────

create or replace function public.guardar_socios(p_socios jsonb)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_item   jsonb;
  v_id     uuid;
  v_ids    uuid[] := '{}';
  v_nombre text;
  v_pct    numeric;
  v_suma   numeric;
  v_activos int;
begin
  perform public.exigir_admin();

  if p_socios is null or jsonb_typeof(p_socios) <> 'array' or jsonb_array_length(p_socios) = 0 then
    raise exception 'Agrega al menos un socio.' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_socios) loop
    v_nombre := btrim(coalesce(v_item ->> 'nombre', ''));
    if length(v_nombre) not between 1 and 80 then
      raise exception 'Cada socio necesita un nombre (máximo 80 caracteres).' using errcode = '22023';
    end if;
    -- CASE: el cast a numeric solo ocurre si el texto ya pasó la expresión regular
    v_pct := case
               when jsonb_typeof(v_item -> 'porcentaje') = 'number'
                    and (v_item ->> 'porcentaje') ~ '^[0-9]{1,3}(\.[0-9]{1,2})?$'
                 then (v_item ->> 'porcentaje')::numeric
             end;
    if v_pct is null or v_pct <= 0 or v_pct > 100 then
      raise exception 'El porcentaje de "%" debe ser mayor que 0 y máximo 100 (hasta 2 decimales).', v_nombre
        using errcode = '22023';
    end if;
    if jsonb_typeof(v_item -> 'activo') is distinct from 'boolean' then
      raise exception 'Datos de socio inválidos.' using errcode = '22023';
    end if;

    if coalesce(v_item ->> 'id', '') <> '' then
      update public.socios
         set nombre = v_nombre,
             porcentaje = v_pct,
             activo = (v_item ->> 'activo')::boolean
       where id = (v_item ->> 'id')::uuid
      returning id into v_id;
      if not found then
        raise exception 'Uno de los socios ya no existe; recarga la página.' using errcode = 'P0002';
      end if;
    else
      insert into public.socios (nombre, porcentaje, activo)
      values (v_nombre, v_pct, (v_item ->> 'activo')::boolean)
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;
  end loop;

  update public.socios set activo = false where activo and not (id = any (v_ids));

  select coalesce(sum(porcentaje), 0), count(*) into v_suma, v_activos from public.socios where activo;
  if v_suma <> 100 then
    raise exception 'Los porcentajes de los socios activos deben sumar 100 %% (ahora suman %).', v_suma
      using errcode = '22023';
  end if;

  return v_activos;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- resumen_ventas(p_desde, p_hasta): datos del dashboard (RF-18).
-- Cuentan solo pedidos confirmados y entregados (RN-07), según la fecha en que
-- se confirmaron, en hora de Colombia, con ambos días incluidos.
-- ─────────────────────────────────────────────────────────────

create or replace function public.resumen_ventas(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inicio timestamptz;
  v_fin    timestamptz;
  v_resumen jsonb;
begin
  perform public.exigir_admin();

  if p_desde is null or p_hasta is null or p_hasta < p_desde then
    raise exception 'El rango de fechas no es válido.' using errcode = '22023';
  end if;
  v_inicio := p_desde::timestamp at time zone 'America/Bogota';
  v_fin    := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  with vendidos as (
    select p.*
    from public.pedidos p
    where p.estado in ('confirmado', 'entregado')
      and p.confirmado_at >= v_inicio
      and p.confirmado_at < v_fin
  )
  select jsonb_build_object(
    'pedidos',  (select count(*) from vendidos),
    'ventas',   (select coalesce(sum(total_venta), 0)::bigint from vendidos),
    'costo',    (select coalesce(sum(total_costo), 0)::bigint from vendidos),
    'ganancia', (select coalesce(sum(ganancia), 0)::bigint from vendidos),
    'reparto',  (
      select coalesce(jsonb_agg(jsonb_build_object('socio', socio_nombre, 'monto', monto) order by monto desc, socio_nombre), '[]'::jsonb)
      from (
        select r.socio_nombre, sum(r.monto)::bigint as monto
        from public.pedido_reparto r
        join vendidos v on v.id = r.pedido_id
        group by r.socio_nombre
      ) x
    ),
    'pendientes', (select count(*) from public.pedidos where estado = 'pendiente'),
    'vencidos',   (select count(*) from public.pedidos where estado = 'pendiente' and created_at < now() - interval '7 days')
  )
  into v_resumen;

  return v_resumen;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────

revoke execute on function public.guardar_socios(jsonb), public.resumen_ventas(date, date)
  from public, anon, authenticated;
grant execute on function public.guardar_socios(jsonb), public.resumen_ventas(date, date)
  to authenticated; -- exigen admin adentro

-- ────────────────────────────────────────────────────────────────────────────
-- Archivo: supabase/seed.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Datos de prueba (B1). Se pueden ejecutar varias veces sin duplicar.
-- Precios según RN-01: redondear_arriba(costo × 1,40, 100). Un caso con ajuste manual
-- (audífonos a $45.000) y casos de stock alto, bajo, agotado e inactivo (RN-03).

insert into public.categorias (nombre, slug, orden) values
  ('Cargadores',  'cargadores',  1),
  ('Cables',      'cables',      2),
  ('Audífonos',   'audifonos',   3),
  ('Parlantes',   'parlantes',   4),
  ('Power banks', 'power-banks', 5),
  ('Accesorios',  'accesorios',  6)
on conflict (slug) do nothing;

with datos (categoria, nombre, slug, descripcion, costo, margen, precio, stock, activo, destacado) as (
  values
    ('cargadores',  'Cargador USB-C 20W',          'cargador-usb-c-20w',          'Carga rápida Power Delivery para celulares y tabletas.',             12000, 40, 16800,  25, true,  true),
    ('cargadores',  'Cargador de carro doble USB', 'cargador-carro-doble-usb',    'Dos puertos USB-A, 2.4 A. Compatible con cualquier encendedor.',      8500, 40, 11900,   3, true,  false),
    ('cables',      'Cable USB-C a USB-C 1 m',     'cable-usb-c-a-usb-c-1m',      'Cable trenzado, soporta carga rápida de hasta 60 W.',                  4000, 40,  5600,  50, true,  false),
    ('cables',      'Cable Lightning 1 m',         'cable-lightning-1m',          'Cable USB-A a Lightning para iPhone.',                                 5500, 40,  7700,   0, true,  false),
    ('audifonos',   'Audífonos Bluetooth X',       'audifonos-bluetooth-x',       'Inalámbricos con estuche de carga y hasta 20 horas de batería.',      32000, 40, 45000,  10, true,  true),
    ('audifonos',   'Audífonos de cable 3,5 mm',   'audifonos-cable-3-5mm',       'Con micrófono y control de volumen.',                                  6000, 40,  8400,  15, true,  false),
    ('parlantes',   'Parlante Bluetooth mini',     'parlante-bluetooth-mini',     'Resistente a salpicaduras, 5 W, hasta 8 horas de música.',            38000, 40, 53200,   4, true,  true),
    ('power-banks', 'Power bank 10.000 mAh',       'power-bank-10000mah',         'Dos salidas USB y entrada USB-C. Carga un celular unas 2 veces.',     45000, 40, 63000,   8, true,  false),
    ('power-banks', 'Power bank 20.000 mAh',       'power-bank-20000mah',         'Carga rápida 22,5 W con pantalla de porcentaje.',                     70000, 40, 98000,   2, true,  false),
    ('accesorios',  'Soporte de celular para carro','soporte-celular-carro',      'Se ajusta a la rejilla del aire. Giro de 360°.',                       7000, 40,  9800,  12, true,  false),
    ('accesorios',  'Vidrio templado universal',   'vidrio-templado-universal',   'Protector de pantalla 9H. Indica el modelo al hacer el pedido.',       2500, 40,  3500, 100, true,  false),
    ('accesorios',  'Hub USB-C 4 en 1',            'hub-usb-c-4-en-1',            'HDMI 4K, dos USB-A y USB-C PD. (Inactivo: no debe verse en la tienda)',35000, 40, 49000,   6, false, false)
),
insertados as (
  insert into public.productos (categoria_id, nombre, slug, descripcion, precio_venta, stock, activo, destacado)
  select c.id, d.nombre, d.slug, d.descripcion, d.precio, d.stock, d.activo, d.destacado
  from datos d
  join public.categorias c on c.slug = d.categoria
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.producto_costos (producto_id, costo, margen_pct)
select i.id, d.costo, d.margen
from insertados i
join datos d on d.slug = i.slug;

-- Socios [POR CONFIRMAR]: 2 socios al 50/50
insert into public.socios (nombre, porcentaje)
select nombre, porcentaje
from (values ('Socio 1', 50), ('Socio 2', 50)) as s (nombre, porcentaje)
where not exists (select 1 from public.socios);

-- Número de WhatsApp de prueba (cámbialo en Configuración)
update public.configuracion
   set whatsapp_numero = '573000000000'
 where id = 1 and whatsapp_numero is null;
