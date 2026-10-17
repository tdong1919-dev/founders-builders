-- Founders & Builders: Phase 3 secure project foundation
-- Run in a Supabase SQL editor only after configuring Supabase Auth.
-- This migration does not modify the existing public Apps Script backend.
create extension if not exists pgcrypto;

create table if not exists public.fb_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 120),
  teaser text not null check (char_length(trim(teaser)) between 10 and 300),
  private_brief text not null default '' check (char_length(private_brief) <= 10000),
  stage text not null default 'Idea' check (stage in ('Idea','Research','Prototype','MVP','Early revenue')),
  skills_needed text[] not null default '{}',
  collaboration_model text not null default 'Open to discussion'
    check (collaboration_model in ('Open to discussion','Co-founder / potential equity','Paid contract','Volunteer / community')),
  visibility text not null default 'private' check (visibility in ('private','public')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fb_project_public_timestamp check (visibility = 'private' or published_at is not null)
);

create table if not exists public.fb_collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.fb_projects(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 20 and 1200),
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(project_id,applicant_id)
);

create table if not exists public.fb_project_members (
  project_id uuid not null references public.fb_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'collaborator' check (role = 'collaborator'),
  joined_at timestamptz not null default now(),
  primary key(project_id,user_id)
);

create table if not exists public.fb_project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.fb_projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  assignee_id uuid references auth.users(id) on delete set null,
  done boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists fb_projects_public_idx on public.fb_projects(created_at desc) where visibility='public';
create index if not exists fb_requests_project_idx on public.fb_collaboration_requests(project_id,status);
create index if not exists fb_requests_applicant_idx on public.fb_collaboration_requests(applicant_id);
create index if not exists fb_milestones_project_idx on public.fb_project_milestones(project_id);

-- Treat project membership as a separate permission, never infer from applicant email.
-- Security-definer helper bypasses RLS safely; fixed search_path and fully qualified objects.
create or replace function public.fb_can_access_project(p_project uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.fb_projects p where p.id=p_project and p.owner_id=p_user)
  or exists(select 1 from public.fb_project_members m where m.project_id=p_project and m.user_id=p_user)
$$;
revoke all on function public.fb_can_access_project(uuid,uuid) from public;
grant execute on function public.fb_can_access_project(uuid,uuid) to authenticated;

alter table public.fb_projects enable row level security;
alter table public.fb_collaboration_requests enable row level security;
alter table public.fb_project_members enable row level security;
alter table public.fb_project_milestones enable row level security;

-- A public search must only return teaser fields via the public view defined below.
-- No direct projects SELECT is granted for ordinary users because private_brief is in the row.
revoke all on public.fb_projects from anon, authenticated;
-- No direct project writes: force creation/editing through identity-bound RPCs.
-- Owner-only private project reads occur through a narrowly scoped RPC below.
create policy fb_projects_insert_own on public.fb_projects for insert to authenticated
with check (owner_id=(select auth.uid()) and (visibility='private' or published_at is not null));
create policy fb_projects_update_own on public.fb_projects for update to authenticated
using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy fb_projects_delete_own on public.fb_projects for delete to authenticated
using (owner_id=(select auth.uid()));

