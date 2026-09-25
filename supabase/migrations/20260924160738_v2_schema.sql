create extension if not exists pgcrypto;

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 1000),
  author text,
  publisher text,
  language text,
  description text,
  epub_identifier text,
  original_file_name text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  file_hash text not null check (file_hash ~ '^[0-9a-f]{64}$'),
  epub_storage_path text not null,
  cover_storage_path text,
  upload_status text not null default 'pending' check (upload_status in ('pending', 'ready')),
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, file_hash),
  unique (id, user_id)
);

create index books_user_library_idx
  on public.books (user_id, last_opened_at desc nulls last, created_at desc);
create index books_user_updated_idx on public.books (user_id, updated_at);

create table public.reading_progress (
  book_id uuid primary key,
  user_id uuid not null,
  cfi text,
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  changed_at timestamptz not null,
  server_updated_at timestamptz not null default now(),
  constraint reading_progress_owned_book_fk
    foreign key (book_id, user_id)
    references public.books(id, user_id)
    on delete cascade
);

create index reading_progress_user_idx on public.reading_progress (user_id, changed_at desc);

create table public.reader_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null check (theme in ('light', 'sepia', 'dark')),
  flow text not null check (flow in ('paginated', 'scrolled')),
  font_family text not null check (font_family in ('serif', 'sans')),
  font_size smallint not null check (font_size between 14 and 28),
  line_height numeric(2,1) not null check (line_height between 1.3 and 2.0),
  content_width text not null check (content_width in ('narrow', 'standard', 'wide')),
  changed_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);

create table public.book_deletions (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index book_deletions_user_time_idx
  on public.book_deletions (user_id, deleted_at);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();

create function public.sync_reading_progress(
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
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  insert into public.reading_progress (
    book_id, user_id, cfi, percentage, changed_at, server_updated_at
  )
  select b.id, b.user_id, p_cfi, greatest(0, least(100, p_percentage)), p_changed_at, now()
  from public.books b
  where b.id = p_book_id
    and b.user_id = (select auth.uid())
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

create function public.sync_reader_preferences(
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
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  insert into public.reader_preferences (
    user_id, theme, flow, font_family, font_size, line_height,
    content_width, changed_at, server_updated_at
  ) values (
    (select auth.uid()), p_theme, p_flow, p_font_family, p_font_size,
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

create function public.delete_owned_book(p_book_id uuid)
returns table (epub_storage_path text, cover_storage_path text)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  with owned as (
    select b.id, b.user_id, b.epub_storage_path, b.cover_storage_path
    from public.books b
    where b.id = p_book_id and b.user_id = (select auth.uid())
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
