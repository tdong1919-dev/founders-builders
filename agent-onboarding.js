/* Onboarding intent is a convenience preset; the existing server grant is the authority. */
(function(root){
 'use strict';
 const endpoint='https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-collaboration';
 const missions=[{id:'advise',label:'Read and advise',actions:['read']},{id:'coordinate',label:'Ask me when help is needed',actions:['read','coordinate']},{id:'contribute',label:'Help move this contribution forward',actions:['read','message','interest','propose','deliver']}];
 const labels={read:'Read this contribution',coordinate:'Ask you questions through A2A',interest:'Share matching interest',message:'Exchange participant messages',propose:'Propose the published terms',deliver:'Submit work under confirmed terms'};
 function plan({actions,maxActions,maxTaskMinutes,expiresInMinutes}){
  const allowed=Object.keys(labels).filter(a=>actions.includes(a));
  if(!allowed.length||!Number.isInteger(maxActions)||maxActions<1||maxActions>20||!Number.isInteger(maxTaskMinutes)||maxTaskMinutes<15||maxTaskMinutes>180||!Number.isInteger(expiresInMinutes)||expiresInMinutes<1||expiresInMinutes>1440)throw Error('Choose at least one action and use whole numbers within the displayed limits.');
  return {allowed:allowed.map(a=>labels[a]),limits:maxActions+' requests · '+maxTaskMinutes+' minute task limit · expires in '+expiresInMinutes+' minutes',human:'You confirm agreements, grant or revoke access, share reviews, and approve portfolio credit. Applications must match your profile; proposals use the published brief.'};
 }
 async function probe({credential,taskId,fetcher=fetch,uuid=()=>crypto.randomUUID()}){
  if(typeof credential!=='string'||!/^fb_agent_[A-Za-z0-9_-]+$/.test(credential)||!taskId)throw Error('Create a new limited credential before testing.');
  try{
   const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+credential,'Idempotency-Key':uuid()},body:JSON.stringify({operation:'agentContext',params:{}}),credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error();const {data}=await response.json();if(data?.taskId!==taskId||!Array.isArray(data.actions)||!Number.isInteger(data.remainingRequests)||data.remainingRequests<1||!Number.isFinite(data.expiresAt)||data.expiresAt<=Date.now())throw Error();
   return 'Credential verified for this contribution. No message or work was submitted. This checks platform access; your external agent still needs its own connection test.';
  }catch{throw Error('Connection not confirmed. Check expiry, remaining requests and revocation. No message or work was submitted.');}
 }
 const api={missions,plan,probe};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBAgentOnboarding=api;
})(typeof window==='undefined'?{}:window);
