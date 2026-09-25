-- Clerk user IDs are opaque strings (for example, user_...). Supabase accepts
-- Clerk session tokens as third-party JWTs and exposes the Clerk ID in `sub`.

drop policy if exists "Users read their books" on public.books;
drop policy if exists "Users insert their books" on public.books;
drop policy if exists "Users update their books" on public.books;
drop policy if exists "Users delete their books" on public.books;
drop policy if exists "Users read their progress" on public.reading_progress;
drop policy if exists "Users insert their progress" on public.reading_progress;
drop policy if exists "Users update their progress" on public.reading_progress;
drop policy if exists "Users delete their progress" on public.reading_progress;
drop policy if exists "Users read their preferences" on public.reader_preferences;
drop policy if exists "Users insert their preferences" on public.reader_preferences;
drop policy if exists "Users update their preferences" on public.reader_preferences;
drop policy if exists "Users delete their preferences" on public.reader_preferences;
drop policy if exists "Users read their deletions" on public.book_deletions;
drop policy if exists "Users insert their deletions" on public.book_deletions;
drop policy if exists "Users update their deletions" on public.book_deletions;
drop policy if exists "Users delete their deletions" on public.book_deletions;

drop policy if exists "Users read their EPUBs" on storage.objects;
drop policy if exists "Users upload their EPUBs" on storage.objects;
drop policy if exists "Users update their EPUBs" on storage.objects;
drop policy if exists "Users delete their EPUBs" on storage.objects;
drop policy if exists "Users read their covers" on storage.objects;
drop policy if exists "Users upload their covers" on storage.objects;
drop policy if exists "Users update their covers" on storage.objects;
drop policy if exists "Users delete their covers" on storage.objects;

alter table public.reading_progress drop constraint reading_progress_owned_book_fk;
alter table public.books drop constraint books_user_id_fkey;
alter table public.reader_preferences drop constraint reader_preferences_user_id_fkey;
alter table public.book_deletions drop constraint book_deletions_user_id_fkey;

alter table public.books alter column user_id type text using user_id::text;
alter table public.reading_progress alter column user_id type text using user_id::text;
alter table public.reader_preferences alter column user_id type text using user_id::text;
alter table public.book_deletions alter column user_id type text using user_id::text;

alter table public.reading_progress
  add constraint reading_progress_owned_book_fk
  foreign key (book_id, user_id)
  references public.books(id, user_id)
  on delete cascade;

create or replace function public.sync_reading_progress(
  p_book_id uuid,
  p_cfi text,
  p_percentage numeric,
  p_changed_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected integer;
  clerk_user_id text := (select auth.jwt() ->> 'sub');
begin
  if clerk_user_id is null then
    return false;
  end if;

  insert into public.reading_progress (
    book_id, user_id, cfi, percentage, changed_at, server_updated_at
  )
  select b.id, b.user_id, p_cfi, greatest(0, least(100, p_percentage)), p_changed_at, now()
  from public.books b
  where b.id = p_book_id
    and b.user_id = clerk_user_id
    and b.upload_status = 'ready'
  on conflict (book_id) do update
  set cfi = excluded.cfi,
      percentage = excluded.percentage,
      changed_at = excluded.changed_at,
      server_updated_at = now()
  where excluded.changed_at > public.reading_progress.changed_at;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

create or replace function public.sync_reader_preferences(
  p_theme text,
  p_flow text,
  p_font_family text,
  p_font_size smallint,
  p_line_height numeric,
  p_content_width text,
  p_changed_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected integer;
  clerk_user_id text := (select auth.jwt() ->> 'sub');
begin
  if clerk_user_id is null then
    return false;
  end if;

  insert into public.reader_preferences (
    user_id, theme, flow, font_family, font_size, line_height,
    content_width, changed_at, server_updated_at
  ) values (
    clerk_user_id, p_theme, p_flow, p_font_family, p_font_size,
    p_line_height, p_content_width, p_changed_at, now()
  )
  on conflict (user_id) do update
  set theme = excluded.theme,
      flow = excluded.flow,
      font_family = excluded.font_family,
      font_size = excluded.font_size,
      line_height = excluded.line_height,
      content_width = excluded.content_width,
      changed_at = excluded.changed_at,
      server_updated_at = now()
  where excluded.changed_at > public.reader_preferences.changed_at;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

create or replace function public.delete_owned_book(p_book_id uuid)
returns table (epub_storage_path text, cover_storage_path text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  clerk_user_id text := (select auth.jwt() ->> 'sub');
begin
  return query
  with owned as (
    select b.id, b.user_id, b.epub_storage_path, b.cover_storage_path
    from public.books b
    where b.id = p_book_id and b.user_id = clerk_user_id
  ), tombstone as (
    insert into public.book_deletions (user_id, book_id)
    select owned.user_id, owned.id from owned
    on conflict (user_id, book_id)
    do update set deleted_at = now()
    returning book_id
  ), removed as (
    delete from public.books b
    using owned, tombstone
    where b.id = owned.id and tombstone.book_id = owned.id
    returning owned.epub_storage_path as epub_path, owned.cover_storage_path as cover_path
  )
  select removed.epub_path, removed.cover_path from removed;
end;
$$;

create policy "Users read their books" on public.books
for select to authenticated using ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users insert their books" on public.books
for insert to authenticated with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users update their books" on public.books
for update to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users delete their books" on public.books
for delete to authenticated using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users read their progress" on public.reading_progress
for select to authenticated using ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users insert their progress" on public.reading_progress
for insert to authenticated with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users update their progress" on public.reading_progress
for update to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users delete their progress" on public.reading_progress
for delete to authenticated using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users read their preferences" on public.reader_preferences
for select to authenticated using ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users insert their preferences" on public.reader_preferences
for insert to authenticated with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users update their preferences" on public.reader_preferences
for update to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users delete their preferences" on public.reader_preferences
for delete to authenticated using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users read their deletions" on public.book_deletions
for select to authenticated using ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users insert their deletions" on public.book_deletions
for insert to authenticated with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users update their deletions" on public.book_deletions
for update to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users delete their deletions" on public.book_deletions
for delete to authenticated using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users read their EPUBs" on storage.objects
for select to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
create policy "Users upload their EPUBs" on storage.objects
for insert to authenticated
with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
create policy "Users update their EPUBs" on storage.objects
for update to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
with check (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
create policy "Users delete their EPUBs" on storage.objects
for delete to authenticated
using (bucket_id = 'epubs' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));

create policy "Users read their covers" on storage.objects
for select to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
create policy "Users upload their covers" on storage.objects
for insert to authenticated
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
create policy "Users update their covers" on storage.objects
for update to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
create policy "Users delete their covers" on storage.objects
for delete to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
