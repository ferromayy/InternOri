-- Requisitos de packaging por formato de venta (cada bolsa / presentación)

create table if not exists public.packaging_requisito (
  id uuid primary key default gen_random_uuid(),
  cafe_verde_formato_id uuid not null
    references public.cafe_verde_formatos_venta (id) on delete cascade,
  componente text not null,
  tipo text not null,
  cantidad numeric(14, 2) not null default 0 check (cantidad >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packaging_requisito_componente_check
    check (componente in ('sticker', 'bolsa_cafe', 'bolsa_sosten', 'caja', 'sobre', 'tarjeta')),
  constraint packaging_requisito_unique unique (cafe_verde_formato_id, componente, tipo)
);

create index if not exists packaging_requisito_formato_id_idx
  on public.packaging_requisito (cafe_verde_formato_id);

drop trigger if exists packaging_requisito_updated_at on public.packaging_requisito;
create trigger packaging_requisito_updated_at
  before update on public.packaging_requisito
  for each row execute function public.set_updated_at();

alter table public.packaging_requisito enable row level security;

drop policy if exists "packaging_requisito_select_anon" on public.packaging_requisito;
create policy "packaging_requisito_select_anon"
  on public.packaging_requisito for select to anon using (true);

drop policy if exists "packaging_requisito_insert_anon" on public.packaging_requisito;
create policy "packaging_requisito_insert_anon"
  on public.packaging_requisito for insert to anon with check (true);

drop policy if exists "packaging_requisito_update_anon" on public.packaging_requisito;
create policy "packaging_requisito_update_anon"
  on public.packaging_requisito for update to anon using (true) with check (true);

drop policy if exists "packaging_requisito_delete_anon" on public.packaging_requisito;
create policy "packaging_requisito_delete_anon"
  on public.packaging_requisito for delete to anon using (true);
