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

# instalar.sql debe estar al día con las migraciones
cp supabase/instalar.sql "${TMPDIR:-/tmp}/instalar.previo.sql"
bash scripts/generar-instalar.sh > /dev/null
if ! cmp -s supabase/instalar.sql "${TMPDIR:-/tmp}/instalar.previo.sql"; then
  echo "✘ supabase/instalar.sql estaba desactualizado; se regeneró. Inclúyelo en el commit."
  exit 1
fi

# Se instala con el archivo único, igual que en Supabase
correr supabase/tests/00_simular_supabase.sql
correr supabase/instalar.sql
for f in supabase/tests/0[1-9]*.sql; do correr "$f"; done

echo "✔ Base de datos: todas las pruebas pasaron"
