begin;
-- A private application aggregate for the first controlled beta. Never expose it as a browser table API.
create table public.fb_shared_cloud_state (
 id integer primary key check(id=1),
 revision bigint not null default 0,
 body jsonb not null check(jsonb_typeof(body)='object' and body->>'format'='fb-shared-v1'),
 updated_at timestamptz not null default now()
);
alter table public.fb_shared_cloud_state enable row level security;
revoke all on public.fb_shared_cloud_state from public,anon,authenticated;
grant select,update on public.fb_shared_cloud_state to service_role;
insert into public.fb_shared_cloud_state(id,body) values(1,'{"format":"fb-shared-v1","tasks":{},"contributions":{},"grants":{},"credits":{},"events":[],"sequence":0,"credentials":{},"requests":{},"securityEvents":[]}');
create table public.fb_shared_approved_accounts (
 email text primary key check(email=lower(email) and length(email)<=254),
 active boolean not null default true,
 last_code_at timestamptz,
 code_window_at timestamptz,
 code_count integer not null default 0
);
alter table public.fb_shared_approved_accounts enable row level security;
revoke all on public.fb_shared_approved_accounts from public,anon,authenticated;
grant select on public.fb_shared_approved_accounts to service_role;
create function public.fb_shared_load() returns jsonb
 language sql security definer set search_path='' as $$
 select jsonb_build_object('revision',revision,'state',body) from public.fb_shared_cloud_state where id=1
$$;
create function public.fb_shared_commit(p_revision bigint,p_state jsonb) returns boolean
 language plpgsql security definer set search_path='' as $$
begin
 if p_revision is null or p_state is null or p_state->>'format'<>'fb-shared-v1' then raise exception 'Invalid cloud snapshot'; end if;
 update public.fb_shared_cloud_state set body=p_state,revision=revision+1,updated_at=now() where id=1 and revision=p_revision;
 return found;
end $$;
create function public.fb_shared_is_approved(p_email text) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fb_shared_approved_accounts where email=lower(p_email) and active)
$$;
create function public.fb_shared_reserve_login(p_email text) returns boolean
 language plpgsql security definer set search_path='' as $$
declare accepted boolean;
begin
 update public.fb_shared_approved_accounts
 set last_code_at=now(),code_count=case when code_window_at is null or code_window_at<now()-interval '1 hour' then 1 else code_count+1 end,
 code_window_at=case when code_window_at is null or code_window_at<now()-interval '1 hour' then now() else code_window_at end
 where email=lower(p_email) and active and (last_code_at is null or last_code_at<now()-interval '90 seconds')
 and (code_window_at is null or code_window_at<now()-interval '1 hour' or code_count<3);
 accepted:=found;return accepted;
end $$;
revoke all on function public.fb_shared_load(),public.fb_shared_commit(bigint,jsonb),public.fb_shared_is_approved(text),public.fb_shared_reserve_login(text) from public,anon,authenticated;
grant execute on function public.fb_shared_load(),public.fb_shared_commit(bigint,jsonb),public.fb_shared_is_approved(text),public.fb_shared_reserve_login(text) to service_role;
-- Keep automatic RLS enabled, while preventing client execution of its event-trigger helper.
do $$begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
 execute 'revoke execute on function public.rls_auto_enable() from public,anon,authenticated';
 end if;
end $$;
commit;
