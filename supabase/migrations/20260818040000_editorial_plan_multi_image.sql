-- Allow multiple uploaded images per editorial plan item (e.g. carousel
-- posts), mirroring the media_paths[] pattern already used on posts.

alter table editorial_plan_items add column if not exists image_paths text[] not null default '{}';

update editorial_plan_items
set image_paths = array[image_path]
where image_path is not null and image_paths = '{}';

alter table editorial_plan_items drop column if exists image_path;
