-- All CMS
-- Run once in the Supabase SQL editor.
-- Editor access is a private email and password in .env.local (CMS_EDITOR_EMAIL, CMS_ACCESS_PASSWORD).
-- There is no public sign-in and no Supabase Auth user.
-- Copy .env.example to .env.local, fill in the keys, then run: npm run seed

create table if not exists public.sites (
  id text primary key,
  name text not null,
  domain text not null
);

create table if not exists public.projects (
  site_id text not null references public.sites (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (site_id, id)
);

create table if not exists public.insights (
  site_id text not null references public.sites (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (site_id, id)
);

create table if not exists public.testimonials (
  site_id text not null references public.sites (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (site_id, id)
);

create table if not exists public.site_settings (
  site_id text primary key references public.sites (id) on delete cascade,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.sites enable row level security;
alter table public.projects enable row level security;
alter table public.insights enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.sites to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.insights to authenticated;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;

drop policy if exists "cms_sites_all" on public.sites;
drop policy if exists "cms_projects_all" on public.projects;
drop policy if exists "cms_insights_all" on public.insights;
drop policy if exists "cms_testimonials_all" on public.testimonials;
drop policy if exists "cms_settings_all" on public.site_settings;

create policy "cms_sites_all" on public.sites
  for all to authenticated using (true) with check (true);
create policy "cms_projects_all" on public.projects
  for all to authenticated using (true) with check (true);
create policy "cms_insights_all" on public.insights
  for all to authenticated using (true) with check (true);
create policy "cms_testimonials_all" on public.testimonials
  for all to authenticated using (true) with check (true);
create policy "cms_settings_all" on public.site_settings
  for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cms_media_read" on storage.objects;
drop policy if exists "cms_media_insert" on storage.objects;
drop policy if exists "cms_media_update" on storage.objects;
drop policy if exists "cms_media_delete" on storage.objects;

create policy "cms_media_read" on storage.objects
  for select to public
  using (bucket_id = 'cms-media');

create policy "cms_media_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cms-media');

create policy "cms_media_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'cms-media');

create policy "cms_media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cms-media');
