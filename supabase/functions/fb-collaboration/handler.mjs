import core from './core.mjs';
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const secret=()=> 'fb_agent_'+btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const readonly=new Set(['a2aGet','agentContext','list','readTask','matchTask','readContribution','activity','exportCredit','report','agentAudit']);
export function createCloudHandler({load,commit,verifySession,reserveLogin,sendCode,origins,now=Date.now}){
 if(!origins?.length)throw Error('Explicit browser origins required.');
 return async request=>{
  const origin=request.headers.get('Origin'),cors=origin&&origins.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  if(origin&&!origins.includes(origin))return reply({error:'forbidden'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, idempotency-key','Access-Control-Max-Age':'600'}});
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  try{
   if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},400);
   let raw='',bytes=0;const reader=request.body?.getReader();if(!reader)return reply({error:'invalid'},400);const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>20000){await reader.cancel();return reply({error:'too_large'},413);}raw+=decoder.decode(part.value,{stream:true});}raw+=decoder.decode();
   let input;try{input=JSON.parse(raw);}catch{return reply({error:'invalid'},400);}
   if(!input||typeof input.operation!=='string'||!input.params||typeof input.params!=='object'||Array.isArray(input.params))return reply({error:'invalid'},400);
   if(input.operation==='sendCode'){
    const email=typeof input.params.email==='string'?input.params.email.trim().toLowerCase():'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return reply({error:'invalid',message:'Enter a valid email address.'},400);
    if(await reserveLogin(email))await sendCode(email);
    return reply({data:{message:'Check your inbox and spam folder. Approved accounts receive a link when email limits allow. Wait at least 90 seconds before trying again.'}});
   }
   if(input.operation==='discoverPublic'){
    try{const snapshot=await load();return reply({data:core.discoverPublic(snapshot.state,input.params)});}catch(e){return reply({error:e.code==='invalid'?'invalid':'unavailable',message:'Public discovery is unavailable or the filters are invalid.'},e.code==='invalid'?400:503);}
   }
   const bearer=/^Bearer ([A-Za-z0-9._~-]{16,4096})$/.exec(request.headers.get('authorization')||'')?.[1];if(!bearer)return reply({error:'unauthenticated',message:'Sign in to continue.'},401);
   const key=request.headers.get('idempotency-key');if(!key||!/^[A-Za-z0-9_-]{8,100}$/.test(key))return reply({error:'invalid',message:'A unique request key is required.'},400);
   const human=bearer.startsWith('fb_agent_')?null:await verifySession(bearer);if(!human&&!bearer.startsWith('fb_agent_'))return reply({error:'unauthenticated',message:'A verified, approved account is required.'},401);
   const tokenHash=bearer.startsWith('fb_agent_')?await sha(bearer):null,digest=await sha(raw);
   for(let attempt=0;attempt<5;attempt++){
    const snapshot=await load(),state=snapshot.state;state.credentials??={};state.requests??={};state.securityEvents??=[];
    const principal=tokenHash?state.credentials[tokenHash]:{userId:human.id};if(!principal)return reply({error:'unauthenticated'},401);
    const scope=principal.userId+':'+(principal.grantId||'human'),cacheKey=await sha(scope+':'+key);
    let result,status=200,changed=false;
    try{
     if(principal.grantId){const grant=state.grants[principal.grantId];if(!grant||grant.ownerId!==principal.userId||grant.revokedAt!==null||grant.expiresAt<=now()){const e=Error('Agent permission is expired or revoked.');e.code='permission_denied';throw e;}}
     const saved=readonly.has(input.operation)?null:state.requests[cacheKey];
     if(saved){if(saved.digest!==digest){const e=Error('Request key was already used for different work.');e.code='conflict';throw e;}return reply(saved.result);}
     if(!readonly.has(input.operation)&&!['revoke','revokePortfolio','close','withdrawOpportunity','withdrawCapability'].includes(input.operation)&&(Object.keys(state.tasks).length>=2000||Object.keys(state.contributions).length>=5000||JSON.stringify(state).length>2000000)){const e=Error('The controlled beta storage limit was reached. Existing permissions can still be revoked.');e.code='quota';throw e;}
     const before=state.sequence;
     let data;if(input.operation==='agentAudit'){if(principal.grantId){const e=Error('Only people can review this audit.');e.code='human_required';throw e;}data=state.securityEvents.filter(e=>e.ownerId===principal.userId).slice(-100).map(({ownerId,...rest})=>rest);}
     else data=core.create({state,principal,now,id:()=>crypto.randomUUID()}).run(input.operation,input.params);
     result={data};changed=state.sequence!==before;
     if(input.operation==='grant'){const token=secret();state.credentials[await sha(token)]={userId:principal.userId,grantId:data.id};result.agentToken=token;changed=true;}
     if(!readonly.has(input.operation)){state.requests[cacheKey]={digest,result:{data}};changed=true;}
    }catch(error){status={unauthenticated:401,not_found:404,forbidden:403,permission_denied:403,human_required:403,conflict:409,invalid:400,invalid_stage:409,quota:429}[error.code]||503;
     result={error:error.code||'unavailable',message:status===503?'Cloud action could not be confirmed. Refresh before retrying.':error.message};
     // Discard any partial mutation; record only a sanitized denial against the original snapshot.
     const original=await load();if(original.revision!==snapshot.revision)continue;Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,original.state);
     state.securityEvents??=[];state.securityEvents.push({ownerId:principal.userId,grantId:principal.grantId||null,operation:/^[A-Za-z]{1,40}$/.test(input.operation)?input.operation:'unknown',reason:result.error,at:now()});changed=true;
    }
    if(!changed)return reply(result,status);
    if(await commit(snapshot.revision,state))return reply(result,status);
   }
   return reply({error:'conflict',message:'Shared progress changed. Refresh and retry; nothing was overwritten.'},409);
  }catch(error){if(error.code==='email_rate_limited')return reply({error:'email_rate_limited',message:'No sign-in email was sent: the app has reached its email sending limit. Please wait up to an hour before trying once more.'},429);return reply({error:'unavailable',message:'Cloud service is unavailable. No success was confirmed.'},503);}
 };
}
