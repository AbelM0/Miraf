insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'epubs', 'epubs', false, 52428800,
  array['application/epub+zip']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers', 'covers', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read their EPUBs" on storage.objects
for select to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload their EPUBs" on storage.objects
for insert to authenticated
with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update their EPUBs" on storage.objects
for update to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete their EPUBs" on storage.objects
for delete to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users read their covers" on storage.objects
for select to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload their covers" on storage.objects
for insert to authenticated
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update their covers" on storage.objects
for update to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete their covers" on storage.objects
for delete to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);

