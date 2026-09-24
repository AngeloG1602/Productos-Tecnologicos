-- Dar permisos de administrador a un usuario ya creado en Authentication → Users.
-- 1. Cambia el correo y el nombre de abajo.
-- 2. Pégalo en SQL Editor → Run. Repite para el segundo admin.

insert into public.administradores (user_id, nombre)
select id, 'Nombre del admin'
from auth.users
where email = 'correo-del-admin@ejemplo.com'
on conflict (user_id) do nothing
returning user_id, nombre;  -- si no devuelve ninguna fila, el correo no coincide con ningún usuario
