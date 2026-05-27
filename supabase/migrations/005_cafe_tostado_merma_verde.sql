-- Después de 004_cafe_tostado.sql (esquema actual).
-- Solo asegura constraints / FK. No referencia columnas viejas (kg_tostados_gr).
-- Si tenías un 004 muy antiguo, usá supabase/scripts/upgrade-cafe-tostado-legacy.sql

alter table public.cafe_tostado drop constraint if exists cafe_tostado_kg_vendidos_lte_tostados;

alter table public.cafe_tostado
  drop constraint if exists cafe_tostado_kg_vendidos_lte_despues;

alter table public.cafe_tostado
  add constraint cafe_tostado_kg_vendidos_lte_despues
  check (kg_vendidos_gr <= kg_despues_tostar_gr);

alter table public.cafe_tostado drop constraint if exists cafe_tostado_merma_no_negativa;

alter table public.cafe_tostado
  add constraint cafe_tostado_merma_no_negativa
  check (kg_despues_tostar_gr <= kg_verde_tostado_gr);

alter table public.cafe_tostado drop constraint if exists cafe_tostado_cafe_verde_fkey;

alter table public.cafe_tostado
  add constraint cafe_tostado_cafe_verde_fkey
  foreign key (cafe_verde_codigo) references public.cafe_verde (codigo);
