-- Detalle de insumos consumidos por cada registro de producción

create table if not exists public.producto_terminado_produccion_consumo (
  id uuid primary key default gen_random_uuid(),
  produccion_id uuid not null
    references public.producto_terminado_produccion (id) on delete cascade,
  es_tostado boolean not null default false,
  componente text,
  tipo text not null,
  cantidad_por_unidad numeric(14, 2),
  cantidad_usada numeric(14, 2) not null check (cantidad_usada >= 0),
  unidad text not null default 'ud' check (unidad in ('g', 'ud'))
);

create index if not exists producto_terminado_produccion_consumo_produccion_idx
  on public.producto_terminado_produccion_consumo (produccion_id);

alter table public.producto_terminado_produccion_consumo enable row level security;

create policy "producto_terminado_produccion_consumo_select_anon"
  on public.producto_terminado_produccion_consumo for select to anon using (true);

create policy "producto_terminado_produccion_consumo_insert_anon"
  on public.producto_terminado_produccion_consumo for insert to anon with check (true);
