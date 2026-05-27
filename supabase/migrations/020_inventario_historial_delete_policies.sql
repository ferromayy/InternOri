-- Permite borrar historial (reset) con el cliente anon

drop policy if exists "producto_terminado_produccion_delete_anon" on public.producto_terminado_produccion;
create policy "producto_terminado_produccion_delete_anon"
  on public.producto_terminado_produccion for delete to anon using (true);

drop policy if exists "producto_terminado_produccion_consumo_delete_anon" on public.producto_terminado_produccion_consumo;
create policy "producto_terminado_produccion_consumo_delete_anon"
  on public.producto_terminado_produccion_consumo for delete to anon using (true);

drop policy if exists "producto_terminado_venta_delete_anon" on public.producto_terminado_venta;
create policy "producto_terminado_venta_delete_anon"
  on public.producto_terminado_venta for delete to anon using (true);

drop policy if exists "packaging_componente_ingreso_delete_anon" on public.packaging_componente_ingreso;
create policy "packaging_componente_ingreso_delete_anon"
  on public.packaging_componente_ingreso for delete to anon using (true);
