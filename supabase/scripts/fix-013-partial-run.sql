-- Usá este script si 013 falló a mitad (p. ej. al dropear cafe_verde_codigo_key).
-- Seguro de ejecutar más de una vez.

alter table public.cafe_verde
  add column if not exists deleted_at timestamptz;

alter table public.cafe_tostado
  add column if not exists deleted_at timestamptz;

create index if not exists cafe_verde_deleted_at_idx
  on public.cafe_verde (deleted_at)
  where deleted_at is null;

create index if not exists cafe_tostado_deleted_at_idx
  on public.cafe_tostado (deleted_at)
  where deleted_at is null;

-- Recrear índice de código si se borró por error (requerido por FK)
create unique index if not exists cafe_verde_codigo_key on public.cafe_verde (codigo);

drop index if exists public.cafe_verde_lote_key;

create unique index if not exists cafe_verde_lote_active_key
  on public.cafe_verde (lote)
  where deleted_at is null;

drop index if exists public.cafe_tostado_codigo_key;

create unique index if not exists cafe_tostado_codigo_active_key
  on public.cafe_tostado (codigo)
  where deleted_at is null;
