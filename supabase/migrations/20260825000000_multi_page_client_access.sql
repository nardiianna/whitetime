-- Allow a single client login to have access to more than one page (e.g. an
-- agency contact who manages several client accounts). `profiles.page_id`
-- only ever supported one page per login; introduce a join table for grants
-- and move every client-facing RLS policy / RPC over to check it instead.
-- `profiles.page_id` is left in place (unused going forward) rather than
-- dropped, since it still holds real grants for every existing client login.

create table if not exists profile_page_access (
  profile_id uuid not null references profiles(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, page_id)
);

create index if not exists profile_page_access_page_id_idx on profile_page_access (page_id);

alter table profile_page_access enable row level security;

create policy "admin full access on profile_page_access" on profile_page_access
  for all using (is_admin()) with check (is_admin());

create policy "self select profile_page_access" on profile_page_access
  for select using (auth.uid() = profile_id);

-- Backfill every existing single-page grant so no client loses access once
-- the policies below stop reading profiles.page_id directly.
insert into profile_page_access (profile_id, page_id)
select id, page_id from profiles where page_id is not null
on conflict do nothing;

-- SECURITY DEFINER so it can be used inside RLS policies without recursion.
create or replace function has_page_access(p_page_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_admin() or exists (
    select 1 from profile_page_access
    where profile_id = auth.uid() and page_id = p_page_id
  );
$$;

drop policy if exists "client select own page" on pages;
create policy "client select own page" on pages
  for select using (has_page_access(pages.id));

drop policy if exists "client select own editorial_plan_items" on editorial_plan_items;
create policy "client select own editorial_plan_items" on editorial_plan_items
  for select using (has_page_access(editorial_plan_items.page_id));

drop policy if exists "client select own ad_reports" on ad_reports;
create policy "client select own ad_reports" on ad_reports
  for select using (has_page_access(ad_reports.page_id));

create or replace function submit_client_note(p_item_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update editorial_plan_items
  set client_note = p_note
  where id = p_item_id
    and has_page_access(page_id);
end;
$$;

create or replace function submit_client_approval(p_item_id uuid, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update editorial_plan_items
  set approved = p_approved
  where id = p_item_id
    and has_page_access(page_id);
end;
$$;
