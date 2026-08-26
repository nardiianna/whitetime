-- Distinguish organic growth reports (like follower growth since Anna took
-- over an account) from paid ad campaign reports, so the client dashboard
-- can show them first and with a different look instead of mixing them
-- together sorted only by date.

alter table ad_reports add column if not exists kind text not null default 'campaign'
  check (kind in ('campaign', 'organic'));

update ad_reports set kind = 'organic' where id = 'bcaeafc2-1ae0-440e-a940-1d5d9db718ac';
