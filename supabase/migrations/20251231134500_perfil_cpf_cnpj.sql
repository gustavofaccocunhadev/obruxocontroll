alter table public.perfis
  add column if not exists cpf_cnpj text;

create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, cpf_cnpj)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'nome', ''),
    nullif(new.raw_user_meta_data->>'cpf_cnpj', '')
  )
  on conflict (id) do update
    set nome = coalesce(excluded.nome, perfis.nome),
        cpf_cnpj = coalesce(excluded.cpf_cnpj, perfis.cpf_cnpj);
  return new;
end;
$$;
