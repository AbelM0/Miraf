begin;
select plan(14);

select has_table('public', 'books', 'books exists');
select has_table('public', 'reading_progress', 'reading progress exists');
select has_table('public', 'reader_preferences', 'preferences exists');
select has_table('public', 'book_deletions', 'deletion tombstones exist');
select is((select relrowsecurity from pg_class where oid = 'public.books'::regclass), true, 'books RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.reading_progress'::regclass), true, 'progress RLS enabled');
select is((select public from storage.buckets where id = 'epubs'), false, 'EPUB bucket private');
select is((select public from storage.buckets where id = 'covers'), false, 'cover bucket private');
select col_type_is('public', 'books', 'user_id', 'text', 'book ownership accepts Clerk user IDs');

insert into public.books (
  id, user_id, title, original_file_name, file_size, file_hash,
  epub_storage_path, upload_status
) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_test_one', 'Owner one book', 'one.epub', 100, repeat('a', 64), 'user_test_one/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/book.epub', 'ready'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_test_two', 'Owner two book', 'two.epub', 100, repeat('b', 64), 'user_test_two/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/book.epub', 'ready');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_test_one","role":"authenticated"}', true);
select results_eq('select count(*)::bigint from public.books', array[1::bigint], 'owner sees only their book');
select lives_ok($$update public.books set title = 'Updated' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'owner can update their book');
select results_eq($$select count(*)::bigint from public.books where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$, array[0::bigint], 'owner cannot see another user book');

reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select results_eq('select count(*)::bigint from public.books', array[0::bigint], 'anonymous user sees no books');
select throws_ok(
  $$insert into public.books (user_id, title, original_file_name, file_size, file_hash, epub_storage_path) values ('user_test_one', 'Denied', 'denied.epub', 1, repeat('c', 64), 'denied/book.epub')$$,
  '42501',
  'permission denied for table books',
  'anonymous insert is denied'
);

select * from finish();
rollback;
