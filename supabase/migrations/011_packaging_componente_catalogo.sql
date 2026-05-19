-- Catálogo global de componentes de packaging (stock compartido)

create table if not exists public.packaging_componente (
  id uuid primary key default gen_random_uuid(),
  componente text not null,
  tipo text not null,
  cantidad numeric(14, 2) not null default 0 check (cantidad >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packaging_componente_componente_check
    check (componente in ('sticker', 'bolsa_cafe', 'bolsa_sosten', 'caja', 'sobre', 'tarjeta')),
  constraint packaging_componente_unique unique (componente, tipo)
);

create index if not exists packaging_componente_componente_tipo_idx
  on public.packaging_componente (componente, tipo);

drop trigger if exists packaging_componente_updated_at on public.packaging_componente;
create trigger packaging_componente_updated_at
  before update on public.packaging_componente
  for each row execute function public.set_updated_at();

alter table public.packaging_componente enable row level security;

create policy "packaging_componente_select_anon"
  on public.packaging_componente for select to anon using (true);

create policy "packaging_componente_insert_anon"
  on public.packaging_componente for insert to anon with check (true);

create policy "packaging_componente_update_anon"
  on public.packaging_componente for update to anon using (true) with check (true);

create policy "packaging_componente_delete_anon"
  on public.packaging_componente for delete to anon using (true);

-- Vincular requisitos al catálogo
alter table public.packaging_requisito
  add column if not exists packaging_componente_id uuid
    references public.packaging_componente (id) on delete restrict;

-- Migrar filas existentes: un ítem de catálogo por (componente, tipo), stock = suma
insert into public.packaging_componente (componente, tipo, cantidad)
select componente, tipo, coalesce(sum(cantidad), 0)
from public.packaging_requisito
group by componente, tipo
on conflict (componente, tipo) do update
  set cantidad = excluded.cantidad;

update public.packaging_requisito pr
set packaging_componente_id = pc.id
from public.packaging_componente pc
where pr.componente = pc.componente
  and pr.tipo = pc.tipo
  and pr.packaging_componente_id is null;

alter table public.packaging_requisito
  drop constraint if exists packaging_requisito_unique;

alter table public.packaging_requisito
  add constraint packaging_requisito_formato_componente_unique
    unique (cafe_verde_formato_id, packaging_componente_id);

create index if not exists packaging_requisito_componente_id_idx
  on public.packaging_requisito (packaging_componente_id);
