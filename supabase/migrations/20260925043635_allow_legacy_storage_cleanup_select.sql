-- Historical one-time cleanup policy. Removed by 20260925043653.
create policy "One-time legacy EPUB cleanup read" on storage.objects
for select to anon
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = '9fe017cb-5d3c-4127-83c8-245d96107575');

create policy "One-time legacy cover cleanup read" on storage.objects
for select to anon
using (bucket_id = 'covers' and (storage.foldername(name))[1] = '9fe017cb-5d3c-4127-83c8-245d96107575');
