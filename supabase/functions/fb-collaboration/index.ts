import {createA2aHandler} from './a2a.mjs';
import {createMcpHandler} from './mcp.mjs';
import {createNotificationDelivery} from './notification-delivery.mjs';
import {createCloudHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')||'';
if(url!=='https://ijvokvffhcvakaultzfk.supabase.co')throw Error('Wrong project');
const privateKey=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY');
if(!privateKey||!publicKey)throw Error('Project runtime credentials missing');
async function rpc(name,body={}){const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:privateKey,...(privateKey.startsWith('ey')?{Authorization:'Bearer '+privateKey}:{}),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Private persistence unavailable');return r.json();}
const notificationsAvailable=Deno.env.get('FB_NOTIFICATIONS_ENABLED')==='true'&&Boolean(Deno.env.get('FB_RESEND_API_KEY')&&Deno.env.get('FB_NOTIFICATION_FROM'));
const load=()=>rpc('fb_shared_load'),commit=(revision,state)=>rpc('fb_shared_commit',{p_revision:revision,p_state:state});
const delivery=createNotificationDelivery({load,commit,secret:privateKey,authorizeDispatch:token=>typeof token==='string'&&/^[a-f0-9]{64}$/.test(token)?rpc('fb_notification_dispatch_authorized',{p_token:token}):false,enabled:notificationsAvailable,approved:email=>rpc('fb_shared_is_approved',{p_email:email}),send:async mail=>{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+Deno.env.get('FB_RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':mail.idempotencyKey},body:JSON.stringify({from:Deno.env.get('FB_NOTIFICATION_FROM'),to:[mail.to],subject:mail.subject,text:mail.text,headers:{'List-Unsubscribe':'<'+mail.unsubscribe+'>','List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Notification delivery unconfirmed');}});
const handler=createCloudHandler({notificationsAvailable,
 origins:['https://founders-builders-ux-review.hello978822.chatgpt.site','https://tdong1919-dev.github.io'],
 load:()=>rpc('fb_shared_load'),commit:(revision,state)=>rpc('fb_shared_commit',{p_revision:revision,p_state:state}),
 reserveLogin:email=>rpc('fb_shared_reserve_login',{p_email:email}),
 sendCode:async email=>{const r=await fetch(url+'/auth/v1/otp?redirect_to='+encodeURIComponent('https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html'),{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({email,create_user:true}),signal:AbortSignal.timeout(10000)});if(!r.ok){const error=Error('Email could not be sent');if(r.status===429)Object.assign(error,{code:'email_rate_limited'});throw error;}},
 verifySession:async token=>{try{const r=await fetch(url+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});if(!r.ok)return null;const user=await r.json();return user.id&&user.email_confirmed_at&&await rpc('fb_shared_is_approved',{p_email:user.email})?{id:user.id,email:user.email}:null;}catch{return null;}}
});
const mcp=createMcpHandler({command:handler,origins:['https://founders-builders-ux-review.hello978822.chatgpt.site','https://tdong1919-dev.github.io']});
const a2a=createA2aHandler({command:handler,origins:['https://founders-builders-ux-review.hello978822.chatgpt.site','https://tdong1919-dev.github.io']});
Deno.serve(req=>new URL(req.url).pathname.includes('/notifications/')?delivery.route(req):new URL(req.url).pathname.endsWith('/a2a')||new URL(req.url).pathname.endsWith('/.well-known/agent-card.json')?a2a(req):new URL(req.url).pathname.endsWith('/mcp')?mcp(req):handler(req));
