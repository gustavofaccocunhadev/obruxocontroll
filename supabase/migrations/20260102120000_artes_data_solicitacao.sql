alter table public.artes
  add column if not exists data_solicitacao date;

update public.artes
  set data_solicitacao = criado_em::date
  where data_solicitacao is null;

alter table public.artes
  alter column data_solicitacao set default current_date,
  alter column data_solicitacao set not null;
