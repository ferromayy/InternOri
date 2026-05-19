-- Historial de producción de producto terminado

create table if not exists public.producto_terminado_produccion (
  id uuid primary key default gen_random_uuid(),
  cafe_verde_formato_id uuid not null
    references public.cafe_verde_formatos_venta (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  unidades_totales integer not null check (unidades_totales >= 0),
  kg_tostado_usado_gr numeric(14, 2) not null check (kg_tostado_usado_gr >= 0),
  precio_venta_ars numeric(14, 2) check (precio_venta_ars is null or precio_venta_ars >= 0),
  precio_venta_usd numeric(14, 2) check (precio_venta_usd is null or precio_venta_usd >= 0),
  origen text not null default 'individual'
    check (origen in ('individual', 'lote')),
  created_at timestamptz not null default now()
);

create index if not exists producto_terminado_produccion_created_idx
  on public.producto_terminado_produccion (created_at desc);

create index if not exists producto_terminado_produccion_formato_idx
  on public.producto_terminado_produccion (cafe_verde_formato_id, created_at desc);

alter table public.producto_terminado_produccion enable row level security;

create policy "producto_terminado_produccion_select_anon"
  on public.producto_terminado_produccion for select to anon using (true);

create policy "producto_terminado_produccion_insert_anon"
  on public.producto_terminado_produccion for insert to anon with check (true);