-- Public directory response never returns private_brief or private projects.
-- Default view is security invoker but uses a SECURITY DEFINER function for vetted fields.
create or replace function public.fb_discover_projects()
returns table (id uuid,title text,teaser text,stage text,skills_needed text[],collaboration_model text,created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.id,p.title,p.teaser,p.stage,p.skills_needed,p.collaboration_model,p.created_at
  from public.fb_projects p where p.visibility='public' and p.published_at is not null
  order by p.created_at desc limit 250
$$;
revoke all on function public.fb_discover_projects() from public;
grant execute on function public.fb_discover_projects() to anon,authenticated;

create or replace function public.fb_get_project(p_project uuid)
returns table (id uuid,owner_id uuid,title text,teaser text,private_brief text,stage text,skills_needed text[],collaboration_model text,visibility text,created_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select p.id,p.owner_id,p.title,p.teaser,p.private_brief,p.stage,p.skills_needed,p.collaboration_model,p.visibility,p.created_at
 from public.fb_projects p where p.id=p_project and auth.uid() is not null
 and public.fb_can_access_project(p.id,auth.uid())
$$;
revoke all on function public.fb_get_project(uuid) from public;
grant execute on function public.fb_get_project(uuid) to authenticated;

-- Request creation is allowed only for published projects, never your own.
grant select on public.fb_collaboration_requests to authenticated;
create policy fb_requests_read on public.fb_collaboration_requests for select to authenticated
using (applicant_id=(select auth.uid()) or exists(
 select 1 from public.fb_projects p where p.id=project_id and p.owner_id=(select auth.uid())
));
create policy fb_requests_apply on public.fb_collaboration_requests for insert to authenticated
with check (
 applicant_id=(select auth.uid()) and status='pending' and reviewed_at is null
 and exists(select 1 from public.fb_projects p where p.id=project_id
            and p.visibility='public' and p.published_at is not null
            and p.owner_id<>(select auth.uid()))
);
-- No raw UPDATE grant: status changes only via explicit validated RPC functions.

grant select on public.fb_project_members to authenticated;
create policy fb_members_read on public.fb_project_members for select to authenticated
using (public.fb_can_access_project(project_id,(select auth.uid())));

grant select on public.fb_project_milestones to authenticated;
create policy fb_milestones_read on public.fb_project_milestones for select to authenticated
using (public.fb_can_access_project(project_id,(select auth.uid())));
create policy fb_milestones_add on public.fb_project_milestones for insert to authenticated
with check (public.fb_can_access_project(project_id,(select auth.uid())));
create policy fb_milestones_edit on public.fb_project_milestones for update to authenticated
using (public.fb_can_access_project(project_id,(select auth.uid())))
with check (public.fb_can_access_project(project_id,(select auth.uid())));
create policy fb_milestones_delete on public.fb_project_milestones for delete to authenticated
using (public.fb_can_access_project(project_id,(select auth.uid())));

-- All authorization is rechecked server-side. Access cannot be granted by submitting
-- a forged owner_id, applicant_id, project_id, or client-controlled status.
create or replace function public.fb_review_request(p_request uuid,p_accept boolean)
returns text language plpgsql security definer set search_path=''
as $$
declare r public.fb_collaboration_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into r from public.fb_collaboration_requests where id=p_request for update;
  if not found then raise exception 'Request not found'; end if;
  if not exists(select 1 from public.fb_projects p where p.id=r.project_id and p.owner_id=auth.uid()) then
    raise exception 'Only the project owner can review applications';
  end if;
  if r.status<>'pending' then raise exception 'Already reviewed'; end if;
  update public.fb_collaboration_requests
     set status=case when p_accept then 'accepted' else 'declined' end, reviewed_at=now()
     where id=p_request;
  if p_accept then
    insert into public.fb_project_members(project_id,user_id)
    values(r.project_id,r.applicant_id) on conflict do nothing;
  end if;
  return case when p_accept then 'accepted' else 'declined' end;
end $$;
revoke all on function public.fb_review_request(uuid,boolean) from public;
grant execute on function public.fb_review_request(uuid,boolean) to authenticated;

create or replace function public.fb_withdraw_request(p_request uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 update public.fb_collaboration_requests set status='withdrawn'
 where id=p_request and applicant_id=auth.uid() and status='pending';
 return found;
end $$;
revoke all on function public.fb_withdraw_request(uuid) from public;
grant execute on function public.fb_withdraw_request(uuid) to authenticated;

-- Write operations are routed through functions with explicit owner identity checks.
-- No caller chooses their own owner_id or applicant_id.
create or replace function public.fb_create_project(
  p_title text,p_teaser text,p_private_brief text default '',
  p_stage text default 'Idea',p_skills text[] default '{}',
  p_model text default 'Open to discussion'
) returns uuid language plpgsql security definer set search_path=''
as $$
declare new_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.fb_projects(owner_id,title,teaser,private_brief,stage,skills_needed,collaboration_model,visibility)
 values(auth.uid(),p_title,p_teaser,coalesce(p_private_brief,''),p_stage,coalesce(p_skills,'{}'),p_model,'private')
 returning id into new_id;
 return new_id;
end $$;
revoke all on function public.fb_create_project(text,text,text,text,text[],text) from public;
grant execute on function public.fb_create_project(text,text,text,text,text[],text) to authenticated;

create or replace function public.fb_update_project(
 p_project uuid,p_title text,p_teaser text,p_private_brief text,
 p_stage text,p_skills text[],p_model text,p_publish boolean default false
) returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 update public.fb_projects set
 title=p_title,teaser=p_teaser,private_brief=coalesce(p_private_brief,''),
 stage=p_stage,skills_needed=coalesce(p_skills,'{}'),collaboration_model=p_model,
 visibility=case when p_publish then 'public' else 'private' end,
 published_at=case when p_publish then coalesce(published_at,now()) else null end,
 updated_at=now()
 where id=p_project and owner_id=auth.uid();
 return found;
end $$;
revoke all on function public.fb_update_project(uuid,text,text,text,text,text[],text,boolean) from public;
grant execute on function public.fb_update_project(uuid,text,text,text,text,text[],text,boolean) to authenticated;

create or replace function public.fb_my_projects()
returns table(id uuid,title text,teaser text,stage text,visibility text,created_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select p.id,p.title,p.teaser,p.stage,p.visibility,p.created_at
 from public.fb_projects p where p.owner_id=auth.uid() and auth.uid() is not null
 order by p.created_at desc limit 100
$$;
revoke all on function public.fb_my_projects() from public;
grant execute on function public.fb_my_projects() to authenticated;

create or replace function public.fb_apply_to_project(p_project uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare new_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.fb_projects p where p.id=p_project and p.visibility='public'
   and p.published_at is not null and p.owner_id<>auth.uid()) then
  raise exception 'Project unavailable for applications';
 end if;
 insert into public.fb_collaboration_requests(project_id,applicant_id,message)
 values(p_project,auth.uid(),p_message) returning id into new_id;
 return new_id;
end $$;
revoke all on function public.fb_apply_to_project(uuid,text) from public;
grant execute on function public.fb_apply_to_project(uuid,text) to authenticated;

create or replace function public.fb_add_milestone(p_project uuid,p_title text,p_due timestamptz default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare new_id uuid;
begin
 if auth.uid() is null or not public.fb_can_access_project(p_project,auth.uid()) then
   raise exception 'Not authorized';
 end if;
 insert into public.fb_project_milestones(project_id,title,due_at)
 values(p_project,p_title,p_due) returning id into new_id;
 return new_id;
end $$;
revoke all on function public.fb_add_milestone(uuid,text,timestamptz) from public;
grant execute on function public.fb_add_milestone(uuid,text,timestamptz) to authenticated;

create or replace function public.fb_set_milestone_done(p_milestone uuid,p_done boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 update public.fb_project_milestones m set done=p_done
 where m.id=p_milestone and public.fb_can_access_project(m.project_id,auth.uid());
 return found;
end $$;
revoke all on function public.fb_set_milestone_done(uuid,boolean) from public;
grant execute on function public.fb_set_milestone_done(uuid,boolean) to authenticated;

-- Keep milestone assignment and deletion restricted until membership/ownership
-- validation and audit logging are fully implemented.
