-- Agrega la categoría "otro" para packaging (catálogo y requisitos).
-- Ejecutar en Supabase si tu DB ya existía antes de este cambio.

alter table public.packaging_componente
  drop constraint if exists packaging_componente_componente_check;

alter table public.packaging_componente
  add constraint packaging_componente_componente_check
  check (componente in ('sticker', 'bolsa_cafe', 'bolsa_sosten', 'caja', 'sobre', 'tarjeta', 'otro'));

alter table public.packaging_requisito
  drop constraint if exists packaging_requisito_componente_check;

alter table public.packaging_requisito
  add constraint packaging_requisito_componente_check
  check (componente in ('sticker', 'bolsa_cafe', 'bolsa_sosten', 'caja', 'sobre', 'tarjeta', 'otro'));

