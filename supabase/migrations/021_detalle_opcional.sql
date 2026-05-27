-- Campo opcional "detalle" en ingresos operativos

alter table public.cafe_verde
  add column if not exists detalle text;

alter table public.cafe_tostado
  add column if not exists detalle text;

alter table public.packaging_componente
  add column if not exists detalle text;

alter table public.producto_terminado_produccion
  add column if not exists detalle text;
