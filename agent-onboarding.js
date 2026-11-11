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
 function readiness({records,userId,task,contribution:c,now=Date.now()}){
  if(!userId||!task)return null;
  const owned=(records.grants||[]).filter(g=>g.ownerId===userId&&g.taskId===task.id),live=owned.filter(g=>g.revokedAt===null&&Number.isFinite(g.expiresAt)&&g.expiresAt>now&&Number.isInteger(g.used)&&g.used<g.maxActions);
  const request=(records.agentTasks||[]).find(r=>r.ownerId===userId&&r.taskId===task.id&&r.status==='TASK_STATE_INPUT_REQUIRED');
  const human='You confirm agreements, give feedback, share reviews, and approve portfolio use. Your agent cannot make or verify a payment here.';
  const owner=task.ownerId===userId,participant=c&&[c.founderId,c.builderId].includes(userId),active=participant&&!['closed','cancelled'].includes(c.stage);
  const permitted=new Set();for(const g of live)for(const action of g.actions||[]){const minutes=(action==='deliver'?c?.terms?.minutes:task.minutes)||task.minutes;if(minutes>g.maxTaskMinutes)continue;
   if(action==='read'||action==='coordinate'||action==='message'&&active||action==='interest'&&!owner&&!c&&!task.paused&&(!g.requireMatch||(records.matches||[]).some(m=>m.taskId===task.id))||action==='propose'&&owner&&active&&['interest','terms','agreed'].includes(c.stage)&&(task.brief?.compensation!=='paid'||Boolean(task.brief.paymentAmount&&task.brief.paymentCurrency&&task.brief.paymentTiming))||action==='deliver'&&participant&&!owner&&c.stage==='agreed'&&Number.isInteger(c.terms?.version)&&c.terms.version>0&&c.acceptedTermsVersion===c.terms.version)permitted.add(labels[action]);
  }
  const base={allowed:[...permitted].filter(Boolean),human,connection:'These are recorded permissions, not proof that your external agent is connected or running.'};
  if(request)return {...base,status:'Needs your answer',next:{kind:'agent',label:'Answer your agent',requestId:request.id}};
  if(participant&&c.next?.who===userId&&['terms','delivered','feedback','closed'].includes(c.stage))return {...base,status:'Needs your decision',next:{kind:'human',label:c.next.label||'Review this contribution'}};
  if(participant&&['closed','cancelled'].includes(c.stage))return {...base,status:'Contribution closed',next:{kind:'permissions',label:'Review remaining permissions'}};
  if(!live.length)return {...base,status:owned.length?'Permission needs renewal':'Not connected',next:{kind:'permissions',label:owned.length?'Review expiry and limits':'Set agent permissions'}};
  return {...base,status:base.allowed.length?'Permission ready':'No permitted next action',next:{kind:'permissions',label:'Review agent permissions'}};
 }
 async function probe({credential,taskId,fetcher=fetch,uuid=()=>crypto.randomUUID()}){
  if(typeof credential!=='string'||!/^fb_agent_[A-Za-z0-9_-]+$/.test(credential)||!taskId)throw Error('Create a new limited credential before testing.');
  try{
   const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+credential,'Idempotency-Key':uuid()},body:JSON.stringify({operation:'agentContext',params:{}}),credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error();const {data}=await response.json();if(data?.taskId!==taskId||!Array.isArray(data.actions)||!Number.isInteger(data.remainingRequests)||data.remainingRequests<1||!Number.isFinite(data.expiresAt)||data.expiresAt<=Date.now())throw Error();
   return 'Credential verified for this contribution. No message or work was submitted. This checks platform access; your external agent still needs its own connection test.';
  }catch{throw Error('Connection not confirmed. Check expiry, remaining requests and revocation. No message or work was submitted.');}
 }
 const api={missions,plan,probe,readiness};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBAgentOnboarding=api;
})(typeof window==='undefined'?{}:window);
