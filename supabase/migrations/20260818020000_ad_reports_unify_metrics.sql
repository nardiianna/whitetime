-- Fold reach/impressions/cost_per_result into the same free-form
-- custom_metrics list as everything else, so Anna can rename, remove or add
-- any metric uniformly instead of being locked into fixed columns.

alter table ad_reports drop column if exists reach;
alter table ad_reports drop column if exists impressions;
alter table ad_reports drop column if exists cost_per_result;
