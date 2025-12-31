create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  id_conta uuid not null references public.contas(id) on delete cascade,
  nome text not null,
  whatsapp text,
  instagram text,
  tipo text not null default 'outro',
  cidade text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint clientes_tipo_check check (tipo in ('time', 'empresa', 'atleta', 'outro'))
);

create index if not exists clientes_id_conta_idx on public.clientes (id_conta);
create index if not exists clientes_nome_idx on public.clientes (nome);

drop trigger if exists clientes_set_atualizado_em on public.clientes;
create trigger clientes_set_atualizado_em
before update on public.clientes
for each row execute function public.set_atualizado_em();

alter table public.clientes enable row level security;

drop policy if exists clientes_select_membro on public.clientes;
create policy clientes_select_membro on public.clientes
for select using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists clientes_insert_membro on public.clientes;
create policy clientes_insert_membro on public.clientes
for insert with check (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists clientes_update_membro on public.clientes;
create policy clientes_update_membro on public.clientes
for update using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
) with check (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists clientes_delete_membro on public.clientes;
create policy clientes_delete_membro on public.clientes
for delete using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

-- MODELO_POLITICA_ADMIN: aplicar em novas tabelas
drop policy if exists clientes_admin_all on public.clientes;
create policy clientes_admin_all on public.clientes
for all
using (public.is_admin())
with check (public.is_admin());

