update public.artes
set status = 'pendente'
where status = 'backlog';

alter table public.artes
  alter column status set default 'pendente';

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join unnest(c.conkey) with ordinality as cols(attnum, ord) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = cols.attnum
    where n.nspname = 'public'
      and t.relname = 'artes'
      and c.contype = 'c'
      and a.attname = 'status'
  loop
    execute format('alter table public.artes drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.artes
  add constraint artes_status_check
  check (status in ('pendente', 'em_producao', 'pronta', 'entregue', 'cancelada'));
