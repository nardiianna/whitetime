-- New clients managed under the Magnetica Design portfolio.

insert into pages (name)
select 'Formest' where not exists (select 1 from pages where name = 'Formest');

insert into pages (name)
select 'Letsolv' where not exists (select 1 from pages where name = 'Letsolv');
