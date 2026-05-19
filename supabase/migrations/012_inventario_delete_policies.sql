-- Permite borrar filas de inventario (reset / correcciones) con el cliente anon de la app

drop policy if exists "cafe_verde_delete_anon" on public.cafe_verde;
create policy "cafe_verde_delete_anon"
  on public.cafe_verde for delete to anon using (true);

drop policy if exists "cafe_tostado_delete_anon" on public.cafe_tostado;
create policy "cafe_tostado_delete_anon"
  on public.cafe_tostado for delete to anon using (true);
