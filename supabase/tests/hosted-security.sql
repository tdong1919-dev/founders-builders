-- Portable SQL equivalent of security.sql; fixtures roll back.
begin;
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
insert into auth.users(id,email_confirmed_at) values
('00000000-0000-0000-0000-000000000001',now()),('00000000-0000-0000-0000-000000000002',now()),
('00000000-0000-0000-0000-000000000003',now()),('00000000-0000-0000-0000-000000000004',null);
select pg_temp.assert((select count(*)=4 from pg_class where relname in ('fb_projects','fb_collaboration_requests','fb_project_members','fb_project_milestones') and relrowsecurity),'four tables have RLS');
select pg_temp.assert(not has_table_privilege('authenticated','public.fb_projects','SELECT'),'raw project reads revoked');
select pg_temp.assert(not has_table_privilege('anon','public.fb_project_milestones','SELECT'),'anonymous milestone reads revoked');
select pg_temp.assert(not has_function_privilege('anon','public.fb_create_project(text,text,text,text,text[],text)','EXECUTE'),'anonymous cannot create');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('fb_test.private_id', (public.fb_create_project('Private alpha','Public teaser alpha','SECRET ALPHA'))::text,true);
select set_config('fb_test.public_id', (public.fb_create_project('Public beta','Public teaser beta','SECRET BETA'))::text,true);
select pg_temp.assert((select visibility='private' from public.fb_get_project(current_setting('fb_test.private_id')::uuid)),'private by default');
select pg_temp.assert(public.fb_update_project(current_setting('fb_test.public_id')::uuid,'Public beta','Public teaser beta','SECRET BETA','Idea','{}','Open to discussion',true),'owner publishes');
select set_config('fb_test.milestone_id', (public.fb_add_milestone(current_setting('fb_test.public_id')::uuid,'Private milestone'))::text,true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select pg_temp.assert((select count(*)=0 from public.fb_get_project(current_setting('fb_test.private_id')::uuid)),'outsider cannot read private project');
select pg_temp.assert((select count(*)=0 from public.fb_get_project(current_setting('fb_test.public_id')::uuid)),'public teaser does not grant private access');
select pg_temp.assert(not public.fb_can_access_project(current_setting('fb_test.private_id')::uuid,'00000000-0000-0000-0000-000000000001'),'cannot probe other user membership');
select pg_temp.assert(not public.fb_update_project(current_setting('fb_test.public_id')::uuid,'Hacked title','Hacked teaser','Hacked','Idea','{}','Open to discussion',true),'outsider cannot edit project');
select pg_temp.assert((select count(*)=0 from public.fb_project_milestones_for(current_setting('fb_test.public_id')::uuid)),'outsider cannot read milestones');
select set_config('fb_test.request_id', (public.fb_apply_to_project(current_setting('fb_test.public_id')::uuid,'I can help build this project securely.'))::text,true);
select pg_temp.assert((select count(*)=0 from public.fb_project_requests(current_setting('fb_test.public_id')::uuid)),'applicant cannot read owner queue');
select set_config('test.request',(current_setting('fb_test.request_id')::uuid)::text,true);
do $$begin
 begin perform public.fb_review_request(current_setting('test.request')::uuid,true); raise exception 'FAIL unauthorized review';
 exception when raise_exception then if sqlerrm<>'Request unavailable' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert(public.fb_review_request(current_setting('fb_test.request_id')::uuid,true)='accepted','owner accepts');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select pg_temp.assert((select private_brief='SECRET BETA' from public.fb_get_project(current_setting('fb_test.public_id')::uuid)),'member reads private brief');
select pg_temp.assert((select count(*)=1 from public.fb_project_members_for(current_setting('fb_test.public_id')::uuid)),'member lists members');
select pg_temp.assert(public.fb_set_milestone_done(current_setting('fb_test.milestone_id')::uuid,true),'member updates milestone');
select pg_temp.assert(not public.fb_withdraw_request(current_setting('fb_test.request_id')::uuid),'cannot withdraw accepted request');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select pg_temp.assert(not public.fb_set_milestone_done(current_setting('fb_test.milestone_id')::uuid,false),'outsider cannot update milestone');
select pg_temp.assert((select count(*)=0 from public.fb_project_members_for(current_setting('fb_test.public_id')::uuid)),'outsider cannot list members');
select set_config('fb_test.declined_id', (public.fb_apply_to_project(current_setting('fb_test.public_id')::uuid,'I would like to help with the launch.'))::text,true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert(public.fb_review_request(current_setting('fb_test.declined_id')::uuid,false)='declined','owner declines');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select pg_temp.assert((select count(*)=0 from public.fb_get_project(current_setting('fb_test.public_id')::uuid)),'decline grants no access');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
do $$begin
 begin perform public.fb_create_project('Unverified','Unverified user teaser'); raise exception 'FAIL unverified write';
 exception when insufficient_privilege then null; end;
end$$;
-- Negative RPC cases use fixed project IDs saved as transaction settings.
select set_config('test.private',(current_setting('fb_test.private_id')::uuid)::text,true);
select set_config('test.public',(current_setting('fb_test.public_id')::uuid)::text,true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$begin
 begin perform public.fb_apply_to_project(current_setting('test.public')::uuid,'I should not apply to my own project.'); raise exception 'FAIL self application';
 exception when raise_exception then if sqlerrm<>'Project unavailable for applications' then raise; end if; end;
 begin perform public.fb_review_request(current_setting('test.request')::uuid,true); raise exception 'FAIL repeated acceptance';
 exception when raise_exception then if sqlerrm<>'Request unavailable' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$begin
 begin perform public.fb_apply_to_project(current_setting('test.private')::uuid,'I should not apply to a private project.'); raise exception 'FAIL private application';
 exception when raise_exception then if sqlerrm<>'Project unavailable for applications' then raise; end if; end;
end$$;
-- Direct membership forgery and brief reads must fail even for a signed-in actor.
do $$begin
 begin execute 'insert into public.fb_project_members(project_id,user_id) values ($1,auth.uid())' using current_setting('test.private')::uuid; raise exception 'FAIL forged membership';
 exception when insufficient_privilege then null; end;
 begin perform private_brief from public.fb_projects; raise exception 'FAIL raw brief read';
 exception when insufficient_privilege then null; end;
end$$;
-- Assignment grants no access and can target only the owner or accepted members.
select set_config('test.milestone',(current_setting('fb_test.milestone_id')::uuid)::text,true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert(public.fb_assign_milestone(current_setting('fb_test.milestone_id')::uuid,'00000000-0000-0000-0000-000000000001'),'owner can self-assign');
select pg_temp.assert(public.fb_assign_milestone(current_setting('fb_test.milestone_id')::uuid,null),'owner can unassign');
select pg_temp.assert(public.fb_assign_milestone(current_setting('fb_test.milestone_id')::uuid,'00000000-0000-0000-0000-000000000002'),'owner can assign accepted member');
select pg_temp.assert(public.fb_assign_milestone(current_setting('fb_test.milestone_id')::uuid,'00000000-0000-0000-0000-000000000002'),'repeated assignment is idempotent');
select pg_temp.assert((select assignee_id='00000000-0000-0000-0000-000000000002'::uuid from public.fb_project_milestones_for(current_setting('fb_test.public_id')::uuid) where id=current_setting('fb_test.milestone_id')::uuid),'assignment is saved');
do $$begin
 begin perform public.fb_assign_milestone(current_setting('test.milestone')::uuid,'00000000-0000-0000-0000-000000000003'); raise exception 'FAIL outsider assignee';
 exception when raise_exception then if sqlerrm<>'Assignee must be the owner or an accepted member' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$begin
 begin perform public.fb_assign_milestone(current_setting('test.milestone')::uuid,auth.uid()); raise exception 'FAIL member assignment';
 exception when raise_exception then if sqlerrm<>'Milestone unavailable' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$begin
 begin perform public.fb_assign_milestone(current_setting('test.milestone')::uuid,auth.uid()); raise exception 'FAIL outsider assignment';
 exception when raise_exception then if sqlerrm<>'Milestone unavailable' then raise; end if; end;
end$$;
-- Only owners may revoke access, and revocation affects every private operation.
select set_config('test.member','00000000-0000-0000-0000-000000000002',true);
do $$begin
 begin perform public.fb_remove_project_member(current_setting('test.public')::uuid,current_setting('test.member')::uuid);
 raise exception 'FAIL outsider removed member';
 exception when raise_exception then if sqlerrm<>'Project unavailable' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert(public.fb_remove_project_member(current_setting('fb_test.public_id')::uuid,'00000000-0000-0000-0000-000000000002'),'owner removes member');
select pg_temp.assert(not public.fb_remove_project_member(current_setting('fb_test.public_id')::uuid,'00000000-0000-0000-0000-000000000002'),'repeated removal returns false');
select pg_temp.assert((select assignee_id is null from public.fb_project_milestones_for(current_setting('fb_test.public_id')::uuid) where id=current_setting('fb_test.milestone_id')::uuid),'revocation clears assigned work');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select pg_temp.assert((select count(*)=0 from public.fb_get_project(current_setting('fb_test.public_id')::uuid)),'removed member cannot read brief');
select pg_temp.assert((select count(*)=0 from public.fb_project_milestones_for(current_setting('fb_test.public_id')::uuid)),'removed member cannot read milestones');
select pg_temp.assert((select count(*)=0 from public.fb_my_projects()),'removed collaboration leaves workspace');
select pg_temp.assert(not public.fb_set_milestone_done(current_setting('fb_test.milestone_id')::uuid,false),'removed member cannot edit milestone');
do $$begin
 begin perform public.fb_add_milestone(current_setting('test.public')::uuid,'Unauthorized milestone'); raise exception 'FAIL removed member added milestone';
 exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
end$$;
reset role;
select pg_temp.assert((select count(*)=1 from fb_private.membership_audit),'revocation audit recorded exactly once');
select pg_temp.assert(not has_table_privilege('authenticated','fb_private.membership_audit','SELECT'),'audit is private');
select pg_temp.assert(not has_function_privilege('anon','public.fb_remove_project_member(uuid,uuid)','EXECUTE'),'anonymous cannot invoke removal');
select pg_temp.assert((select count(*)=4 from fb_private.milestone_assignment_audit),'assignment changes and revocation audited once');
select pg_temp.assert(not has_table_privilege('authenticated','fb_private.milestone_assignment_audit','SELECT'),'assignment audit is private');
select pg_temp.assert(not has_function_privilege('anon','public.fb_assign_milestone(uuid,uuid)','EXECUTE'),'anonymous assignment denied');
-- Check policies independently from grants, only inside this rolled-back transaction.
grant select on public.fb_projects,public.fb_collaboration_requests,public.fb_project_members,public.fb_project_milestones to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select pg_temp.assert((select count(*)=0 from public.fb_projects),'RLS hides outsider projects');
select pg_temp.assert((select count(*)=1 from public.fb_collaboration_requests),'RLS reads own request without project permission error');
select pg_temp.assert((select count(*)=0 from public.fb_project_members),'RLS hides outsider memberships');
select pg_temp.assert((select count(*)=0 from public.fb_project_milestones),'RLS hides outsider milestones');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert((select count(*)=2 from public.fb_collaboration_requests),'RLS owner reads applications');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert((select count(*)=1 from public.fb_discover_projects()),'anonymous sees published only');
select pg_temp.assert(not(select to_jsonb(d)?'private_brief' from public.fb_discover_projects() d limit 1),'discovery excludes private brief');
rollback;
