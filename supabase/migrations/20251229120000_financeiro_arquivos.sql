create table if not exists public.financeiro_artes (
  id_arte uuid primary key references public.artes(id) on delete cascade,
  modelo_cobranca text not null default 'antes',
  status_pagamento text not null default 'pendente',
  valor_centavos integer not null default 0,
  cobrado_em date,
  pago_em date,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint financeiro_artes_modelo_cobranca_check check (modelo_cobranca in ('antes', 'depois', 'plano', 'cortesia')),
  constraint financeiro_artes_status_pagamento_check check (status_pagamento in ('pendente', 'paga', 'cortesia', 'plano')),
  constraint financeiro_artes_valor_centavos_check check (valor_centavos >= 0),
  constraint financeiro_artes_cortesia_check check (
    modelo_cobranca <> 'cortesia'
    or (status_pagamento = 'cortesia' and valor_centavos = 0)
  )
);

create index if not exists financeiro_artes_modelo_cobranca_idx on public.financeiro_artes (modelo_cobranca);
create index if not exists financeiro_artes_status_pagamento_idx on public.financeiro_artes (status_pagamento);

drop trigger if exists financeiro_artes_set_atualizado_em on public.financeiro_artes;
create trigger financeiro_artes_set_atualizado_em
before update on public.financeiro_artes
for each row execute function public.set_atualizado_em();

alter table public.financeiro_artes enable row level security;

drop policy if exists financeiro_artes_select_membro on public.financeiro_artes;
create policy financeiro_artes_select_membro on public.financeiro_artes
for select using (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = financeiro_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists financeiro_artes_insert_membro on public.financeiro_artes;
create policy financeiro_artes_insert_membro on public.financeiro_artes
for insert with check (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = financeiro_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists financeiro_artes_update_membro on public.financeiro_artes;
create policy financeiro_artes_update_membro on public.financeiro_artes
for update using (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = financeiro_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = financeiro_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists financeiro_artes_delete_membro on public.financeiro_artes;
create policy financeiro_artes_delete_membro on public.financeiro_artes
for delete using (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = financeiro_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

-- MODELO_POLITICA_ADMIN: aplicar em novas tabelas
drop policy if exists financeiro_artes_admin_all on public.financeiro_artes;
create policy financeiro_artes_admin_all on public.financeiro_artes
for all
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.arquivos_artes (
  id uuid primary key default gen_random_uuid(),
  id_arte uuid not null references public.artes(id) on delete cascade,
  nome_arquivo text not null,
  path text not null,
  tamanho_bytes integer,
  tipo_mime text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint arquivos_artes_path_unique unique (path)
);

create index if not exists arquivos_artes_id_arte_idx on public.arquivos_artes (id_arte);

drop trigger if exists arquivos_artes_set_atualizado_em on public.arquivos_artes;
create trigger arquivos_artes_set_atualizado_em
before update on public.arquivos_artes
for each row execute function public.set_atualizado_em();

alter table public.arquivos_artes enable row level security;

drop policy if exists arquivos_artes_select_membro on public.arquivos_artes;
create policy arquivos_artes_select_membro on public.arquivos_artes
for select using (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = arquivos_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists arquivos_artes_insert_membro on public.arquivos_artes;
create policy arquivos_artes_insert_membro on public.arquivos_artes
for insert with check (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = arquivos_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists arquivos_artes_update_membro on public.arquivos_artes;
create policy arquivos_artes_update_membro on public.arquivos_artes
for update using (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = arquivos_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = arquivos_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists arquivos_artes_delete_membro on public.arquivos_artes;
create policy arquivos_artes_delete_membro on public.arquivos_artes
for delete using (
  exists (
    select 1
    from public.artes a
    join public.conta_membros cm on cm.id_conta = a.id_conta
    where a.id = arquivos_artes.id_arte
      and cm.id_usuario = auth.uid()
  )
);

-- MODELO_POLITICA_ADMIN: aplicar em novas tabelas
drop policy if exists arquivos_artes_admin_all on public.arquivos_artes;
create policy arquivos_artes_admin_all on public.arquivos_artes
for all
using (public.is_admin())
with check (public.is_admin());

