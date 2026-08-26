-- Report di crescita follower organica per Magnetica Design, da quando
-- Anna ha preso in mano il profilo (dato da Instagram Insights).

insert into ad_reports
  (page_id, campaign_name, period_start, period_end, campaign_objective, spend, custom_metrics, notes, screenshot_path)
select id,
  'Crescita follower Instagram',
  date '2026-06-16',
  date '2026-08-26',
  'Crescita follower organica (da quando gestisco il profilo)',
  null,
  '[{"label": "Nuovi follower", "value": 216}, {"label": "Crescita %", "value": 19.3}]'::jsonb,
  'Dato da Instagram Insights (Pubblico → Follower, intervallo personalizzato). Da aggiornare periodicamente controllando lo stesso Insight su Instagram.',
  '373e8955-ebd5-471b-913f-c233e45a9be9/0675A94B-339F-4F82-8F0B-C629AC26C542-instagram-insights-follower.jpg'
from pages
where pages.name = 'Magnetica Design';
