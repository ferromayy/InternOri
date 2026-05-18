-- Inventario productivo → Café verde
-- Ejecutar en Supabase SQL Editor

create table if not exists public.cafe_verde (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  varietal text not null,
  origen text not null,
  productor text not null,
  proceso text not null,
  fecha_ingreso date not null,
  importador text not null,
  lote text not null,
  kg_iniciales_gr numeric(14, 2) not null check (kg_iniciales_gr > 0),
  kg_usados_gr numeric(14, 2) not null default 0 check (kg_usados_gr >= 0),
  kg_actuales_gr numeric(14, 2) generated always as (kg_iniciales_gr - kg_usados_gr) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafe_verde_kg_usados_lte_iniciales check (kg_usados_gr <= kg_iniciales_gr)
);

create unique index if not exists cafe_verde_codigo_key on public.cafe_verde (codigo);
create unique index if not exists cafe_verde_lote_key on public.cafe_verde (lote);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cafe_verde_updated_at on public.cafe_verde;
create trigger cafe_verde_updated_at
  before update on public.cafe_verde
  for each row execute function public.set_updated_at();

alter table public.cafe_verde enable row level security;

create policy "cafe_verde_select_anon"
  on public.cafe_verde for select to anon using (true);

create policy "cafe_verde_insert_anon"
  on public.cafe_verde for insert to anon with check (true);

create policy "cafe_verde_update_anon"
  on public.cafe_verde for update to anon using (true) with check (true);

create table if not exists public.cafe_verde_formatos_venta (
  id uuid primary key default gen_random_uuid(),
  cafe_verde_id uuid not null references public.cafe_verde (id) on delete cascade,
  formato_venta text not null,
  constraint cafe_verde_formatos_venta_formato_check
    check (formato_venta in ('50g', '100g', '125g', '150g', '200g', '250g', '500g', '1kg')),
  constraint cafe_verde_formatos_venta_unique unique (cafe_verde_id, formato_venta)
);

create index if not exists cafe_verde_formatos_venta_cafe_verde_id_idx
  on public.cafe_verde_formatos_venta (cafe_verde_id);

alter table public.cafe_verde_formatos_venta enable row level security;

create policy "cafe_verde_formatos_select_anon"
  on public.cafe_verde_formatos_venta for select to anon using (true);

create policy "cafe_verde_formatos_insert_anon"
  on public.cafe_verde_formatos_venta for insert to anon with check (true);

create policy "cafe_verde_formatos_delete_anon"
  on public.cafe_verde_formatos_venta for delete to anon using (true);
