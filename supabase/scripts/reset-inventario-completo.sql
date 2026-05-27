-- ═══════════════════════════════════════════════════════════════════
-- BORRADO TOTAL DE INVENTARIO (datos de prueba → empezar de cero)
-- Pegá todo este archivo en Supabase → SQL Editor → Run
-- No borra usuarios de auth ni health_check.
-- ═══════════════════════════════════════════════════════════════════

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

-- Comprobación (deberían dar 0 en todo):
select 'cafe_verde' as tabla, count(*)::int as filas from public.cafe_verde
union all select 'cafe_tostado', count(*)::int from public.cafe_tostado
union all select 'formatos_venta', count(*)::int from public.cafe_verde_formatos_venta
union all select 'packaging_componente', count(*)::int from public.packaging_componente
union all select 'packaging_requisito', count(*)::int from public.packaging_requisito
union all select 'produccion', count(*)::int from public.producto_terminado_produccion
union all select 'ventas', count(*)::int from public.producto_terminado_venta
union all select 'ingresos_packaging', count(*)::int from public.packaging_componente_ingreso
order by tabla;
