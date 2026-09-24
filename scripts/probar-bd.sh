#!/usr/bin/env bash
# Prueba las migraciones, el seed y las políticas en un Postgres LOCAL (no en Supabase).
# Crea una base desechable, simula lo mínimo de Supabase y corre supabase/tests/*.sql.
#
# Uso:   scripts/probar-bd.sh
# Conexión: variables estándar de psql (PGHOST, PGPORT, PGUSER, PGPASSWORD).
# El usuario debe poder crear bases de datos y roles (superusuario).
set -euo pipefail

cd "$(dirname "$0")/.."
BD="${BD_PRUEBAS:-tienda_pruebas}"

dropdb --if-exists "$BD"
createdb "$BD"
trap 'dropdb --if-exists "$BD"' EXIT

correr() {
  echo "▸ $1"
  psql -d "$BD" -X -q -v ON_ERROR_STOP=1 -f "$1" 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  /    /'
}

correr supabase/tests/00_simular_supabase.sql
for f in supabase/migrations/*.sql; do correr "$f"; done
correr supabase/seed.sql
for f in supabase/tests/0[1-9]*.sql; do correr "$f"; done

echo "✔ Base de datos: todas las pruebas pasaron"
