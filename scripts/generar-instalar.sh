#!/usr/bin/env bash
# Genera supabase/instalar.sql: todas las migraciones + datos de prueba en un solo archivo,
# para pegarlo de una vez en el SQL Editor de Supabase (ver docs/GUIA-INSTALACION.md).
set -euo pipefail
cd "$(dirname "$0")/.."

{
  echo "-- ============================================================================"
  echo "-- INSTALACIÓN COMPLETA DE LA BASE DE DATOS (generado, no editar a mano)"
  echo "-- Regenerar con: bash scripts/generar-instalar.sh"
  echo "--"
  echo "-- Pegar TODO este archivo en Supabase → SQL Editor → New query → Run."
  echo "-- Úsalo solo en un proyecto NUEVO (vacío). Para cambios posteriores se"
  echo "-- entregarán archivos de migración sueltos."
  echo "-- ============================================================================"
  for f in supabase/migrations/*.sql supabase/seed.sql; do
    echo
    echo "-- ────────────────────────────────────────────────────────────────────────────"
    echo "-- Archivo: $f"
    echo "-- ────────────────────────────────────────────────────────────────────────────"
    cat "$f"
  done
} > supabase/instalar.sql
echo "✔ supabase/instalar.sql generado"
