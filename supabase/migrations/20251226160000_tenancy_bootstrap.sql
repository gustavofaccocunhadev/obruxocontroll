create extension if not exists "pgcrypto";

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Minha conta',
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.conta_membros (
  id_conta uuid not null references public.contas(id) on delete cascade,
  id_usuario uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'dono',
  criado_em timestamptz not null default now(),
  primary key (id_conta, id_usuario),
  constraint conta_membros_papel_check check (papel in ('dono', 'membro'))
);

create index if not exists conta_membros_id_usuario_idx on public.conta_membros (id_usuario);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists perfis_set_atualizado_em on public.perfis;
create trigger perfis_set_atualizado_em
before update on public.perfis
for each row execute function public.set_atualizado_em();

drop trigger if exists contas_set_atualizado_em on public.contas;
create trigger contas_set_atualizado_em
before update on public.contas
for each row execute function public.set_atualizado_em();

create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, nullif(new.raw_user_meta_data->>'nome', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_novo_usuario();

alter table public.perfis enable row level security;
alter table public.contas enable row level security;
alter table public.conta_membros enable row level security;

drop policy if exists perfis_select_own on public.perfis;
create policy perfis_select_own on public.perfis
for select using (id = auth.uid());

drop policy if exists perfis_insert_own on public.perfis;
create policy perfis_insert_own on public.perfis
for insert with check (id = auth.uid());

drop policy if exists perfis_update_own on public.perfis;
create policy perfis_update_own on public.perfis
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists contas_select_membro on public.contas;
create policy contas_select_membro on public.contas
for select using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = contas.id
      and cm.id_usuario = auth.uid()
  )
);

drop policy if exists contas_insert_propria on public.contas;
create policy contas_insert_propria on public.contas
for insert with check (criado_por = auth.uid());

drop policy if exists contas_update_dono on public.contas;
create policy contas_update_dono on public.contas
for update using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = contas.id
      and cm.id_usuario = auth.uid()
      and cm.papel = 'dono'
  )
) with check (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = contas.id
      and cm.id_usuario = auth.uid()
      and cm.papel = 'dono'
  )
);

drop policy if exists contas_delete_dono on public.contas;
create policy contas_delete_dono on public.contas
for delete using (
  exists (
    select 1 from public.conta_membros cm
    where cm.id_conta = contas.id
      and cm.id_usuario = auth.uid()
      and cm.papel = 'dono'
  )
);

drop policy if exists conta_membros_select_own on public.conta_membros;
create policy conta_membros_select_own on public.conta_membros
for select using (id_usuario = auth.uid());

drop policy if exists conta_membros_insert_bootstrap on public.conta_membros;
create policy conta_membros_insert_bootstrap on public.conta_membros
for insert with check (
  id_usuario = auth.uid()
  and exists (
    select 1 from public.contas c
    where c.id = conta_membros.id_conta
      and c.criado_por = auth.uid()
  )
);
