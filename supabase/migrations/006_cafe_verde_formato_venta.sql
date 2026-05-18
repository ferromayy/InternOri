-- Formato de venta en café verde

alter table public.cafe_verde
  add column if not exists formato_venta text;

update public.cafe_verde
set formato_venta = '250g'
where formato_venta is null;

alter table public.cafe_verde
  alter column formato_venta set not null;

alter table public.cafe_verde
  drop constraint if exists cafe_verde_formato_venta_check;

alter table public.cafe_verde
  add constraint cafe_verde_formato_venta_check
  check (formato_venta in ('50g', '100g', '125g', '150g', '200g', '250g', '500g', '1kg'));
