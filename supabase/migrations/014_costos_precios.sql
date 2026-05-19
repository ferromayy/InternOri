-- Costo del ingreso de café verde y precio de venta por formato (SKU)

alter table public.cafe_verde
  add column if not exists costo_total_ars numeric(14, 2) check (costo_total_ars is null or costo_total_ars >= 0),
  add column if not exists costo_total_usd numeric(14, 2) check (costo_total_usd is null or costo_total_usd >= 0);

alter table public.cafe_verde_formatos_venta
  add column if not exists precio_venta_ars numeric(14, 2) check (precio_venta_ars is null or precio_venta_ars >= 0),
  add column if not exists precio_venta_usd numeric(14, 2) check (precio_venta_usd is null or precio_venta_usd >= 0);
