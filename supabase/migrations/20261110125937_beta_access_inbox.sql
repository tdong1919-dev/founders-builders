-- Private inbox. No direct anon/authenticated reads or writes and no automatic approval.
create table public.fb_beta_access_requests (
 email text primary key check (length(email)<=254 and email=lower(btrim(email))),
 role text not null check (role in ('founder','builder','both')),
 consent_version text not null default 'beta-access-v1' check (consent_version='beta-access-v1'),
 created_at timestamptz not null default now(),
 status text not null default 'pending' check (status in ('pending','invited','declined'))
);
create table public.fb_beta_access_limits (
 key text primary key,
 window_start timestamptz not null,
 requests integer not null check (requests>0)
);
create index fb_beta_access_limits_expiry on public.fb_beta_access_limits(window_start);
alter table public.fb_beta_access_requests enable row level security;
alter table public.fb_beta_access_limits enable row level security;
revoke all on public.fb_beta_access_requests,public.fb_beta_access_limits from public,anon,authenticated;
grant select,insert,update on public.fb_beta_access_requests to service_role;
grant select,insert,update,delete on public.fb_beta_access_limits to service_role;
create function public.fb_request_beta_access(p_email text,p_role text,p_network_hash text)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare v_key text; v_limit integer; v_used integer; v_now timestamptz:=clock_timestamp();
begin
 if p_email is null or p_role is null or p_network_hash is null or length(p_email)>254 or p_email<>lower(btrim(p_email)) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_role not in ('founder','builder','both') or p_network_hash !~ '^[a-f0-9]{64}$' then
  raise exception 'invalid request' using errcode='22023';
 end if;
 -- Serialize this small inbox so caps cannot be bypassed with parallel calls.
 perform pg_advisory_xact_lock(184928171);
 delete from public.fb_beta_access_limits where window_start<v_now-interval '7 days';
 foreach v_key in array array['global',p_network_hash] loop
  v_limit:=case when v_key='global' then 100 else 10 end;
  insert into public.fb_beta_access_limits as limits(key,window_start,requests) values(v_key,v_now,1)
  on conflict(key) do update set window_start=case when limits.window_start<=v_now-interval '1 hour' then v_now else limits.window_start end,
   requests=case when limits.window_start<=v_now-interval '1 hour' then 1 else least(limits.requests+1,100000) end
  returning requests into v_used;
  if v_used>v_limit then return false; end if;
 end loop;
 -- A hard inbox cap prevents unbounded storage. Same response for existing/new emails.
 if (select count(*) from public.fb_beta_access_requests)>=1000 then return false; end if;
 insert into public.fb_beta_access_requests(email,role) values(p_email,p_role) on conflict(email) do nothing;
 return true;
end; $$;
revoke all on function public.fb_request_beta_access(text,text,text) from public,anon,authenticated;
grant execute on function public.fb_request_beta_access(text,text,text) to service_role;
comment on table public.fb_beta_access_requests is 'Unverified beta interest only. Manual review required; never grants access or subscribes to marketing.';
