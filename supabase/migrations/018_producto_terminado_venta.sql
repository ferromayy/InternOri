-- Salidas de stock por venta (producto terminado)

create table if not exists public.producto_terminado_venta (
  id uuid primary key default gen_random_uuid(),
  cafe_verde_formato_id uuid not null
    references public.cafe_verde_formatos_venta (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  unidades_restantes integer not null check (unidades_restantes >= 0),
  precio_venta numeric(14, 2) check (precio_venta is null or precio_venta >= 0),
  tipo_cliente text not null
    check (tipo_cliente in ('cliente_final', 'mayorista', 'oficina')),
  fecha date not null default (current_date),
  detalle text,
  created_at timestamptz not null default now()
);

create index if not exists producto_terminado_venta_fecha_idx
  on public.producto_terminado_venta (fecha desc, created_at desc);

create index if not exists producto_terminado_venta_formato_idx
  on public.producto_terminado_venta (cafe_verde_formato_id, fecha desc);

alter table public.producto_terminado_venta enable row level security;

create policy "producto_terminado_venta_select_anon"
  on public.producto_terminado_venta for select to anon using (true);

create policy "producto_terminado_venta_insert_anon"
  on public.producto_terminado_venta for insert to anon with check (true);
