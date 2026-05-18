-- Si ya ejecutaste 002_cafe_verde.sql antes, corré solo este archivo.

alter table public.cafe_verde
  add column if not exists codigo text;

update public.cafe_verde
set codigo = 'LEG-' || left(id::text, 8)
where codigo is null;

alter table public.cafe_verde
  alter column codigo set not null;

create unique index if not exists cafe_verde_codigo_key on public.cafe_verde (codigo);
