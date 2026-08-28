-- New "Download" tab: photos Anna uploads for a client to download from
-- their portal. Same RLS/storage pattern as ad_reports/reports.

create table if not exists client_downloads (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists client_downloads_page_id_idx on client_downloads (page_id);

alter table client_downloads enable row level security;

create policy "admin full access on client_downloads" on client_downloads
  for all using (is_admin()) with check (is_admin());

create policy "client select own client_downloads" on client_downloads
  for select using (has_page_access(page_id));

insert into storage.buckets (id, name, public)
values ('downloads', 'downloads', true)
on conflict (id) do nothing;

create policy "public read downloads" on storage.objects
  for select using (bucket_id = 'downloads');

create policy "admin write downloads" on storage.objects
  for insert to authenticated with check (bucket_id = 'downloads' and is_admin());

create policy "admin update downloads" on storage.objects
  for update to authenticated using (bucket_id = 'downloads' and is_admin());

create policy "admin delete downloads" on storage.objects
  for delete to authenticated using (bucket_id = 'downloads' and is_admin());
