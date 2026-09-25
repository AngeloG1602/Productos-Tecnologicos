-- B6 · Migración 6: datos legales de la tienda y límite de pedidos seguidos.
--
-- 1. Datos legales en la configuración (Ley 1480 art. 50, Ley 1581 y Decreto 1377 art. 13):
--    quién vende, dónde, cómo contactarlo, garantía, medios de pago y plazo de entrega.
--    Son públicos por ley: la tienda los lee con configuracion_publica().
-- 2. Anti-spam de crear_pedido: tope por origen (IP) y tope global por hora.

-- ─────────────────────────────────────────────────────────────
-- 1. Datos legales
-- ─────────────────────────────────────────────────────────────

alter table public.configuracion
  add column legal_nombre    text not null default '' check (length(legal_nombre) <= 120),
  add column legal_documento text not null default '' check (length(legal_documento) <= 40),
  add column legal_direccion text not null default '' check (length(legal_direccion) <= 160),
  add column legal_ciudad    text not null default '' check (length(legal_ciudad) <= 80),
  add column legal_correo    text not null default ''
    check (legal_correo = '' or (length(legal_correo) <= 120 and legal_correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  -- Si no se anuncia un término, la ley da 1 año para productos nuevos (Ley 1480 art. 8).
  add column garantia_meses  int not null default 12 check (garantia_meses between 1 and 60),
  add column metodos_pago    text not null default '' check (length(metodos_pago) <= 300),
  add column tiempo_entrega  text not null default '' check (length(tiempo_entrega) <= 300);

-- Cambia la forma de la respuesta: hay que borrarla y crearla de nuevo.
drop function public.configuracion_publica();

create function public.configuracion_publica()
returns table (
  whatsapp_numero   text,
  umbral_stock_bajo int,
  texto_envio       text,
  legal_nombre      text,
  legal_documento   text,
  legal_direccion   text,
  legal_ciudad      text,
  legal_correo      text,
  garantia_meses    int,
  metodos_pago      text,
  tiempo_entrega    text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.whatsapp_numero, c.umbral_stock_bajo, c.texto_envio,
         c.legal_nombre, c.legal_documento, c.legal_direccion, c.legal_ciudad, c.legal_correo,
         c.garantia_meses, c.metodos_pago, c.tiempo_entrega
  from public.configuracion c
  where c.id = 1
$$;

revoke execute on function public.configuracion_publica() from public;
grant execute on function public.configuracion_publica() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Límite de pedidos seguidos
-- ─────────────────────────────────────────────────────────────
-- Se aplica con un trigger sobre pedidos, así cubre crear_pedido sin reescribirla.
--  · Por origen: máximo 3 pedidos en 10 minutos desde la misma IP.
--  · Global: máximo 30 pedidos en 1 hora (si alguien cambia de IP para llenar el panel).
-- La IP no se guarda: solo un resumen (md5 de IP + fecha) que se borra al día siguiente.
-- La IP sale de las cabeceras que Supabase pasa a Postgres; si no hay (SQL Editor,
-- pruebas), solo aplica el tope global.

create table public.pedidos_origen (
  origen     text not null,
  creado_at  timestamptz not null default now()
);

create index pedidos_origen_idx on public.pedidos_origen (origen, creado_at);
create index pedidos_creado_idx on public.pedidos (created_at);

-- Nadie la lee ni la escribe desde la API: solo el trigger (security definer).
alter table public.pedidos_origen enable row level security;
revoke all on public.pedidos_origen from anon, authenticated;

create function public.limitar_pedidos()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_cabeceras jsonb;
  v_ip        text;
  v_origen    text;
begin
  if (select count(*) from public.pedidos where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Estamos recibiendo muchos pedidos en este momento. Inténtalo en unos minutos o escríbenos por WhatsApp.'
      using errcode = '22023';
  end if;

  begin
    v_cabeceras := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_cabeceras := null;
  end;

  -- cf-connecting-ip la pone el proxy de Supabase (no la puede falsear el cliente);
  -- x-forwarded-for queda como respaldo.
  v_ip := btrim(coalesce(
    nullif(v_cabeceras ->> 'cf-connecting-ip', ''),
    split_part(coalesce(v_cabeceras ->> 'x-forwarded-for', ''), ',', 1)
  ));

  if v_ip <> '' then
    v_origen := md5(v_ip || '|' || current_date::text);

    delete from public.pedidos_origen where creado_at < now() - interval '1 day';

    if (select count(*) from public.pedidos_origen
        where origen = v_origen and creado_at > now() - interval '10 minutes') >= 3 then
      raise exception 'Ya enviaste varios pedidos seguidos. Espera unos minutos o escríbenos por WhatsApp.'
        using errcode = '22023';
    end if;

    insert into public.pedidos_origen (origen) values (v_origen);
  end if;

  return new;
end;
$$;

create trigger pedidos_limite
  before insert on public.pedidos
  for each row execute function public.limitar_pedidos();
