-- Founders & Builders Supabase foundation
-- Mirrors the current Google Sheets/App Script entities using fb_-prefixed tables.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.fb_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.fb_is_visible(status text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(status, 'active')) not in
    ('hidden', 'rejected', 'spam', 'blocked', 'archived', 'deleted');
$$;

create table if not exists public.fb_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin',
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fb_admins_identity_check check (user_id is not null or email is not null),
  constraint fb_admins_status_check check (status in ('active', 'paused', 'revoked'))
);

create unique index if not exists fb_admins_user_id_uidx
  on public.fb_admins(user_id)
  where user_id is not null;
create unique index if not exists fb_admins_email_uidx
  on public.fb_admins(lower(email))
  where email is not null;

create or replace function public.fb_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.fb_admins
    where status = 'active'
      and (
        user_id = auth.uid()
        or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

grant execute on function public.fb_is_visible(text) to anon, authenticated;
grant execute on function public.fb_is_admin() to anon, authenticated;

create table if not exists public.fb_profiles (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  name text not null,
  building text,
  business text,
  stage text,
  products text,
  skills text,
  industry text,
  location text,
  email text not null,
  website text,
  linkedin text,
  github text,
  x text,
  portfolio text,
  bio text,
  goals text,
  looking_for text,
  can_help text,
  mentor boolean not null default false,
  investor boolean not null default false,
  podcast boolean not null default false,
  speaker boolean not null default false,
  volunteer boolean not null default false,
  needs text,
  offers text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_businesses (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  name text not null,
  category text,
  logo text,
  description text,
  website text,
  industry text,
  team text,
  products text,
  services text,
  hiring text,
  email text not null,
  linkedin text,
  x text,
  instagram text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_listings (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  name text not null,
  category text,
  description text,
  pricing text,
  image text,
  demo text,
  website text,
  email text not null,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_jobs (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  title text not null,
  company text,
  category text,
  location text,
  remote boolean not null default false,
  compensation text,
  description text,
  apply_link text,
  email text not null,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_mentors (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  name text not null,
  title text,
  company text,
  industry text,
  expertise text,
  stages text,
  experience text,
  availability text,
  office_hours text,
  bio text,
  email text not null,
  linkedin text,
  website text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_help_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  name text,
  title text not null,
  category text,
  urgency text,
  description text,
  email text not null,
  linkedin text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_raises (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  company text not null,
  founder text,
  stage text,
  industry text,
  amount_seeking text,
  raised_so_far text,
  use_of_funds text,
  description text,
  email text not null,
  website text,
  linkedin text,
  disclaimer_accepted boolean not null default false,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_investors (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  name text not null,
  firm text,
  investor_type text,
  check_size text,
  stages text,
  industries text,
  thesis text,
  email text not null,
  website text,
  linkedin text,
  disclaimer_accepted boolean not null default false,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_event_sources (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  source_name text not null,
  organizer_email text not null,
  contact_name text,
  platform text not null,
  auth_method text not null,
  chapter text,
  source_url text,
  feed_url text,
  import_mode text not null default 'Curated review',
  cadence text,
  fit_notes text,
  permission_confirmed boolean not null default false,
  attribution_accepted boolean not null default false,
  review_accepted boolean not null default false,
  sync_status text not null default 'Pending review',
  approval_status text not null default 'Pending review',
  secret_status text not null default 'No secret required',
  last_checked timestamptz,
  last_import_count integer,
  next_step text,
  notes text,
  provider_account_id text,
  provider_calendar_id text,
  provider_organization_id text,
  provider_endpoint text,
  provider_scope text,
  oauth_status text,
  connector_status text,
  last_provider_sync_at timestamptz,
  provider_notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_events (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  title text not null,
  host text,
  category text,
  city text,
  event_date date,
  event_time text,
  location text,
  description text,
  rsvp_link text,
  email text not null,
  source_platform text,
  source_name text,
  source_url text,
  source_event_id text,
  import_status text,
  imported_from_source_id text,
  event_source_id uuid references public.fb_event_sources(id) on delete set null,
  external_updated_at timestamptz,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_collaborations (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  title text not null,
  name text,
  category text,
  format text,
  city text,
  description text,
  email text not null,
  linkedin text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_podcasts (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  show_name text not null,
  host text,
  topics text,
  format text,
  looking_for text,
  city text,
  description text,
  listen_link text,
  email text not null,
  linkedin text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_resources (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  submitted_at timestamptz,
  title text not null,
  category text,
  description text,
  link text not null,
  submitted_by text,
  email text,
  owner_key text,
  account_email text,
  chapter text,
  moderation_status text not null default 'Active',
  verified boolean not null default false,
  report_count integer not null default 0,
  expires_at timestamptz,
  last_updated timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_accounts (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  auth_user_id uuid references auth.users(id) on delete set null,
  owner_key text,
  name text,
  email text not null,
  chapter text,
  location text,
  needs text,
  offers text,
  goals text,
  skills text,
  last_seen timestamptz,
  moderation_status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists fb_accounts_owner_key_uidx
  on public.fb_accounts(owner_key)
  where owner_key is not null;

create table if not exists public.fb_saved_items (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  owner_key text,
  account_email text,
  target_type text not null,
  target_id text not null,
  target_title text,
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_reports (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  target_type text,
  target_id text,
  target_title text,
  reason text not null,
  details text,
  reporter_email text,
  status text not null default 'Open',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_admin_actions (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  target_type text,
  target_id text,
  target_title text,
  action text not null,
  notes text,
  admin_email text,
  recommended_approval_status text,
  recommended_sync_status text,
  recommended_secret_status text,
  import_plan text,
  source_platform text,
  source_url text,
  feed_url text,
  organizer_email text,
  import_count integer,
  duplicate_count integer,
  archived_count integer,
  admin_operation text,
  provider text,
  provider_operation text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_chapters (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  name text not null,
  city text,
  slug text unique,
  status text not null default 'Planning',
  focus text,
  lead_name text,
  lead_email text,
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_activity_items (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  title text not null,
  summary text,
  target_type text,
  target_id text,
  chapter text,
  action_label text,
  action_url text,
  status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_graph_edges (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  source_type text,
  source_id text,
  source_title text not null,
  relationship text not null,
  target_type text,
  target_id text,
  target_title text not null,
  basis text,
  weight numeric,
  moderation_status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_concierge_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  question text not null,
  email text,
  context text,
  matched_types text,
  status text not null default 'Open',
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_seed_templates (
  id uuid primary key default gen_random_uuid(),
  legacy_sheet_id text unique,
  title text not null,
  target_type text not null,
  source_policy text,
  template_url text,
  permission_status text not null default 'Template only',
  moderation_status text not null default 'Needs review',
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_event_import_runs (
  id uuid primary key default gen_random_uuid(),
  event_source_id uuid references public.fb_event_sources(id) on delete set null,
  legacy_source_id text,
  source_platform text,
  source_name text,
  source_url text,
  feed_url text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  import_count integer not null default 0,
  duplicate_count integer not null default 0,
  error_count integer not null default 0,
  archived_count integer not null default 0,
  notes text,
  raw_summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fb_event_import_drafts (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid references public.fb_event_import_runs(id) on delete cascade,
  event_source_id uuid references public.fb_event_sources(id) on delete set null,
  title text,
  host text,
  category text,
  city text,
  event_date date,
  event_time text,
  location text,
  description text,
  rsvp_link text,
  email text,
  source_platform text,
  source_name text,
  source_url text,
  source_event_id text,
  status text not null default 'pending_review',
  duplicate_event_id uuid references public.fb_events(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fb_profiles_search_idx on public.fb_profiles using gin (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(business, '') || ' ' || coalesce(skills, '') || ' ' || coalesce(needs, '') || ' ' || coalesce(offers, ''))
);
create index if not exists fb_businesses_search_idx on public.fb_businesses using gin (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(description, '') || ' ' || coalesce(products, '') || ' ' || coalesce(services, ''))
);
create index if not exists fb_events_date_idx on public.fb_events(event_date);
create index if not exists fb_events_source_event_idx on public.fb_events(source_platform, source_event_id) where source_event_id is not null;
create index if not exists fb_events_duplicate_lookup_idx on public.fb_events(lower(title), event_date, lower(coalesce(city, '')));
create index if not exists fb_event_sources_status_idx on public.fb_event_sources(approval_status, sync_status, connector_status);
create index if not exists fb_reports_status_idx on public.fb_reports(status);
create index if not exists fb_admin_actions_target_idx on public.fb_admin_actions(target_type, target_id);
create index if not exists fb_activity_status_idx on public.fb_activity_items(status, chapter);
create index if not exists fb_graph_edges_source_idx on public.fb_graph_edges(source_type, source_id);
create index if not exists fb_graph_edges_target_idx on public.fb_graph_edges(target_type, target_id);
create index if not exists fb_event_import_runs_source_idx on public.fb_event_import_runs(event_source_id, started_at desc);
create index if not exists fb_event_import_drafts_run_idx on public.fb_event_import_drafts(import_run_id, status);

insert into public.fb_chapters (slug, name, city, status, focus)
values
  ('dc', 'Washington, DC', 'Washington, DC', 'Launch chapter', 'Policy, govtech, services, capital, and founder operators.'),
  ('atlanta', 'Atlanta, GA', 'Atlanta, GA', 'Launch chapter', 'Media, fintech, logistics, healthcare, and startup services.'),
  ('boise', 'Boise, ID', 'Boise, ID', 'Launch chapter', 'Product builders, local businesses, remote teams, and operators.'),
  ('madison', 'Madison, AL', 'Madison, AL', 'Launch chapter', 'Early builders, students, local companies, and practical community support.')
on conflict (slug) do update
set
  name = excluded.name,
  city = excluded.city,
  status = excluded.status,
  focus = excluded.focus,
  updated_at = now();

do $$
declare
  table_name text;
  fb_tables text[] := array[
    'fb_admins', 'fb_profiles', 'fb_businesses', 'fb_listings', 'fb_jobs',
    'fb_mentors', 'fb_help_requests', 'fb_raises', 'fb_investors',
    'fb_event_sources', 'fb_events', 'fb_collaborations', 'fb_podcasts',
    'fb_resources', 'fb_accounts', 'fb_saved_items', 'fb_reports',
    'fb_admin_actions', 'fb_chapters', 'fb_activity_items', 'fb_graph_edges',
    'fb_concierge_requests', 'fb_seed_templates', 'fb_event_import_runs',
    'fb_event_import_drafts'
  ];
begin
  foreach table_name in array fb_tables loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.fb_set_updated_at()', table_name);
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
  public_tables text[] := array[
    'fb_profiles', 'fb_businesses', 'fb_listings', 'fb_jobs', 'fb_mentors',
    'fb_help_requests', 'fb_raises', 'fb_investors', 'fb_events',
    'fb_collaborations', 'fb_podcasts', 'fb_resources'
  ];
begin
  foreach table_name in array public_tables loop
    execute format('drop policy if exists "Public read visible rows" on public.%I', table_name);
    execute format(
      'create policy "Public read visible rows" on public.%I for select to anon, authenticated using (public.fb_is_visible(moderation_status))',
      table_name
    );
    execute format('drop policy if exists "Admins manage rows" on public.%I', table_name);
    execute format(
      'create policy "Admins manage rows" on public.%I for all to authenticated using (public.fb_is_admin()) with check (public.fb_is_admin())',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
  native_insert_tables text[] := array[
    'fb_profiles', 'fb_businesses', 'fb_listings', 'fb_jobs', 'fb_mentors',
    'fb_help_requests', 'fb_raises', 'fb_investors', 'fb_collaborations',
    'fb_podcasts', 'fb_resources'
  ];
begin
  foreach table_name in array native_insert_tables loop
    execute format('drop policy if exists "Public native insert" on public.%I', table_name);
    execute format(
      'create policy "Public native insert" on public.%I for insert to anon, authenticated with check (coalesce(verified, false) = false and coalesce(report_count, 0) = 0 and coalesce(moderation_status, ''Active'') in (''Active'', ''Pending review'', ''Demo''))',
      table_name
    );
  end loop;
end;
$$;

drop policy if exists "Public native insert" on public.fb_events;
create policy "Public native insert" on public.fb_events
for insert to anon, authenticated
with check (
  coalesce(verified, false) = false
  and coalesce(report_count, 0) = 0
  and coalesce(moderation_status, 'Active') in ('Active', 'Pending review', 'Demo')
  and event_source_id is null
  and imported_from_source_id is null
  and source_event_id is null
  and coalesce(source_platform, '') in ('', 'Founders & Builders')
);

drop policy if exists "Public create event sources" on public.fb_event_sources;
create policy "Public create event sources" on public.fb_event_sources
for insert to anon, authenticated
with check (
  permission_confirmed = true
  and attribution_accepted = true
  and review_accepted = true
  and coalesce(secret_status, 'No secret required') <> 'Stored in Script Properties'
);

drop policy if exists "Admins manage event sources" on public.fb_event_sources;
create policy "Admins manage event sources" on public.fb_event_sources
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

drop policy if exists "Public create reports" on public.fb_reports;
create policy "Public create reports" on public.fb_reports
for insert to anon, authenticated
with check (coalesce(status, 'Open') in ('Open', 'Reviewing'));

drop policy if exists "Admins manage reports" on public.fb_reports;
create policy "Admins manage reports" on public.fb_reports
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

drop policy if exists "Public create concierge requests" on public.fb_concierge_requests;
create policy "Public create concierge requests" on public.fb_concierge_requests
for insert to anon, authenticated
with check (coalesce(status, 'Open') in ('Open', 'Reviewing'));

drop policy if exists "Admins manage concierge requests" on public.fb_concierge_requests;
create policy "Admins manage concierge requests" on public.fb_concierge_requests
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

drop policy if exists "Public create accounts" on public.fb_accounts;
create policy "Public create accounts" on public.fb_accounts
for insert to anon, authenticated
with check (coalesce(moderation_status, 'Active') in ('Active', 'Pending review'));

drop policy if exists "Authenticated users read own account" on public.fb_accounts;
create policy "Authenticated users read own account" on public.fb_accounts
for select to authenticated
using (
  auth_user_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.fb_is_admin()
);

drop policy if exists "Admins manage accounts" on public.fb_accounts;
create policy "Admins manage accounts" on public.fb_accounts
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

drop policy if exists "Public create saved items" on public.fb_saved_items;
create policy "Public create saved items" on public.fb_saved_items
for insert to anon, authenticated
with check (target_type is not null and target_id is not null);

drop policy if exists "Authenticated users read own saved items" on public.fb_saved_items;
create policy "Authenticated users read own saved items" on public.fb_saved_items
for select to authenticated
using (
  lower(account_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.fb_is_admin()
);

do $$
declare
  table_name text;
  admin_tables text[] := array[
    'fb_admins', 'fb_admin_actions', 'fb_seed_templates',
    'fb_event_import_runs', 'fb_event_import_drafts'
  ];
begin
  foreach table_name in array admin_tables loop
    execute format('drop policy if exists "Admins manage rows" on public.%I', table_name);
    execute format(
      'create policy "Admins manage rows" on public.%I for all to authenticated using (public.fb_is_admin()) with check (public.fb_is_admin())',
      table_name
    );
  end loop;
end;
$$;

drop policy if exists "Public read active chapters" on public.fb_chapters;
create policy "Public read active chapters" on public.fb_chapters
for select to anon, authenticated
using (status in ('Launch chapter', 'Pilot', 'Planning'));

drop policy if exists "Admins manage chapters" on public.fb_chapters;
create policy "Admins manage chapters" on public.fb_chapters
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

drop policy if exists "Public read active activity" on public.fb_activity_items;
create policy "Public read active activity" on public.fb_activity_items
for select to anon, authenticated
using (lower(coalesce(status, 'active')) = 'active');

drop policy if exists "Admins manage activity" on public.fb_activity_items;
create policy "Admins manage activity" on public.fb_activity_items
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

drop policy if exists "Public read visible graph edges" on public.fb_graph_edges;
create policy "Public read visible graph edges" on public.fb_graph_edges
for select to anon, authenticated
using (public.fb_is_visible(moderation_status));

drop policy if exists "Admins manage graph edges" on public.fb_graph_edges;
create policy "Admins manage graph edges" on public.fb_graph_edges
for all to authenticated
using (public.fb_is_admin())
with check (public.fb_is_admin());

grant usage on schema public to anon, authenticated;

grant select, insert on
  public.fb_profiles, public.fb_businesses, public.fb_listings, public.fb_jobs,
  public.fb_mentors, public.fb_help_requests, public.fb_raises,
  public.fb_investors, public.fb_events, public.fb_collaborations,
  public.fb_podcasts, public.fb_resources
to anon, authenticated;

grant update, delete on
  public.fb_profiles, public.fb_businesses, public.fb_listings, public.fb_jobs,
  public.fb_mentors, public.fb_help_requests, public.fb_raises,
  public.fb_investors, public.fb_events, public.fb_collaborations,
  public.fb_podcasts, public.fb_resources
to authenticated;

grant insert on
  public.fb_event_sources, public.fb_reports, public.fb_concierge_requests,
  public.fb_accounts, public.fb_saved_items
to anon, authenticated;

grant select on
  public.fb_chapters, public.fb_activity_items, public.fb_graph_edges
to anon, authenticated;

grant select, update, delete on
  public.fb_event_sources, public.fb_reports, public.fb_concierge_requests,
  public.fb_accounts, public.fb_saved_items, public.fb_admins,
  public.fb_admin_actions, public.fb_seed_templates, public.fb_event_import_runs,
  public.fb_event_import_drafts
to authenticated;

grant insert on
  public.fb_admins, public.fb_admin_actions, public.fb_chapters,
  public.fb_activity_items, public.fb_graph_edges, public.fb_seed_templates,
  public.fb_event_import_runs, public.fb_event_import_drafts
to authenticated;
