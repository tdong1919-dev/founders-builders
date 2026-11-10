begin;
-- Retire only the unused legacy workspace API. The active cloud handler uses fb_shared_*.
do $$
declare signature text;
begin
 foreach signature in array array[
 'public.fb_add_milestone(uuid,text,timestamp with time zone)',
 'public.fb_apply_to_project(uuid,text)','public.fb_assign_milestone(uuid,uuid)',
 'public.fb_can_access_project(uuid,uuid)','public.fb_create_project(text,text,text,text,text[],text)',
 'public.fb_discover_projects()','public.fb_get_project(uuid)','public.fb_my_projects()',
 'public.fb_my_requests()','public.fb_project_members_for(uuid)','public.fb_project_milestones_for(uuid)',
 'public.fb_project_requests(uuid)','public.fb_remove_project_member(uuid,uuid)',
 'public.fb_review_request(uuid,boolean)','public.fb_set_milestone_done(uuid,boolean)',
 'public.fb_update_project(uuid,text,text,text,text,text[],text,boolean)','public.fb_withdraw_request(uuid)'
 ] loop
 if to_regprocedure(signature) is not null then
 execute format('revoke execute on function %s from public, anon, authenticated',to_regprocedure(signature));
 end if;
 end loop;
end $$;
-- Built-in scheduling on the existing free project; no new compute or paid branch.
create extension if not exists pg_cron;
create table public.fb_beta_operations_metrics (
 day date primary key,
 counts jsonb not null,
 recorded_at timestamptz not null default now()
);
alter table public.fb_beta_operations_metrics enable row level security;
revoke all on public.fb_beta_operations_metrics from public,anon,authenticated;
grant select on public.fb_beta_operations_metrics to service_role;
select cron.schedule('fb-beta-retention-and-metrics','15 3 * * *',$job$
 delete from public.fb_beta_access_requests where status='pending' and created_at<now()-interval '90 days';
 delete from public.fb_beta_access_limits where window_start<now()-interval '7 days';
 insert into public.fb_beta_operations_metrics(day,counts)
 select current_date,jsonb_build_object(
 'aggregate_bytes',octet_length(body::text),
 'tasks',(select count(*) from jsonb_object_keys(body->'tasks')),
 'contributions',(select count(*) from jsonb_object_keys(body->'contributions')),
 'pending_reports',(select count(*) from jsonb_array_elements(coalesce(body->'concerns','[]')) r where r->>'status'='pending'),
 'pending_emails',(select count(*) from jsonb_each(coalesce(body->'emailOutbox','{}')) j where j.value->>'status' in ('pending','sending')),
 'pending_access',(select count(*) from public.fb_beta_access_requests where status='pending'),
 'database_bytes',pg_database_size(current_database()))
 from public.fb_shared_cloud_state where id=1
 on conflict(day) do update set counts=excluded.counts,recorded_at=now();
 delete from public.fb_beta_operations_metrics where day<current_date-30;
 delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname like 'fb-beta-%') and end_time<now()-interval '30 days';
$job$);
commit;
