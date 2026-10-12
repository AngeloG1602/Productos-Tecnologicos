-- Tema visual activo de la tienda pública (catálogo de temas en lib/temas.ts).
-- No hay un CHECK contra la lista completa: el catálogo puede crecer sin nueva
-- migración. Se valida contra lib/temas.ts en el servidor al guardar.

alter table public.configuracion
  add column tema_activo text not null default 'clasico' check (tema_activo ~ '^[a-z0-9-]{1,40}$');

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
  tiempo_entrega    text,
  tema_activo       text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.whatsapp_numero, c.umbral_stock_bajo, c.texto_envio,
         c.legal_nombre, c.legal_documento, c.legal_direccion, c.legal_ciudad, c.legal_correo,
         c.garantia_meses, c.metodos_pago, c.tiempo_entrega,
         c.tema_activo
  from public.configuracion c
  where c.id = 1
$$;

revoke execute on function public.configuracion_publica() from public;
grant execute on function public.configuracion_publica() to anon, authenticated;
