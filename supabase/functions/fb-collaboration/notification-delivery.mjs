const origin='https://founders-builders-ux-review.hello978822.chatgpt.site';
const encode=s=>btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=s=>atob(s.replaceAll('-','+').replaceAll('_','/'));
const enc=new TextEncoder();
export function createNotificationDelivery({load,commit,secret,send,approved,authorizeDispatch=async()=>false,enabled=false,now=Date.now}){
 const key=crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 async function token(user,version){const data=encode(JSON.stringify({user,version})),signature=await crypto.subtle.sign('HMAC',await key,enc.encode(data));return data+'.'+encode(String.fromCharCode(...new Uint8Array(signature)));}
 async function verify(value){try{if(typeof value!=='string'||value.length>800)return null;const [data,sig,...extra]=value.split('.');if(extra.length||!await crypto.subtle.verify('HMAC',await key,Uint8Array.from(decode(sig),c=>c.charCodeAt(0)),enc.encode(data)))return null;const p=JSON.parse(decode(data));return typeof p.user==='string'&&Number.isInteger(p.version)?p:null;}catch{return null;}}
 async function unsubscribe(value){const p=await verify(value);if(!p)return false;for(let attempt=0;attempt<5;attempt++){const s=await load(),pref=s.state.emailUpdates?.[p.user];if(!pref?.enabled||pref.version!==p.version)return true;pref.enabled=false;pref.version++;pref.changedAt=now();for(const job of Object.values(s.state.emailOutbox||{}))if(job.userId===p.user&&job.status!=='sent')job.status='cancelled';if(await commit(s.revision,s.state))return true;}return false;}
 async function dispatch(){
  if(!enabled)return {enabled:false,sent:0};let sent=0;
  // One delivery per invocation. CAS lease prevents overlapping workers; provider key handles ambiguous retries.
  for(let attempt=0;attempt<5;attempt++){
   const s=await load(),state=s.state,at=now();state.emailDeliveryBudget??={};
   const jobs=Object.values(state.emailOutbox||{});const job=jobs.find(j=>(j.status==='pending'||j.status==='sending'&&j.leaseUntil<at)&&!jobs.some(other=>other.id!==j.id&&other.userId===j.userId&&(other.status==='sending'&&other.leaseUntil>=at||other.status==='sent'&&other.sentAt>at-86400000)));if(!job)return {enabled:true,sent};
   const pref=state.emailUpdates?.[job.userId];
   if(!pref?.enabled||pref.version!==job.preferenceVersion||!await approved(pref.email)||job.at<at-7*86400000||job.firstAttemptAt&&job.firstAttemptAt<at-23*3600000){job.status='expired';if(await commit(s.revision,state))continue;else continue;}
   const prior=Object.values(state.emailOutbox).filter(j=>j.userId===job.userId&&j.status==='sent');
   if(prior.some(j=>j.sentAt>at-86400000))return {enabled:true,sent};
   const day=new Date(at).toISOString().slice(0,10),month=day.slice(0,7),d=state.emailDeliveryBudget[day]||0,m=state.emailDeliveryBudget[month]||0;
   if(d>=10||m>=200)return {enabled:true,sent,budgetLimited:true};
   const claim=crypto.randomUUID();job.status='sending';job.claim=claim;job.leaseUntil=at+60000;job.firstAttemptAt??=at;state.emailDeliveryBudget[day]=d+1;state.emailDeliveryBudget[month]=m+1;
   for(const k of Object.keys(state.emailDeliveryBudget))if(k<month&&k!==month)delete state.emailDeliveryBudget[k];
   if(!await commit(s.revision,state))continue;
   // Recheck consent and approval immediately before handing a generic email to the provider.
   const fresh=await load(),current=fresh.state.emailUpdates?.[job.userId];let success=false;
   if(enabled&&current?.enabled&&current.version===job.preferenceVersion&&await approved(current.email)){
    const link='https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-collaboration/notifications/unsubscribe?token='+await token(job.userId,job.preferenceVersion);
    try{await send({to:current.email,idempotencyKey:'fb-update-'+job.id,subject:'Your Founders & Builders workspace has an update',text:'There is a collaboration update in your private workspace.\n\nOpen your workspace: '+origin+'/cloud-workspace.html\n\nNo project details are included in this email. You chose optional collaboration updates.\n\nUnsubscribe: '+link,unsubscribe:link});success=true;}catch{}
   }
   for(let finish=0;finish<5;finish++){const latest=await load(),saved=latest.state.emailOutbox?.[job.id];if(saved?.claim!==claim)break;saved.status=success?'sent':'sending';if(success){saved.sentAt=now();for(const other of Object.values(latest.state.emailOutbox))if(other.userId===job.userId&&other.id!==job.id&&other.status==='pending'&&other.at<=at)other.status='cancelled';}if(await commit(latest.revision,latest.state))break;}
   return {enabled:true,sent:success?1:0};
  }
  return {enabled:true,sent,conflict:true};
 }
 async function route(request){const u=new URL(request.url),headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",'X-Content-Type-Options':'nosniff'};
  if(u.pathname.endsWith('/notifications/dispatch')){if(request.method!=='POST'||!await authorizeDispatch(request.headers.get('authorization')?.replace(/^Bearer /,'')))return new Response('Forbidden',{status:403});return Response.json(await dispatch(),{headers:{'Cache-Control':'no-store'}});}
  if(!u.pathname.endsWith('/notifications/unsubscribe'))return new Response('Not found',{status:404});
  const value=u.searchParams.get('token');if(!await verify(value))return new Response('This unsubscribe link is invalid. Use email settings in your workspace.',{status:400,headers});
  if(request.method==='POST'){const ok=await unsubscribe(value);return new Response(ok?'Email updates are off. Sign-in emails are unchanged.':'Could not confirm. Please try again or disable updates in your workspace.',{status:ok?200:503,headers});}
  if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
  return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email updates · Founders &amp; Builders</title><h1>Turn off collaboration emails?</h1><p>Your account and sign-in emails stay available.</p><form method="post"><button>Unsubscribe</button></form></html>',{headers});
 }
 return {dispatch,unsubscribe,token,route};
}
