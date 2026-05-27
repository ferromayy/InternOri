# Supabase

## Proyecto nuevo (recomendado — 1 solo paso)

1. Creá el proyecto en Supabase (DEV).
2. **SQL Editor** → abrí `bootstrap.sql` del repo → copiá **todo** → **Run**.
3. Listo: esquema completo (migraciones 001–021 unificadas).

⚠️ `bootstrap.sql` **borra y recrea** las tablas de inventario. Solo en DEV vacío.

## Migración archivo por archivo (alternativa)

Solo si necesitás aplicar **una** migración nueva sobre una base que ya existe:

- Archivos en `migrations/` en orden numérico.
- **No** corras 006 ni 007 si usaste `bootstrap` o `002` actual (duplican policies).
- Migraciones nuevas (022+): agregalas a `bootstrap.sql` y al final de la cadena.

## Reset de datos (solo DEV)

- App: `npm run db:reset`
- SQL: `scripts/reset-inventario-completo.sql`

Ver [docs/entornos.md](../docs/entornos.md).
