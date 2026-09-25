alter table public.books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reader_preferences enable row level security;
alter table public.book_deletions enable row level security;

revoke all on public.books from anon;
revoke all on public.reading_progress from anon;
revoke all on public.reader_preferences from anon;
revoke all on public.book_deletions from anon;

grant select, insert, update, delete on public.books to authenticated;
grant select, insert, update, delete on public.reading_progress to authenticated;
grant select, insert, update, delete on public.reader_preferences to authenticated;
grant select, insert, update, delete on public.book_deletions to authenticated;
revoke execute on function public.sync_reading_progress(uuid, text, numeric, timestamptz) from public, anon;
revoke execute on function public.sync_reader_preferences(text, text, text, smallint, numeric, text, timestamptz) from public, anon;
revoke execute on function public.delete_owned_book(uuid) from public, anon;
grant execute on function public.sync_reading_progress(uuid, text, numeric, timestamptz) to authenticated;
grant execute on function public.sync_reader_preferences(text, text, text, smallint, numeric, text, timestamptz) to authenticated;
grant execute on function public.delete_owned_book(uuid) to authenticated;

create policy "Users read their books" on public.books
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert their books" on public.books
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their books" on public.books
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users delete their books" on public.books
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read their progress" on public.reading_progress
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert their progress" on public.reading_progress
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their progress" on public.reading_progress
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users delete their progress" on public.reading_progress
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read their preferences" on public.reader_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert their preferences" on public.reader_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their preferences" on public.reader_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users delete their preferences" on public.reader_preferences
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read their deletions" on public.book_deletions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert their deletions" on public.book_deletions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their deletions" on public.book_deletions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users delete their deletions" on public.book_deletions
for delete to authenticated using ((select auth.uid()) = user_id);
