-- Advisor fixes for the Founders & Builders Supabase foundation.

create or replace function public.fb_is_visible(status text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select lower(coalesce(status, 'active')) not in
    ('hidden', 'rejected', 'spam', 'blocked', 'archived', 'deleted');
$$;

create index if not exists fb_accounts_auth_user_id_idx
  on public.fb_accounts(auth_user_id)
  where auth_user_id is not null;

create index if not exists fb_events_event_source_id_idx
  on public.fb_events(event_source_id)
  where event_source_id is not null;

create index if not exists fb_event_import_runs_created_by_idx
  on public.fb_event_import_runs(created_by)
  where created_by is not null;

create index if not exists fb_event_import_drafts_event_source_id_idx
  on public.fb_event_import_drafts(event_source_id)
  where event_source_id is not null;

create index if not exists fb_event_import_drafts_duplicate_event_id_idx
  on public.fb_event_import_drafts(duplicate_event_id)
  where duplicate_event_id is not null;
