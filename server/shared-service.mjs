/* Private service foundation. No server is started merely by importing this module. */
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import fs from 'node:fs';
const require=createRequire(import.meta.url),core=require('../collaboration-core.js');
const hash=s=>createHash('sha256').update(s).digest('hex');
export function openStore(filename){
 const db=new DatabaseSync(filename);if(filename!==':memory:')fs.chmodSync(filename,0o600);
 db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS agent_tokens(hash TEXT PRIMARY KEY,owner TEXT NOT NULL,grant_id TEXT NOT NULL); CREATE TABLE IF NOT EXISTS requests(scope TEXT NOT NULL,key TEXT NOT NULL,digest TEXT NOT NULL,response TEXT NOT NULL,PRIMARY KEY(scope,key)); CREATE TABLE IF NOT EXISTS ledger(sequence INTEGER PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS security_events(id TEXT PRIMARY KEY,owner TEXT NOT NULL,grant_id TEXT,operation TEXT NOT NULL,reason TEXT NOT NULL,at INTEGER NOT NULL);');
 if(!db.prepare('SELECT id FROM state WHERE id=1').get())db.prepare('INSERT INTO state VALUES(1,?)').run(JSON.stringify(core.initial()));
 return {db,close:()=>db.close(),transact(fn){db.exec('BEGIN IMMEDIATE');try{const state=JSON.parse(db.prepare('SELECT body FROM state WHERE id=1').get().body),before=state.sequence,result=fn(state,db);for(const e of state.events.filter(e=>e.sequence>before))db.prepare('INSERT INTO ledger VALUES(?,?)').run(e.sequence,JSON.stringify(e));db.prepare('UPDATE state SET body=? WHERE id=1').run(JSON.stringify(state));db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
export function createSharedService({store,verifySession,origin,now=Date.now}){
 if(!store||typeof verifySession!=='function'||!origin)throw Error('Storage, trusted session verification and an explicit origin are required.');
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 return {async fetch(request){
  let principal,attemptedOperation='unknown';
  try{
   const url=new URL(request.url);if(url.origin!==origin||url.pathname!=='/api/collaboration')return reply({error:'not_found'},404);
   if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
   if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return reply({error:'forbidden'},403);
   if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid',message:'Use JSON.'},400);
   const bearer=/^Bearer ([A-Za-z0-9._~-]{16,4096})$/.exec(request.headers.get('authorization')||'')?.[1];
   if(!bearer)return reply({error:'unauthenticated'},401);

   if(bearer.startsWith('fb_agent_')){
    const row=store.db.prepare('SELECT owner,grant_id FROM agent_tokens WHERE hash=?').get(hash(bearer));
    if(row)principal={userId:row.owner,grantId:row.grant_id};
   }else{
    const identity=await verifySession(bearer);
    if(identity?.id&&identity.emailVerified===true)principal={userId:identity.id};
   }
   if(!principal)return reply({error:'unauthenticated'},401);
   if(Number(request.headers.get('content-length'))>20000)return reply({error:'too_large'},413);
   let raw='',bytes=0;const reader=request.body?.getReader();if(!reader)return reply({error:'invalid'},400);
   const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>20000){await reader.cancel();return reply({error:'too_large'},413);}raw+=decoder.decode(part.value,{stream:true});}raw+=decoder.decode();
   let input;try{input=JSON.parse(raw);}catch{return reply({error:'invalid',message:'Invalid JSON.'},400);}
   if(!input||typeof input.operation!=='string'||!input.params||typeof input.params!=='object'||Array.isArray(input.params))return reply({error:'invalid'},400);
   attemptedOperation=input.operation;
   const key=request.headers.get('idempotency-key');if(!key||!/^[a-zA-Z0-9_-]{8,100}$/.test(key))return reply({error:'invalid',message:'A unique idempotency key is required.'},400);
   const digest=hash(raw),scope=principal.userId+':'+(principal.grantId||'human');
   const result=store.transact((state,db)=>{
    if(principal.grantId){const g=state.grants[principal.grantId];if(!g||g.ownerId!==principal.userId||g.revokedAt!==null||g.expiresAt<=now()){const e=Error('Agent permission is revoked or expired.');e.code='permission_denied';throw e;}}
    const readOnly=['list','readTask','matchTask','readContribution','activity','exportCredit','agentAudit','report'].includes(input.operation);
    const saved=readOnly?null:db.prepare('SELECT digest,response FROM requests WHERE scope=? AND key=?').get(scope,key);
    if(saved){if(saved.digest!==digest){const e=Error('Do not reuse a request key for different work.');e.code='conflict';throw e;}return JSON.parse(saved.response);}
    let data;
    if(input.operation==='agentAudit'){
     if(principal.grantId){const e=Error('Only the owner can review agent audit history.');e.code='human_required';throw e;}
     data=db.prepare('SELECT grant_id AS grantId,operation,reason,at FROM security_events WHERE owner=? ORDER BY at DESC LIMIT 100').all(principal.userId);
    }else data=core.create({state,principal,now,id:randomUUID}).run(input.operation,input.params);
    let token;
    if(input.operation==='grant'){token='fb_agent_'+randomBytes(32).toString('base64url');db.prepare('INSERT INTO agent_tokens VALUES(?,?,?)').run(hash(token),principal.userId,data.id);}
    // A retried grant returns its metadata, never another copy of its secret.
    if(!readOnly)db.prepare('INSERT INTO requests VALUES(?,?,?,?)').run(scope,key,digest,JSON.stringify({data}));
    return {data,...(token?{agentToken:token}:{})};
   });return reply(result);
  }catch(error){
   if(principal&&['permission_denied','forbidden','human_required','conflict','invalid_stage'].includes(error.code)){try{store.db.prepare('INSERT INTO security_events VALUES(?,?,?,?,?,?)').run(randomUUID(),principal.userId,principal.grantId||null,/^[A-Za-z]{1,40}$/.test(attemptedOperation)?attemptedOperation:'unknown',error.code,now());}catch{}}
   const status={unauthenticated:401,permission_denied:403,forbidden:403,human_required:403,not_found:404,conflict:409,invalid:400,invalid_stage:409}[error.code]||503;return reply({error:error.code||'unavailable',message:status===503?'Shared service unavailable. No success was confirmed.':error.message},status);}
 }};
}
/* This verifies the token with Supabase, not by decoding untrusted JWT claims. */
export function supabaseSessionVerifier({url,publishableKey,fetcher=fetch}){
 const base=new URL(url);if(base.protocol!=='https:'||!/^[a-z0-9]+\.supabase\.co$/.test(base.hostname)||base.pathname!=='/'||base.username||base.password||base.search||base.hash||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))throw Error('Use a project URL and public publishable key.');
 return async token=>{try{const r=await fetcher(base.origin+'/auth/v1/user',{headers:{apikey:publishableKey,Authorization:'Bearer '+token},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)return null;const u=await r.json();return typeof u.id==='string'&&u.email_confirmed_at?{id:u.id,emailVerified:true}:null;}catch{return null;}};
}
