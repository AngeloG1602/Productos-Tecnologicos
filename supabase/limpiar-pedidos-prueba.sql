-- Borra TODOS los pedidos (con sus productos y reparto) para empezar de cero antes de lanzar.
-- ⚠ No se puede deshacer. Descarga antes una copia de seguridad (Panel → Configuración).
-- ⚠ No devuelve stock: los pedidos de prueba confirmados ya lo descontaron; ajústalo en Productos.
-- Uso: SQL Editor → New query → pegar → Run. Debe devolver "pedidos_restantes = 0".

begin;
delete from public.pedidos;          -- pedido_items y pedido_reparto se borran en cascada
delete from public.pedidos_origen;   -- registro anti-spam
alter sequence public.pedidos_codigo_seq restart with 1;  -- el próximo pedido será PED-0001
select count(*) as pedidos_restantes from public.pedidos;
commit;
