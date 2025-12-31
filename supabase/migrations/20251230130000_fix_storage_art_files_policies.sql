-- Remove policies created for uppercase bucket_id 'ART-FILES' on storage.objects
-- so only the lowercase art-files policies remain.
drop policy if exists "SELECT" on storage.objects;
drop policy if exists "INSERT" on storage.objects;
drop policy if exists "UPDATE" on storage.objects;
drop policy if exists "DELETE" on storage.objects;
