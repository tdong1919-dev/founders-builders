-- Apply after 20261025114545_secure_projects.sql. All changes are transactional.
begin;
create schema if not exists fb_private;
revoke all on schema fb_private from public, anon, authenticated;
grant usage on schema fb_private to authenticated;

-- Identity-bound helpers prevent querying arbitrary users' confidential relationships.
create or replace function public.fb_can_access_project(p_project uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select p_user = auth.uid() and auth.uid() is not null and (
 exists(select 1 from public.fb_projects p where p.id=p_project and p.owner_id=auth.uid())
 or exists(select 1 from public.fb_project_members m where m.project_id=p_project and m.user_id=auth.uid()))
$$;
revoke all on function public.fb_can_access_project(uuid,uuid) from public, anon;
grant execute on function public.fb_can_access_project(uuid,uuid) to authenticated;

create or replace function fb_private.owns_project(p_project uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fb_projects where id=p_project and owner_id=auth.uid())
$$;
create or replace function fb_private.can_apply(p_project uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.fb_projects
 where id=p_project and visibility='public' and published_at is not null and owner_id<>auth.uid())
$$;
revoke all on function fb_private.owns_project(uuid), fb_private.can_apply(uuid) from public, anon;
grant execute on function fb_private.owns_project(uuid), fb_private.can_apply(uuid) to authenticated;

drop policy fb_requests_read on public.fb_collaboration_requests;
create policy fb_requests_read on public.fb_collaboration_requests for select to authenticated
 using (applicant_id=(select auth.uid()) or fb_private.owns_project(project_id));
drop policy fb_requests_apply on public.fb_collaboration_requests;
create policy fb_requests_apply on public.fb_collaboration_requests for insert to authenticated
 with check (applicant_id=(select auth.uid()) and status='pending' and reviewed_at is null and fb_private.can_apply(project_id));
-- Defense in depth: preserve default-deny direct access, including inherited PUBLIC grants.
revoke all on public.fb_projects, public.fb_collaboration_requests, public.fb_project_members,
 public.fb_project_milestones from public, anon, authenticated;
-- Direct milestone mutation policies are deliberately removed; only scoped RPCs may write.
drop policy fb_milestones_add on public.fb_project_milestones;
drop policy fb_milestones_edit on public.fb_project_milestones;
drop policy fb_milestones_delete on public.fb_project_milestones;
create policy fb_projects_read_own on public.fb_projects for select to authenticated
 using (owner_id=(select auth.uid()));

create index if not exists fb_projects_owner_idx on public.fb_projects(owner_id);
create index if not exists fb_members_user_idx on public.fb_project_members(user_id);
create index if not exists fb_milestones_assignee_idx on public.fb_project_milestones(assignee_id);
alter table public.fb_projects add constraint fb_skills_bounded check
 (cardinality(skills_needed)<=30 and char_length(array_to_string(skills_needed,','))<=1500);

-- Verified email identity and bounded writes; transaction advisory locks serialize each user's quota.
create or replace function fb_private.check_write_quota() returns trigger
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); n integer;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null)
 then raise exception 'Verified email authentication required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text, 6120));
 if tg_table_name='fb_projects' then
  select count(*) into n from public.fb_projects where owner_id=actor;
  if n>=100 then raise exception 'Project limit reached'; end if;
 elsif tg_table_name='fb_collaboration_requests' then
  select count(*) into n from public.fb_collaboration_requests where applicant_id=actor and created_at>now()-interval '1 day';
  if n>=20 then raise exception 'Daily application limit reached'; end if;
 else
  select count(*) into n from public.fb_project_milestones where project_id=new.project_id;
  if n>=250 then raise exception 'Milestone limit reached'; end if;
 end if;
 return new;
end $$;
revoke all on function fb_private.check_write_quota() from public, anon, authenticated;
create trigger fb_projects_quota before insert on public.fb_projects for each row execute function fb_private.check_write_quota();
create trigger fb_requests_quota before insert on public.fb_collaboration_requests for each row execute function fb_private.check_write_quota();
create trigger fb_milestones_quota before insert on public.fb_project_milestones for each row execute function fb_private.check_write_quota();

-- Non-enumerating owner review. Lock order is project then request, matching applications.
create or replace function public.fb_review_request(p_request uuid,p_accept boolean)
returns text language plpgsql security definer set search_path='' as $$
declare r public.fb_collaboration_requests%rowtype; pid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_accept is null then raise exception 'Decision required'; end if;
 select project_id into pid from public.fb_collaboration_requests where id=p_request;
 perform 1 from public.fb_projects where id=pid and owner_id=auth.uid() for update;
 if not found then raise exception 'Request unavailable'; end if;
 select * into r from public.fb_collaboration_requests where id=p_request for update;
 if not found or r.status<>'pending' then raise exception 'Request unavailable'; end if;
 update public.fb_collaboration_requests set status=case when p_accept then 'accepted' else 'declined' end,
 reviewed_at=now() where id=p_request;
 if p_accept then insert into public.fb_project_members(project_id,user_id)
 values(r.project_id,r.applicant_id) on conflict do nothing; end if;
 return case when p_accept then 'accepted' else 'declined' end;
end $$;

create or replace function public.fb_apply_to_project(p_project uuid,p_message text)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform 1 from public.fb_projects where id=p_project and visibility='public'
 and published_at is not null and owner_id<>auth.uid() for share;
 if not found then raise exception 'Project unavailable for applications'; end if;
 if exists(select 1 from public.fb_project_members where project_id=p_project and user_id=auth.uid())
 then raise exception 'Already a member'; end if;
 insert into public.fb_collaboration_requests(project_id,applicant_id,message)
 values(p_project,auth.uid(),p_message) returning id into new_id;
 return new_id;
end $$;

create or replace function public.fb_project_members_for(p_project uuid)
returns table(user_id uuid,role text,joined_at timestamptz)
language sql stable security definer set search_path='' as $$
 select m.user_id,m.role,m.joined_at from public.fb_project_members m
 where m.project_id=p_project and public.fb_can_access_project(p_project,auth.uid())
 order by m.joined_at limit 100
$$;
revoke all on function public.fb_project_members_for(uuid) from public,anon;
grant execute on function public.fb_project_members_for(uuid) to authenticated;

-- Include accepted collaborations in the signed-in workspace list.
create or replace function public.fb_my_projects()
returns table(id uuid,title text,teaser text,stage text,visibility text,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select p.id,p.title,p.teaser,p.stage,p.visibility,p.created_at from public.fb_projects p
 where public.fb_can_access_project(p.id,auth.uid()) order by p.created_at desc limit 100
$$;
-- Supabase may grant EXECUTE to API roles through default privileges. Reset explicit
-- role grants too, then expose only this migration's reviewed public RPCs.
do $$
declare routine regprocedure;
begin
 for routine in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in (
 'fb_can_access_project','fb_discover_projects','fb_get_project','fb_review_request',
 'fb_withdraw_request','fb_create_project','fb_update_project','fb_my_projects',
 'fb_apply_to_project','fb_add_milestone','fb_set_milestone_done','fb_project_requests',
 'fb_my_requests','fb_project_milestones_for','fb_project_members_for')
 loop
  execute format('revoke all on function %s from public, anon, authenticated',routine);
  execute format('grant execute on function %s to authenticated',routine);
 end loop;
end $$;
grant execute on function public.fb_discover_projects() to anon;
commit;
