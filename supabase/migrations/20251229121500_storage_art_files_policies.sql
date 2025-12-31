drop policy if exists art_files_select_membro on storage.objects;
create policy art_files_select_membro on storage.objects
for select
using (
  bucket_id = 'art-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.conta_membros cm
      where cm.id_usuario = auth.uid()
        and cm.id_conta::text = split_part(name, '/', 1)
    )
  )
);

drop policy if exists art_files_insert_membro on storage.objects;
create policy art_files_insert_membro on storage.objects
for insert
with check (
  bucket_id = 'art-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.conta_membros cm
      where cm.id_usuario = auth.uid()
        and cm.id_conta::text = split_part(name, '/', 1)
    )
  )
);

drop policy if exists art_files_update_membro on storage.objects;
create policy art_files_update_membro on storage.objects
for update
using (
  bucket_id = 'art-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.conta_membros cm
      where cm.id_usuario = auth.uid()
        and cm.id_conta::text = split_part(name, '/', 1)
    )
  )
)
with check (
  bucket_id = 'art-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.conta_membros cm
      where cm.id_usuario = auth.uid()
        and cm.id_conta::text = split_part(name, '/', 1)
    )
  )
);

drop policy if exists art_files_delete_membro on storage.objects;
create policy art_files_delete_membro on storage.objects
for delete
using (
  bucket_id = 'art-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.conta_membros cm
      where cm.id_usuario = auth.uid()
        and cm.id_conta::text = split_part(name, '/', 1)
    )
  )
);
