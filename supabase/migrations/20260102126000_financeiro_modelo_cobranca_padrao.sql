alter table public.financeiro_artes
  drop constraint if exists financeiro_artes_modelo_cobranca_check;

update public.financeiro_artes
  set modelo_cobranca = 'padrao'
  where modelo_cobranca in ('antes', 'depois');

alter table public.financeiro_artes
  alter column modelo_cobranca set default 'padrao';

alter table public.financeiro_artes
  add constraint financeiro_artes_modelo_cobranca_check
  check (modelo_cobranca in ('padrao', 'plano', 'cortesia', 'parceria'));
