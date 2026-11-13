/* Owner-only SQL planner. Never connects, holds credentials, sends mail, or deletes accounts. */
import {pathToFileURL} from 'node:url';
const quote=v=>{if(String(v).includes('$fb$')||String(v).includes('\0'))throw Error('Unsupported SQL delimiter or null character.');return "'"+String(v).replaceAll("'","''")+"'";};
const email=v=>{if(typeof v!=='string'||v.length>254||! /^[A-Za-z0-9.!#$%&*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v))throw Error('Use the exact reviewed email address.');return v.toLowerCase();};
const uuid=v=>{if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v||''))throw Error('Use an exact UUID.');return v;};
const revision=v=>{if(!Number.isSafeInteger(Number(v))||Number(v)<0||v==='')throw Error('Use the current snapshot revision.');return Number(v);};
const stamp=v=>{if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(v||'')||!Number.isFinite(Date.parse(v)))throw Error('Use the exact request time in UTC ISO format.');return v;};
export function plan(action,args={}){
 const prefix='-- OWNER ONLY: Supabase SQL Editor, project ijvokvffhcvakaultzfk. Review before execution.\n';
 if(action==='queue')return prefix+`select email,role,created_at,status from public.fb_beta_access_requests where status='pending' order by created_at;
select revision, jsonb_array_length(coalesce(body->'concerns','[]')) as total_reports from public.fb_shared_cloud_state where id=1;
select r->>'id' as report_id,r->>'reason' as reason,r->>'details' as private_details,r->>'status' as status,to_timestamp((r->>'at')::numeric/1000) as received_at from public.fb_shared_cloud_state cross join lateral jsonb_array_elements(coalesce(body->'concerns','[]')) r where id=1 and r->>'status' in ('pending','needs_followup') order by r->>'at';`;
 if(action==='approve'){
  if(args.verified!==true)throw Error('Verify the request/address through the normal invitation process first; then add --verified.');const address=email(args.email),at=stamp(args.createdAt);
  return prefix+`begin;
do $fb$ declare target text:=${quote(address)}; reviewed_at timestamptz:=${quote(at)}::timestamptz; begin
 perform 1 from public.fb_beta_access_requests where email=target and status='pending' and created_at=reviewed_at for update;
 if not found then raise exception 'Request changed or is unavailable. Refresh the queue.'; end if;
 insert into public.fb_shared_approved_accounts(email,active) values(target,true) on conflict(email) do update set active=true;
 update public.fb_beta_access_requests set status='invited' where email=target and status='pending' and created_at=reviewed_at;
end $fb$;
commit;
-- Approval sends no email. Have the verified owner request their own sign-in link. Reversing an accidental approval also requires revoking agent grants.`;
 }
 if(action==='review-report'){
  const id=uuid(args.id),rev=revision(args.revision),expected=args.expectedStatus||'pending';if(!['pending','needs_followup'].includes(expected))throw Error('Choose pending or needs_followup as the expected status.');if(!['resolved','dismissed','needs_followup'].includes(args.outcome)||typeof args.note!=='string'||!args.note.trim()||args.note.length>500)throw Error('Choose resolved, dismissed, or needs_followup and a short factual review note.');
  return prefix+`begin;
do $fb$ declare state jsonb; replacement jsonb; begin
 select body into state from public.fb_shared_cloud_state where id=1 and revision=${rev} for update;
 if not found then raise exception 'Snapshot changed. Refresh before review.'; end if;
 if (select count(*) from jsonb_array_elements(coalesce(state->'concerns','[]')) r where r->>'id'=${quote(id)} and r->>'status'=${quote(expected)})<>1 then raise exception 'Report changed or is unavailable.'; end if;
 select jsonb_agg(case when r->>'id'=${quote(id)} then r||jsonb_build_object('status',${quote(args.outcome)},'reviewedAt',floor(extract(epoch from now())*1000),'reviewNote',${quote(args.note.trim())},'reviewedBy','operator') else r end order by ord) into replacement from jsonb_array_elements(coalesce(state->'concerns','[]')) with ordinality as x(r,ord);
 update public.fb_shared_cloud_state set body=jsonb_set(state,'{concerns}',replacement),revision=revision+1,updated_at=now() where id=1 and revision=${rev};
end $fb$;
commit;
-- Triage does not suspend anyone or send an email. Review follow-up separately.`;
 }
 if(action==='suspend'){
  const address=email(args.email),id=uuid(args.id),rev=revision(args.revision);if(args.verified!==true)throw Error('Verify the exact account and suspension decision first; then add --verified.');
  return prefix+`begin;
do $fb$ declare state jsonb; grants jsonb; begin
 if not exists(select 1 from auth.users where id=${quote(id)}::uuid and lower(email)=${quote(address)}) then raise exception 'Account identity does not match.'; end if;
 select body into state from public.fb_shared_cloud_state where id=1 and revision=${rev} for update;
 if not found then raise exception 'Snapshot changed. Refresh before suspension.'; end if;
 update public.fb_shared_approved_accounts set active=false where email=${quote(address)};
 if not found then raise exception 'Approved account unavailable.'; end if;
 select coalesce(jsonb_object_agg(k,case when v->>'ownerId'=${quote(id)} then v||jsonb_build_object('revokedAt',floor(extract(epoch from now())*1000)) else v end),'{}') into grants from jsonb_each(coalesce(state->'grants','{}')) as g(k,v);
 state:=jsonb_set(state,'{grants}',grants);
 -- Withdrawal is reversible; no private records or Auth identity are purged.
 state:=jsonb_set(state,'{publicPeople}',coalesce(state->'publicPeople','{}')||case when state->'publicPeople' ? ${quote(id)} then jsonb_build_object(${quote(id)},(state->'publicPeople'->${quote(id)})||jsonb_build_object('enabled',false,'version',coalesce((state->'publicPeople'->${quote(id)}->>'version')::int,0)+1)) else '{}'::jsonb end);
 state:=jsonb_set(state,'{publicCapabilities}',coalesce(state->'publicCapabilities','{}')||case when state->'publicCapabilities' ? ${quote(id)} then jsonb_build_object(${quote(id)},(state->'publicCapabilities'->${quote(id)})||jsonb_build_object('enabled',false,'version',coalesce((state->'publicCapabilities'->${quote(id)}->>'version')::int,0)+1)) else '{}'::jsonb end);
 select coalesce(jsonb_object_agg(k,case when state->'tasks'->(v->>'taskId')->>'ownerId'=${quote(id)} then v||jsonb_build_object('enabled',false,'version',coalesce((v->>'version')::int,0)+1) else v end),'{}') into grants from jsonb_each(coalesce(state->'publicOpportunities','{}')) as g(k,v);state:=jsonb_set(state,'{publicOpportunities}',grants);
 select coalesce(jsonb_object_agg(k,case when v->>'ownerId'=${quote(id)} then v||jsonb_build_object('enabled',false,'version',coalesce((v->>'version')::int,0)+1) else v end),'{}') into grants from jsonb_each(coalesce(state->'publicProjects','{}')) as g(k,v);state:=jsonb_set(state,'{publicProjects}',grants);
 state:=jsonb_set(state,'{emailUpdates}',coalesce(state->'emailUpdates','{}')||jsonb_build_object(${quote(id)},coalesce(state->'emailUpdates'->${quote(id)},'{}')||jsonb_build_object('enabled',false,'version',coalesce((state->'emailUpdates'->${quote(id)}->>'version')::int,0)+1)));
 select coalesce(jsonb_object_agg(k,case when v->>'userId'=${quote(id)} and v->>'status'<>'sent' then v||jsonb_build_object('status','cancelled') else v end),'{}') into grants from jsonb_each(coalesce(state->'emailOutbox','{}')) as g(k,v);state:=jsonb_set(state,'{emailOutbox}',grants);
 select coalesce(jsonb_object_agg(k,case when v->>'ownerId'=${quote(id)} then v||jsonb_build_object('enabled',false) else v end),'{}') into grants from jsonb_each(coalesce(state->'publicCredits','{}')) as g(k,v);state:=jsonb_set(state,'{publicCredits}',grants);
 update public.fb_shared_cloud_state set body=state,revision=revision+1,updated_at=now() where id=1 and revision=${rev};
end $fb$;
commit;
-- Recheck human and agent denial. Unblocking outreach is different from restoring suspended account access.`;
 }
 if(action==='deletion-plan'){
  const id=uuid(args.id);return prefix+`-- Read-only inventory, NOT permission to delete. Verify the requester via account email first.
select id,email_confirmed_at is not null as verified_email from auth.users where id=${quote(id)}::uuid;
select revision,
 (select count(*) from jsonb_each(coalesce(body->'projects','{}')) p where p.value->>'ownerId'=${quote(id)}) as owned_projects,
 (select count(*) from jsonb_each(coalesce(body->'tasks','{}')) t where t.value->>'ownerId'=${quote(id)}) as owned_tasks,
 (select count(*) from jsonb_each(coalesce(body->'contributions','{}')) c where ${quote(id)} in (c.value->>'founderId',c.value->>'builderId')) as shared_contributions,
 (select count(*) from jsonb_each(coalesce(body->'grants','{}')) g where g.value->>'ownerId'=${quote(id)} and g.value->>'revokedAt' is null) as unrevoked_grants
from public.fb_shared_cloud_state where id=1;
-- 1. Acknowledge within 7 days; aim for completion within 30 days.
-- 2. Suspend access and agent grants, stop email updates, and withdraw public cards/credit.
-- 3. Agree retention decisions for shared contributions; provide export if requested.
-- 4. Review profiles, publicPeople/publicProjects/publicCredits/publicCapabilities/publicOpportunities,
--    tasks, contributions, grants/credentials, requests cache, events, securityEvents, reviews,
--    invitations, agentTasks, concerns, blocks and email preferences/outbox, plus managed Auth.
-- 5. Obtain exact permanent-deletion confirmation before any purge. Do not use a fixture purge on production.
-- 6. Check public disappearance, denied access, retained shared records and separately retained backup policy.
-- No DELETE or Auth removal is generated by this command.`;
 }
 throw Error('Use queue, approve, review-report, suspend, or deletion-plan. This tool prints reviewable SQL only.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const args={};for(let i=3;i<process.argv.length;i++){const key=process.argv[i];if(!key.startsWith('--'))throw Error('Use named arguments.');const name=key.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());args[name]=name==='verified'?true:process.argv[++i];}console.log(plan(process.argv[2],args));}catch(e){console.error(e.message);process.exitCode=1;}}
