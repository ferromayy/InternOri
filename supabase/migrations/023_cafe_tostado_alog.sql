-- Archivos .alog asociados a café tostado (1..5 por registro)
-- Storage bucket + tabla de referencias.

-- Bucket (idempotente)
insert into storage.buckets (id, name, public)
values ('cafe-tostado-alog', 'cafe-tostado-alog', false)
on conflict (id) do nothing;

-- Tabla de referencias
create table if not exists public.cafe_tostado_alog (
  id uuid primary key default gen_random_uuid(),
  cafe_tostado_id uuid not null references public.cafe_tostado (id) on delete cascade,
  filename text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint cafe_tostado_alog_unique unique (cafe_tostado_id, storage_path)
);

create index if not exists cafe_tostado_alog_tostado_idx
  on public.cafe_tostado_alog (cafe_tostado_id, created_at desc);

alter table public.cafe_tostado_alog enable row level security;

drop policy if exists "cafe_tostado_alog_select_anon" on public.cafe_tostado_alog;
create policy "cafe_tostado_alog_select_anon"
  on public.cafe_tostado_alog for select to anon using (true);

drop policy if exists "cafe_tostado_alog_insert_anon" on public.cafe_tostado_alog;
create policy "cafe_tostado_alog_insert_anon"
  on public.cafe_tostado_alog for insert to anon with check (true);

drop policy if exists "cafe_tostado_alog_delete_anon" on public.cafe_tostado_alog;
create policy "cafe_tostado_alog_delete_anon"
  on public.cafe_tostado_alog for delete to anon using (true);

-- Policies para Storage (bucket cafe-tostado-alog)
-- Nota: esto permite subir y leer con anon (igual que el resto del inventario en esta app).
drop policy if exists "cafe_tostado_alog_storage_select_anon" on storage.objects;
create policy "cafe_tostado_alog_storage_select_anon"
  on storage.objects for select to anon
  using (bucket_id = 'cafe-tostado-alog');

drop policy if exists "cafe_tostado_alog_storage_insert_anon" on storage.objects;
create policy "cafe_tostado_alog_storage_insert_anon"
  on storage.objects for insert to anon
  with check (bucket_id = 'cafe-tostado-alog');

drop policy if exists "cafe_tostado_alog_storage_delete_anon" on storage.objects;
create policy "cafe_tostado_alog_storage_delete_anon"
  on storage.objects for delete to anon
  using (bucket_id = 'cafe-tostado-alog');

