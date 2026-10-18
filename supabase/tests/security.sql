\set ON_ERROR_STOP on
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
select public.fb_create_project('Private alpha','Public teaser alpha','SECRET ALPHA') as private_id \gset
select public.fb_create_project('Public beta','Public teaser beta','SECRET BETA') as public_id \gset
select pg_temp.assert((select visibility='private' from public.fb_get_project(:'private_id')),'private by default');
select pg_temp.assert(public.fb_update_project(:'public_id','Public beta','Public teaser beta','SECRET BETA','Idea','{}','Open to discussion',true),'owner publishes');
select public.fb_add_milestone(:'public_id','Private milestone') as milestone_id \gset
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select pg_temp.assert((select count(*)=0 from public.fb_get_project(:'private_id')),'outsider cannot read private project');
select pg_temp.assert((select count(*)=0 from public.fb_get_project(:'public_id')),'public teaser does not grant private access');
select pg_temp.assert(not public.fb_can_access_project(:'private_id','00000000-0000-0000-0000-000000000001'),'cannot probe other user membership');
select pg_temp.assert(not public.fb_update_project(:'public_id','Hacked title','Hacked teaser','Hacked','Idea','{}','Open to discussion',true),'outsider cannot edit project');
select pg_temp.assert((select count(*)=0 from public.fb_project_milestones_for(:'public_id')),'outsider cannot read milestones');
select public.fb_apply_to_project(:'public_id','I can help build this project securely.') as request_id \gset
select pg_temp.assert((select count(*)=0 from public.fb_project_requests(:'public_id')),'applicant cannot read owner queue');
select set_config('test.request',:'request_id',true);
do $$begin
 begin perform public.fb_review_request(current_setting('test.request')::uuid,true); raise exception 'FAIL unauthorized review';
 exception when raise_exception then if sqlerrm<>'Request unavailable' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert(public.fb_review_request(:'request_id',true)='accepted','owner accepts');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select pg_temp.assert((select private_brief='SECRET BETA' from public.fb_get_project(:'public_id')),'member reads private brief');
select pg_temp.assert((select count(*)=1 from public.fb_project_members_for(:'public_id')),'member lists members');
select pg_temp.assert(public.fb_set_milestone_done(:'milestone_id',true),'member updates milestone');
select pg_temp.assert(not public.fb_withdraw_request(:'request_id'),'cannot withdraw accepted request');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select pg_temp.assert(not public.fb_set_milestone_done(:'milestone_id',false),'outsider cannot update milestone');
select pg_temp.assert((select count(*)=0 from public.fb_project_members_for(:'public_id')),'outsider cannot list members');
select public.fb_apply_to_project(:'public_id','I would like to help with the launch.') as declined_id \gset
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select pg_temp.assert(public.fb_review_request(:'declined_id',false)='declined','owner declines');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select pg_temp.assert((select count(*)=0 from public.fb_get_project(:'public_id')),'decline grants no access');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
do $$begin
 begin perform public.fb_create_project('Unverified','Unverified user teaser'); raise exception 'FAIL unverified write';
 exception when insufficient_privilege then null; end;
end$$;
-- Negative RPC cases use fixed project IDs saved as transaction settings.
select set_config('test.private',:'private_id',true);
select set_config('test.public',:'public_id',true);
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
reset role;
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
