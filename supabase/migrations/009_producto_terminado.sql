-- Producto terminado: receta por formato + unidades producidas

alter table public.cafe_verde_formatos_venta
  add column if not exists kg_tostado_por_unidad_gr numeric(14, 2),
  add column if not exists receta_bloqueada boolean not null default false,
  add column if not exists unidades_producidas numeric(14, 2) not null default 0 check (unidades_producidas >= 0);

alter table public.packaging_requisito
  add column if not exists cantidad_por_unidad numeric(14, 2) not null default 0 check (cantidad_por_unidad >= 0);
