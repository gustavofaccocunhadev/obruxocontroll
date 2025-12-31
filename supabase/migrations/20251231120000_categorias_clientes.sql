create table if not exists public.categorias_clientes (
  id uuid primary key default gen_random_uuid(),
  id_conta uuid not null references public.contas(id) on delete cascade,
  nome text not null,
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint categorias_clientes_nome_unique unique (id_conta, nome)
);

create index if not exists categorias_clientes_id_conta_idx on public.categorias_clientes (id_conta);

drop trigger if exists categorias_clientes_set_atualizado_em on public.categorias_clientes;
create trigger categorias_clientes_set_atualizado_em
before update on public.categorias_clientes
for each row execute function public.set_atualizado_em();

alter table public.categorias_clientes enable row level security;

drop policy if exists categorias_clientes_select_membro on public.categorias_clientes;
create policy categorias_clientes_select_membro on public.categorias_clientes
for select using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = categorias_clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists categorias_clientes_insert_membro on public.categorias_clientes;
create policy categorias_clientes_insert_membro on public.categorias_clientes
for insert with check (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = categorias_clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists categorias_clientes_update_membro on public.categorias_clientes;
create policy categorias_clientes_update_membro on public.categorias_clientes
for update using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = categorias_clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
) with check (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = categorias_clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists categorias_clientes_delete_membro on public.categorias_clientes;
create policy categorias_clientes_delete_membro on public.categorias_clientes
for delete using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = categorias_clientes.id_conta
      and cm.id_usuario = auth.uid()
  )
);

-- MODELO_POLITICA_ADMIN: aplicar em novas tabelas
drop policy if exists categorias_clientes_admin_all on public.categorias_clientes;
create policy categorias_clientes_admin_all on public.categorias_clientes
for all
using (public.is_admin())
with check (public.is_admin());

alter table public.clientes
  add column if not exists id_categoria uuid references public.categorias_clientes(id);

create index if not exists clientes_id_categoria_idx on public.clientes (id_categoria);

insert into public.categorias_clientes (id_conta, nome)
select c.id, v.nome
from public.contas c
cross join (
  values ('Time'), ('Empresa'), ('Atleta'), ('Outro')
) v(nome)
on conflict (id_conta, nome) do nothing;

update public.clientes c
set id_categoria = cat.id
from public.categorias_clientes cat
where cat.id_conta = c.id_conta
  and cat.nome = case c.tipo
    when 'time' then 'Time'
    when 'empresa' then 'Empresa'
    when 'atleta' then 'Atleta'
    else 'Outro'
  end;

update public.clientes c
set id_categoria = cat.id
from public.categorias_clientes cat
where c.id_categoria is null
  and cat.id_conta = c.id_conta
  and cat.nome = 'Outro';

alter table public.clientes
  alter column id_categoria set not null;

alter table public.clientes drop constraint if exists clientes_tipo_check;
alter table public.clientes drop column if exists tipo;
