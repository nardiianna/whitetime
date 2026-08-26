-- The client-note badge counted every non-null client_note forever, with no
-- way to dismiss it once Anna had actually read it. Track read state
-- separately from the note text itself (the note stays visible as a
-- record; only the "needs attention" flag can be cleared).

alter table editorial_plan_items add column if not exists note_acknowledged boolean not null default false;

-- Existing notes were already seen (this column didn't exist before today).
update editorial_plan_items set note_acknowledged = true where client_note is not null;

create or replace function submit_client_note(p_item_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update editorial_plan_items
  set client_note = p_note,
      note_acknowledged = (p_note is null)
  where id = p_item_id
    and has_page_access(page_id);
end;
$$;
