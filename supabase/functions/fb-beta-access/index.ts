import {createBetaHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')||'';
if(url!=='https://ijvokvffhcvakaultzfk.supabase.co')throw Error('Wrong project');
const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(!key)throw Error('Runtime credential missing');
const encoder=new TextEncoder(),signingKey=await crypto.subtle.importKey('raw',encoder.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const handler=createBetaHandler({
 networkHash:async request=>{const network=(request.headers.get('x-forwarded-for')||'unknown').split(',').at(-1)?.trim().slice(0,200)||'unknown';const digest=await crypto.subtle.sign('HMAC',signingKey,encoder.encode('fb-beta-v1:'+network));return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');},
 save:async ({email,role,networkHash})=>{const response=await fetch(url+'/rest/v1/rpc/fb_request_beta_access',{method:'POST',headers:{apikey:key,...(key.startsWith('ey')?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json'},body:JSON.stringify({p_email:email,p_role:role,p_network_hash:networkHash}),redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Request storage unavailable');return await response.json()===true;}
});
Deno.serve(handler);
