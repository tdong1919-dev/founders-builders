begin;
create extension if not exists pg_net with schema extensions;
create table public.fb_notification_dispatch_config (
 id integer primary key check(id=1),
 token_hash text not null
);
alter table public.fb_notification_dispatch_config enable row level security;
revoke all on public.fb_notification_dispatch_config from public,anon,authenticated;
grant select on public.fb_notification_dispatch_config to service_role;
-- A narrowly scoped dispatcher capability, never the Supabase service key.
do $$
declare token text:=encode(extensions.gen_random_bytes(32),'hex');
begin
 perform vault.create_secret(token,'fb_notification_dispatch_token','Triggers bounded F&B notification processing only; never returns private content.');
 insert into public.fb_notification_dispatch_config values(1,encode(extensions.digest(token,'sha256'),'hex'));
end $$;
create function public.fb_notification_dispatch_authorized(p_token text)
returns boolean language sql stable security invoker set search_path='' as $$
 select length(p_token)=64 and exists(select 1 from public.fb_notification_dispatch_config where id=1 and token_hash=encode(extensions.digest(p_token,'sha256'),'hex'))
$$;
revoke all on function public.fb_notification_dispatch_authorized(text) from public,anon,authenticated;
grant execute on function public.fb_notification_dispatch_authorized(text) to service_role;
select cron.schedule('fb-beta-notification-dispatch','*/15 * * * *',$job$
 select net.http_post(
 url:='https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-collaboration/notifications/dispatch',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='fb_notification_dispatch_token' limit 1)),
 body:='{}'::jsonb,timeout_milliseconds:=30000
 );
$job$);
commit;
