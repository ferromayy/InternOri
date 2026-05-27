-- Reset de datos de inventario (esquema intacto).
-- Ejecutar en Supabase → SQL Editor (recomendado: borra todo de una vez).

begin;

truncate table public.producto_terminado_produccion_consumo restart identity cascade;
truncate table public.producto_terminado_produccion restart identity cascade;
truncate table public.producto_terminado_venta restart identity cascade;
truncate table public.packaging_componente_ingreso restart identity cascade;
truncate table public.packaging_requisito restart identity cascade;
truncate table public.packaging_componente restart identity cascade;
truncate table public.cafe_tostado restart identity cascade;
truncate table public.cafe_verde_formatos_venta restart identity cascade;
truncate table public.cafe_verde restart identity cascade;

commit;

-- Verificación opcional:
-- select 'cafe_verde' as t, count(*) from cafe_verde
-- union all select 'cafe_tostado', count(*) from cafe_tostado
-- union all select 'packaging_componente', count(*) from packaging_componente
-- union all select 'packaging_requisito', count(*) from packaging_requisito
-- union all select 'packaging_componente_ingreso', count(*) from packaging_componente_ingreso
-- union all select 'producto_terminado_produccion', count(*) from producto_terminado_produccion
-- union all select 'producto_terminado_venta', count(*) from producto_terminado_venta;
