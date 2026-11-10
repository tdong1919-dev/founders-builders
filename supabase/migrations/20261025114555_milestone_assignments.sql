-- Assignments never grant project membership. Only the owner can assign work.
begin;
create table fb_private.milestone_assignment_audit (
 id bigint generated always as identity primary key,
 project_id uuid not null,
 milestone_id uuid not null,
 actor_id uuid not null,
 previous_assignee uuid,
 next_assignee uuid,
 action text not null check (action in ('assigned','unassigned','revoked')),
 occurred_at timestamptz not null default now()
);
alter table fb_private.milestone_assignment_audit enable row level security;
revoke all on fb_private.milestone_assignment_audit from public,anon,authenticated;
revoke all on sequence fb_private.milestone_assignment_audit_id_seq from public,anon,authenticated;

create function public.fb_assign_milestone(p_milestone uuid,p_assignee uuid default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare pid uuid; previous uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select project_id into pid from public.fb_project_milestones where id=p_milestone;
 perform 1 from public.fb_projects where id=pid and owner_id=auth.uid() for update;
 if not found then raise exception 'Milestone unavailable'; end if;
 if p_assignee is not null and p_assignee<>auth.uid() and not exists(
  select 1 from public.fb_project_members where project_id=pid and user_id=p_assignee)
 then raise exception 'Assignee must be the owner or an accepted member'; end if;
 select assignee_id into previous from public.fb_project_milestones where id=p_milestone;
 if previous is not distinct from p_assignee then return true; end if;
 update public.fb_project_milestones set assignee_id=p_assignee where id=p_milestone;
 insert into fb_private.milestone_assignment_audit(project_id,milestone_id,actor_id,previous_assignee,next_assignee,action)
 values(pid,p_milestone,auth.uid(),previous,p_assignee,case when p_assignee is null then 'unassigned' else 'assigned' end);
 return true;
end $$;
revoke all on function public.fb_assign_milestone(uuid,uuid) from public,anon,authenticated;
grant execute on function public.fb_assign_milestone(uuid,uuid) to authenticated;

create or replace function public.fb_remove_project_member(p_project uuid,p_member uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform 1 from public.fb_projects where id=p_project and owner_id=auth.uid() for update;
 if not found then raise exception 'Project unavailable'; end if;
 if p_member=auth.uid() then raise exception 'Project owner cannot be removed'; end if;
 delete from public.fb_project_members where project_id=p_project and user_id=p_member;
 if not found then return false; end if;
 insert into fb_private.milestone_assignment_audit(project_id,milestone_id,actor_id,previous_assignee,next_assignee,action)
 select project_id,id,auth.uid(),assignee_id,null,'revoked' from public.fb_project_milestones
 where project_id=p_project and assignee_id=p_member;
 update public.fb_project_milestones set assignee_id=null where project_id=p_project and assignee_id=p_member;
 update public.fb_collaboration_requests set status='declined',reviewed_at=now()
 where project_id=p_project and applicant_id=p_member and status='accepted';
 insert into fb_private.membership_audit(project_id,actor_id,member_id,action)
 values(p_project,auth.uid(),p_member,'removed');
 return true;
end $$;
commit;
