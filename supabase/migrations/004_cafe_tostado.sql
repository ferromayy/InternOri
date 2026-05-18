-- Inventario productivo → Café tostado

create table if not exists public.cafe_tostado (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  cafe_verde_codigo text not null references public.cafe_verde (codigo),
  fecha_tueste date not null,
  perfil text not null,
  kg_verde_tostado_gr numeric(14, 2) not null check (kg_verde_tostado_gr > 0),
  kg_despues_tostar_gr numeric(14, 2) not null check (kg_despues_tostar_gr > 0),
  merma_gr numeric(14, 2) generated always as (kg_verde_tostado_gr - kg_despues_tostar_gr) stored,
  kg_vendidos_gr numeric(14, 2) not null default 0 check (kg_vendidos_gr >= 0),
  kg_existentes_gr numeric(14, 2) generated always as (kg_despues_tostar_gr - kg_vendidos_gr) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafe_tostado_merma_no_negativa check (kg_despues_tostar_gr <= kg_verde_tostado_gr),
  constraint cafe_tostado_kg_vendidos_lte_despues check (kg_vendidos_gr <= kg_despues_tostar_gr)
);

create unique index if not exists cafe_tostado_codigo_key on public.cafe_tostado (codigo);

drop trigger if exists cafe_tostado_updated_at on public.cafe_tostado;
create trigger cafe_tostado_updated_at
  before update on public.cafe_tostado
  for each row execute function public.set_updated_at();

alter table public.cafe_tostado enable row level security;

create policy "cafe_tostado_select_anon"
  on public.cafe_tostado for select to anon using (true);

create policy "cafe_tostado_insert_anon"
  on public.cafe_tostado for insert to anon with check (true);

create policy "cafe_tostado_update_anon"
  on public.cafe_tostado for update to anon using (true) with check (true);
