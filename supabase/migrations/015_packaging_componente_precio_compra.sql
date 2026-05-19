-- Precio de compra por ítem del catálogo de packaging

alter table public.packaging_componente
  add column if not exists precio_compra_ars numeric(14, 2) check (precio_compra_ars is null or precio_compra_ars >= 0),
  add column if not exists precio_compra_usd numeric(14, 2) check (precio_compra_usd is null or precio_compra_usd >= 0);
