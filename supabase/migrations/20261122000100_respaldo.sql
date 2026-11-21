-- Fecha de la última copia de seguridad descargada desde el panel, para recordarla en el inicio.
-- Solo admins ven y editan "configuracion" (RLS ya existente); el público no la recibe
-- (configuracion_publica() no incluye esta columna).

alter table public.configuracion
  add column ultimo_respaldo timestamptz;
