-- Introduce user roles (admin vs client) so client logins can be added safely.
-- Today every authenticated user has full access to every row on every table;
-- this must change before any client account is created, otherwise a client
-- would see every other client's data.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  page_id uuid references pages(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Backfill: today the app has exactly one manually-provisioned user (Anna).
-- Make her an admin so nothing breaks after RLS is tightened below.
insert into profiles (id, role)
select id, 'admin' from auth.users
on conflict (id) do nothing;

-- SECURITY DEFINER so this can be called from RLS policies on `profiles`
-- itself without causing infinite recursion.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles enable row level security;

create policy "self or admin select profiles" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "admin insert profiles" on profiles
  for insert with check (is_admin());

create policy "admin update profiles" on profiles
  for update using (is_admin()) with check (is_admin());

create policy "admin delete profiles" on profiles
  for delete using (is_admin());

-- Replace the old "any authenticated user" policies with admin-only access.
-- posts/categories/content_ideas stay Anna's internal planning tool; clients
-- never touch them (they get their own editorial_plan_items/ad_reports tables).
drop policy if exists "authenticated full access on pages" on pages;
drop policy if exists "authenticated full access on posts" on posts;
drop policy if exists "authenticated full access on categories" on categories;
drop policy if exists "authenticated full access on content_ideas" on content_ideas;

create policy "admin full access on pages" on pages
  for all using (is_admin()) with check (is_admin());

create policy "client select own page" on pages
  for select using (
    exists (select 1 from profiles where id = auth.uid() and profiles.page_id = pages.id)
  );

create policy "admin full access on posts" on posts
  for all using (is_admin()) with check (is_admin());

create policy "admin full access on categories" on categories
  for all using (is_admin()) with check (is_admin());

create policy "admin full access on content_ideas" on content_ideas
  for all using (is_admin()) with check (is_admin());

-- Tighten the media bucket: reads stay public (send-reminders needs public
-- URLs for Telegram), but writes are now admin-only since client accounts
-- are authenticated users too.
drop policy if exists "authenticated write media" on storage.objects;
drop policy if exists "authenticated update media" on storage.objects;
drop policy if exists "authenticated delete media" on storage.objects;

create policy "admin write media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and is_admin());

create policy "admin update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and is_admin());

create policy "admin delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and is_admin());
