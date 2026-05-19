-- Borrado lógico en café verde y café tostado
--
-- Nota: cafe_verde.codigo mantiene UNIQUE global porque cafe_tostado tiene FK
-- (cafe_verde_codigo → cafe_verde.codigo). Tras borrado lógico no se puede
-- reutilizar el mismo ID hasta migrar el FK a cafe_verde_id (futuro).

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

-- Lote: sin FK externo → unique solo entre activos
drop index if exists public.cafe_verde_lote_key;

create unique index if not exists cafe_verde_lote_active_key
  on public.cafe_verde (lote)
  where deleted_at is null;

-- Código de tueste: sin FK que dependa del índice → unique solo entre activos
drop index if exists public.cafe_tostado_codigo_key;

create unique index if not exists cafe_tostado_codigo_active_key
  on public.cafe_tostado (codigo)
  where deleted_at is null;

-- NO dropear cafe_verde_codigo_key (lo usa cafe_tostado_cafe_verde_fkey)
