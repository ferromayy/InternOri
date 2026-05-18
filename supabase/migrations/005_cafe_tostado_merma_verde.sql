-- Si ya ejecutaste 004_cafe_tostado.sql, corré este archivo.

alter table public.cafe_tostado
  add column if not exists cafe_verde_codigo text,
  add column if not exists kg_verde_tostado_gr numeric(14, 2),
  add column if not exists kg_despues_tostar_gr numeric(14, 2);

-- Migrar datos viejos si existían columnas anteriores
update public.cafe_tostado
set kg_despues_tostar_gr = kg_tostados_gr
where kg_despues_tostar_gr is null
  and kg_tostados_gr is not null;

update public.cafe_tostado
set kg_verde_tostado_gr = kg_tostados_gr + coalesce(merma, 0)
where kg_verde_tostado_gr is null
  and kg_tostados_gr is not null;

update public.cafe_tostado
set cafe_verde_codigo = codigo
where cafe_verde_codigo is null
  and codigo is not null;

alter table public.cafe_tostado drop column if exists kg_existentes_gr;

alter table public.cafe_tostado
  drop column if exists merma,
  drop column if exists kg_tostados_gr;

alter table public.cafe_tostado
  alter column cafe_verde_codigo set not null,
  alter column kg_verde_tostado_gr set not null,
  alter column kg_despues_tostar_gr set not null;

alter table public.cafe_tostado
  add column if not exists merma_gr numeric(14, 2)
    generated always as (kg_verde_tostado_gr - kg_despues_tostar_gr) stored,
  add column if not exists kg_existentes_gr numeric(14, 2)
    generated always as (kg_despues_tostar_gr - kg_vendidos_gr) stored;

alter table public.cafe_tostado drop constraint if exists cafe_tostado_kg_vendidos_lte_tostados;
alter table public.cafe_tostado
  add constraint cafe_tostado_kg_vendidos_lte_despues
  check (kg_vendidos_gr <= kg_despues_tostar_gr);

alter table public.cafe_tostado
  add constraint cafe_tostado_merma_no_negativa
  check (kg_despues_tostar_gr <= kg_verde_tostado_gr);

alter table public.cafe_tostado drop constraint if exists cafe_tostado_cafe_verde_fkey;
alter table public.cafe_tostado
  add constraint cafe_tostado_cafe_verde_fkey
  foreign key (cafe_verde_codigo) references public.cafe_verde (codigo);
