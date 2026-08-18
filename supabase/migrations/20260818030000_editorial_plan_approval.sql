-- Piano Editoriale: uploaded image (in addition to the external URL link)
-- and an independent client approval flag alongside the existing note.

alter table editorial_plan_items add column if not exists image_path text;
alter table editorial_plan_items add column if not exists approved boolean not null default false;

-- Same pattern as submit_client_note: SECURITY DEFINER RPC so the client can
-- only ever flip their own page's approval flag, nothing else on the row.
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
    and page_id = (select page_id from profiles where id = auth.uid());
end;
$$;
