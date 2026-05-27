-- Permite guardar receta y unidades en producto terminado (faltaba policy de UPDATE)

drop policy if exists "cafe_verde_formatos_update_anon" on public.cafe_verde_formatos_venta;

create policy "cafe_verde_formatos_update_anon"
  on public.cafe_verde_formatos_venta
  for update
  to anon
  using (true)
  with check (true);
