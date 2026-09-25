-- Wrap auth.jwt() in a scalar subquery so Postgres evaluates it once per
-- statement, not once per row. Also close two advisor findings.

drop policy "Users read their books" on public.books;
drop policy "Users insert their books" on public.books;
drop policy "Users update their books" on public.books;
drop policy "Users delete their books" on public.books;
drop policy "Users read their progress" on public.reading_progress;
drop policy "Users insert their progress" on public.reading_progress;
drop policy "Users update their progress" on public.reading_progress;
drop policy "Users delete their progress" on public.reading_progress;
drop policy "Users read their preferences" on public.reader_preferences;
drop policy "Users insert their preferences" on public.reader_preferences;
drop policy "Users update their preferences" on public.reader_preferences;
drop policy "Users delete their preferences" on public.reader_preferences;
drop policy "Users read their deletions" on public.book_deletions;
drop policy "Users insert their deletions" on public.book_deletions;
drop policy "Users update their deletions" on public.book_deletions;
drop policy "Users delete their deletions" on public.book_deletions;
drop policy "Users read their EPUBs" on storage.objects;
drop policy "Users upload their EPUBs" on storage.objects;
drop policy "Users update their EPUBs" on storage.objects;
drop policy "Users delete their EPUBs" on storage.objects;
drop policy "Users read their covers" on storage.objects;
drop policy "Users upload their covers" on storage.objects;
drop policy "Users update their covers" on storage.objects;
drop policy "Users delete their covers" on storage.objects;

create policy "Users read their books" on public.books
for select to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users insert their books" on public.books
for insert to authenticated with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users update their books" on public.books
for update to authenticated
using (((select auth.jwt()) ->> 'sub') = user_id)
with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users delete their books" on public.books
for delete to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users read their progress" on public.reading_progress
for select to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users insert their progress" on public.reading_progress
for insert to authenticated with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users update their progress" on public.reading_progress
for update to authenticated
using (((select auth.jwt()) ->> 'sub') = user_id)
with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users delete their progress" on public.reading_progress
for delete to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users read their preferences" on public.reader_preferences
for select to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users insert their preferences" on public.reader_preferences
for insert to authenticated with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users update their preferences" on public.reader_preferences
for update to authenticated
using (((select auth.jwt()) ->> 'sub') = user_id)
with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users delete their preferences" on public.reader_preferences
for delete to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users read their deletions" on public.book_deletions
for select to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users insert their deletions" on public.book_deletions
for insert to authenticated with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users update their deletions" on public.book_deletions
for update to authenticated
using (((select auth.jwt()) ->> 'sub') = user_id)
with check (((select auth.jwt()) ->> 'sub') = user_id);
create policy "Users delete their deletions" on public.book_deletions
for delete to authenticated using (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users read their EPUBs" on storage.objects
for select to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));
create policy "Users upload their EPUBs" on storage.objects
for insert to authenticated
with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));
create policy "Users update their EPUBs" on storage.objects
for update to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'))
with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));
create policy "Users delete their EPUBs" on storage.objects
for delete to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));

create policy "Users read their covers" on storage.objects
for select to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));
create policy "Users upload their covers" on storage.objects
for insert to authenticated
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));
create policy "Users update their covers" on storage.objects
for update to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'))
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));
create policy "Users delete their covers" on storage.objects
for delete to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = ((select auth.jwt()) ->> 'sub'));

create index reading_progress_book_owner_idx
  on public.reading_progress (book_id, user_id);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
