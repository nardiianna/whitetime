-- New "Feed" tab: an Instagram-grid-style preview (3 columns, newest first
-- top-left) of the photos Anna uploads for a client's profile. Same
-- RLS/storage pattern as client_downloads.

create table if not exists client_feed_photos (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  file_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists client_feed_photos_page_id_idx on client_feed_photos (page_id);

alter table client_feed_photos enable row level security;

create policy "admin full access on client_feed_photos" on client_feed_photos
  for all using (is_admin()) with check (is_admin());

create policy "client select own client_feed_photos" on client_feed_photos
  for select using (has_page_access(page_id));

insert into storage.buckets (id, name, public)
values ('feed', 'feed', true)
on conflict (id) do nothing;

create policy "public read feed" on storage.objects
  for select using (bucket_id = 'feed');

create policy "admin write feed" on storage.objects
  for insert to authenticated with check (bucket_id = 'feed' and is_admin());

create policy "admin update feed" on storage.objects
  for update to authenticated using (bucket_id = 'feed' and is_admin());

create policy "admin delete feed" on storage.objects
  for delete to authenticated using (bucket_id = 'feed' and is_admin());
