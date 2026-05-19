-- Historial de ingresos de stock al catálogo de packaging

create table if not exists public.packaging_componente_ingreso (
  id uuid primary key default gen_random_uuid(),
  packaging_componente_id uuid not null
    references public.packaging_componente (id) on delete cascade,
  cantidad numeric(14, 2) not null check (cantidad > 0),
  stock_anterior numeric(14, 2) not null check (stock_anterior >= 0),
  stock_nuevo numeric(14, 2) not null check (stock_nuevo >= 0),
  precio_compra_ars numeric(14, 2) check (precio_compra_ars is null or precio_compra_ars >= 0),
  precio_compra_usd numeric(14, 2) check (precio_compra_usd is null or precio_compra_usd >= 0),
  origen text not null default 'manual'
    check (origen in ('manual', 'alta', 'ajuste')),
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists packaging_componente_ingreso_componente_idx
  on public.packaging_componente_ingreso (packaging_componente_id, created_at desc);

create index if not exists packaging_componente_ingreso_created_idx
  on public.packaging_componente_ingreso (created_at desc);

alter table public.packaging_componente_ingreso enable row level security;

create policy "packaging_componente_ingreso_select_anon"
  on public.packaging_componente_ingreso for select to anon using (true);

create policy "packaging_componente_ingreso_insert_anon"
  on public.packaging_componente_ingreso for insert to anon with check (true);
