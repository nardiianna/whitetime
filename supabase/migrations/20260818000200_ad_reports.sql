-- Meta Ads campaign reports, shown read-only to clients on their portal.

create table if not exists ad_reports (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  campaign_name text not null,
  period_start date,
  period_end date,
  spend numeric(10, 2),
  reach integer,
  impressions integer,
  clicks integer,
  results integer,
  cost_per_result numeric(10, 2),
  screenshot_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_reports_page_id_idx on ad_reports (page_id);

create trigger ad_reports_set_updated_at
  before update on ad_reports
  for each row execute function set_updated_at();

alter table ad_reports enable row level security;

create policy "admin full access on ad_reports" on ad_reports
  for all using (is_admin()) with check (is_admin());

create policy "client select own ad_reports" on ad_reports
  for select using (
    exists (select 1 from profiles where id = auth.uid() and profiles.page_id = ad_reports.page_id)
  );

-- Public-read bucket for report screenshots, same pattern as the `media`
-- bucket; only admin can upload/replace/remove.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;

create policy "public read reports" on storage.objects
  for select using (bucket_id = 'reports');

create policy "admin write reports" on storage.objects
  for insert to authenticated with check (bucket_id = 'reports' and is_admin());

create policy "admin update reports" on storage.objects
  for update to authenticated using (bucket_id = 'reports' and is_admin());

create policy "admin delete reports" on storage.objects
  for delete to authenticated using (bucket_id = 'reports' and is_admin());
