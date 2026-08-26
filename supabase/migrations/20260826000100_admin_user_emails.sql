-- Admins currently see raw UUIDs in "Accessi cliente" with no way to tell
-- whose login is whose. auth.users isn't exposed via the API, so expose
-- just the email through a SECURITY DEFINER function, admin-only.

create or replace function admin_list_user_emails(p_ids uuid[])
returns table(id uuid, email text)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email::text
  from auth.users u
  where u.id = any(p_ids) and is_admin();
$$;
