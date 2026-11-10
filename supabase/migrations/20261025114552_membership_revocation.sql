-- Owner-controlled access revocation with a private audit trail.
begin;
create table fb_private.membership_audit (
 id bigint generated always as identity primary key,
 project_id uuid not null,
 actor_id uuid not null,
 member_id uuid not null,
 action text not null check (action='removed'),
 occurred_at timestamptz not null default now()
);
alter table fb_private.membership_audit enable row level security;
revoke all on fb_private.membership_audit from public,anon,authenticated;
revoke all on sequence fb_private.membership_audit_id_seq from public,anon,authenticated;

create function public.fb_remove_project_member(p_project uuid,p_member uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform 1 from public.fb_projects where id=p_project and owner_id=auth.uid() for update;
 if not found then raise exception 'Project unavailable'; end if;
 if p_member=auth.uid() then raise exception 'Project owner cannot be removed'; end if;
 delete from public.fb_project_members where project_id=p_project and user_id=p_member;
 if not found then return false; end if;
 update public.fb_collaboration_requests set status='declined',reviewed_at=now()
 where project_id=p_project and applicant_id=p_member and status='accepted';
 insert into fb_private.membership_audit(project_id,actor_id,member_id,action)
 values(p_project,auth.uid(),p_member,'removed');
 return true;
end $$;
revoke all on function public.fb_remove_project_member(uuid,uuid) from public,anon,authenticated;
grant execute on function public.fb_remove_project_member(uuid,uuid) to authenticated;

-- Serialize additions per project, including quota checks across different members.
-- This lock also ensures member removal and milestone writes have a defined order.
create or replace function public.fb_add_milestone(p_project uuid,p_title text,p_due timestamptz default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 perform 1 from public.fb_projects where id=p_project for update;
 if auth.uid() is null or not public.fb_can_access_project(p_project,auth.uid())
 then raise exception 'Not authorized'; end if;
 insert into public.fb_project_milestones(project_id,title,due_at)
 values(p_project,p_title,p_due) returning id into new_id;
 return new_id;
end $$;
create or replace function public.fb_set_milestone_done(p_milestone uuid,p_done boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select project_id into pid from public.fb_project_milestones where id=p_milestone;
 perform 1 from public.fb_projects where id=pid for share;
 update public.fb_project_milestones m set done=p_done where m.id=p_milestone
 and public.fb_can_access_project(m.project_id,auth.uid());
 return found;
end $$;
commit;
