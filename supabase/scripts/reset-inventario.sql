-- Reset de datos de inventario (esquema intacto).
-- Ejecutar en Supabase → SQL Editor si el script Node no puede por RLS.

-- Ejecutá también 012_inventario_delete_policies.sql si querés resetear desde la app después.

begin;

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
-- union all select 'packaging_requisito', count(*) from packaging_requisito;
