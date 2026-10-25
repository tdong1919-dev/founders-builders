import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const context={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../cloud-config.js',import.meta.url),'utf8'),context);const config=context.window.FB_CLOUD_CONFIG,origin='https://founders-builders-ux-review.hello978822.chatgpt.site';let requests=0;
async function send(path,body,extra={}){requests++;return fetch(config.url+path,{method:body?'POST':'GET',headers:{apikey:config.publishableKey,'Content-Type':'application/json',Origin:origin,...extra},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});}
try{
 const unauth=await send('/functions/v1/fb-collaboration',{operation:'list',params:{}});assert.equal(unauth.status,401);assert.equal(unauth.headers.get('access-control-allow-origin'),origin);console.log('Anonymous collaboration data denied: PASS');
 const forged=await send('/functions/v1/fb-collaboration',{operation:'list',params:{}},{Authorization:'Bearer forged_user_token_1234','Idempotency-Key':crypto.randomUUID()});assert.equal(forged.status,401);console.log('Forged account token denied: PASS');
 for(const table of ['fb_shared_cloud_state','fb_shared_approved_accounts','fb_projects']){const r=await send('/rest/v1/'+table+'?select=*');assert.ok([401,403,404].includes(r.status));}console.log('Raw private tables denied: PASS');
 for(const rpc of ['fb_shared_load','fb_shared_commit','fb_shared_is_approved']){const r=await send('/rest/v1/rpc/'+rpc,rpc==='fb_shared_is_approved'?{p_email:'outsider@example.test'}:{});assert.ok([401,403,404].includes(r.status));}console.log('Private persistence RPCs denied: PASS');
 const evil=await send('/functions/v1/fb-collaboration',{operation:'list',params:{}},{Origin:'https://unapproved.invalid'});assert.equal(evil.status,403);assert.equal(evil.headers.get('access-control-allow-origin'),null);console.log('Unapproved browser origin denied: PASS');
 const settings=await send('/auth/v1/settings');assert.equal(settings.status,200);const data=await settings.json();console.log('Real email authentication available: '+Boolean(data.external?.email));
 console.log('Verified '+requests+' real HTTPS boundary requests; no email was sent.');
}catch{console.error('Cloud boundary verification failed. No credentials or private responses printed.');process.exitCode=1;}
