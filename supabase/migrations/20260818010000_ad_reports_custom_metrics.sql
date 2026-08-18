-- Replace the fixed "clicks"/"results" columns with a flexible list of
-- custom metrics (label + number) Anna can define per report, and add a
-- free-text campaign objective field.

alter table ad_reports add column if not exists campaign_objective text;
alter table ad_reports add column if not exists custom_metrics jsonb not null default '[]'::jsonb;

alter table ad_reports drop column if exists clicks;
alter table ad_reports drop column if exists results;
