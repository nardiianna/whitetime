-- "Titolo / Argomento" removed: the theme field already covers this, and
-- the caption is the main content shown to clients.

alter table editorial_plan_items drop column if exists title;
