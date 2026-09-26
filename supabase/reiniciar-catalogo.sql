-- Borra TODOS los pedidos y TODOS los productos (con sus costos) para empezar de cero.
-- Las categorías NO se tocan (así conservas la estructura y solo agregas productos nuevos).
--
-- ⚠ No se puede deshacer. Antes de correrlo: Panel → Configuración → "Descargar copia
--   de seguridad" (por si acaso).
-- ⚠ Este script NO borra las fotos en Storage (eso es un sistema aparte de la base de
--   datos). Después de correrlo, borra las fotos a mano: Supabase → Storage → bucket
--   "productos" → selecciona todas las carpetas → Delete.
--
-- Uso: SQL Editor → New query → pegar → Run. Debe devolver "0, 0" al final.

begin;

delete from public.pedidos;          -- pedido_items y pedido_reparto se borran en cascada
delete from public.pedidos_origen;   -- registro anti-spam
alter sequence public.pedidos_codigo_seq restart with 1;  -- el próximo pedido será PED-0001

delete from public.productos;        -- producto_costos se borra en cascada

select
  (select count(*) from public.pedidos)  as pedidos_restantes,
  (select count(*) from public.productos) as productos_restantes;

commit;
