-- Varios formatos de venta por lote de café verde

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

-- Migrar columna simple si existía (006)
insert into public.cafe_verde_formatos_venta (cafe_verde_id, formato_venta)
select cv.id, cv.formato_venta
from public.cafe_verde cv
where cv.formato_venta is not null
on conflict (cafe_verde_id, formato_venta) do nothing;

alter table public.cafe_verde drop column if exists formato_venta;

alter table public.cafe_verde_formatos_venta enable row level security;

create policy "cafe_verde_formatos_select_anon"
  on public.cafe_verde_formatos_venta for select to anon using (true);

create policy "cafe_verde_formatos_insert_anon"
  on public.cafe_verde_formatos_venta for insert to anon with check (true);

create policy "cafe_verde_formatos_delete_anon"
  on public.cafe_verde_formatos_venta for delete to anon using (true);
