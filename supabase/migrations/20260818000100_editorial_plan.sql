-- Client-facing Piano Editoriale: separate from `posts` (Anna's internal
-- Telegram-reminder planning tool), mirrors the columns of the Excel plan
-- shared with clients today (Data, Social, Tema, Formato, Titolo, Caption,
-- Immagine, Stato, Note interne, Note cliente).

create table if not exists editorial_plan_items (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  scheduled_date date,
  status text not null default 'idea'
    check (status in ('idea', 'da_fare', 'programmato', 'pubblicato')),
  social text[] not null default '{}',
  theme text,
  format text,
  title text,
  caption text,
  image_url text,
  internal_note text,
  client_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_plan_items_page_id_idx on editorial_plan_items (page_id);

create trigger editorial_plan_items_set_updated_at
  before update on editorial_plan_items
  for each row execute function set_updated_at();

alter table editorial_plan_items enable row level security;

create policy "admin full access on editorial_plan_items" on editorial_plan_items
  for all using (is_admin()) with check (is_admin());

create policy "client select own editorial_plan_items" on editorial_plan_items
  for select using (
    exists (select 1 from profiles where id = auth.uid() and profiles.page_id = editorial_plan_items.page_id)
  );

-- Clients can only ever change their own note field, never title/caption/status/
-- internal_note. Postgres RLS is row-level, not column-level, so this is
-- enforced via a SECURITY DEFINER RPC instead of an UPDATE policy: there is no
-- client update policy on this table at all, only this function.
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
    and page_id = (select page_id from profiles where id = auth.uid());
end;
$$;
