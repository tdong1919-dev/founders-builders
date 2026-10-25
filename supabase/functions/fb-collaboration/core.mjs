/* Generated from collaboration-core.js. No credentials. */
const module={exports:{}};
/* Shared collaboration rules. Trusted identity and transactions belong to the server. */
(function(root){
 'use strict';
 const agentActions=['read','interest','message','propose','deliver'];
 function fail(code,message){const e=Error(message);e.code=code;throw e;}
 function text(value,max=1500){if(typeof value!=='string'||!value.trim()||value.length>max)fail('invalid','Complete the required details within the allowed length.');return value.trim();}
 function optional(value,max=1500){return value==null||value===''?'':text(value,max);}
 function initial(){return {format:'fb-shared-v1',tasks:{},contributions:{},grants:{},credits:{},events:[],sequence:0};}
 function create({state,now=Date.now,id,principal}){
  if(!state||state.format!=='fb-shared-v1'||typeof id!=='function')fail('unavailable','Shared storage is unavailable.');
  if(!principal||typeof principal.userId!=='string'||!principal.userId)fail('unauthenticated','A server-verified account is required.');
  const user=principal.userId,agent=principal.grantId||null;
  const own=(map,key)=>typeof key==='string'&&Object.hasOwn(map,key)?map[key]:null;
  const taskFor=key=>{const t=own(state.tasks,key);if(!t)fail('not_found','Task unavailable.');return t;};
  const contributionFor=key=>{const c=own(state.contributions,key);if(!c||![c.founderId,c.builderId].includes(user))fail('not_found','Contribution unavailable.');return c;};
  function human(){if(agent)fail('human_required','This decision requires the person’s verified account.');}
  function authorize(action,task){
   if(!agent)return;
   const g=own(state.grants,agent);
   if(!g||g.ownerId!==user||g.revokedAt!==null||g.expiresAt<=now()||!g.actions.includes(action)||g.taskId!==task.id||g.used>=g.maxActions||task.minutes>g.maxTaskMinutes)fail('permission_denied','Agent permission is expired, revoked, exhausted or outside this task.');
   g.used++;log('agent_request_allowed',task.id,null,{action});
  }
  function version(record,expected){if(!Number.isInteger(expected)||expected!==record.version)fail('conflict','This task changed. Refresh before acting; nothing was overwritten.');}
  function log(type,taskId,contributionId=null,details=null){state.events.push({sequence:++state.sequence,id:id(),at:now(),actorId:user,grantId:agent,type,taskId,contributionId,...(details?{details:JSON.parse(JSON.stringify(details))}:{})});}
  function owner(task){if(task.ownerId!==user)fail('forbidden','Only the task owner can do this.');}
  function terms(input){
   if(!input||!Number.isInteger(input.minutes)||input.minutes<15||input.minutes>180||!['paid','unpaid'].includes(input.compensation))fail('invalid','Agree a 15–180 minute limit and explicit compensation.');
   return {deliverable:text(input.deliverable),acceptance:text(input.acceptance),outside:text(input.outside),minutes:input.minutes,support:text(input.support),compensation:input.compensation,compensationDetails:text(input.compensationDetails),ownership:text(input.ownership),feedbackTiming:text(input.feedbackTiming),credit:text(input.credit)};
  }
  function next(c){return {interest:{who:c.founderId,label:'Propose clear terms'},terms:{who:c.builderId,label:'Review exact terms'},agreed:{who:c.builderId,label:'Deliver the agreed work'},delivered:{who:c.founderId,label:'Give feedback and credit'},feedback:{who:c.builderId,label:c.portfolioAllowed?'Record portfolio credit':'Close contribution privately'},closed:{who:null,label:'Contribution complete'},cancelled:{who:null,label:'Closed without completion'}}[c.stage];}
  function run(operation,p={}){
   if(operation==='createTask'){
    human();const brief=terms(p.brief),task={id:id(),ownerId:user,title:text(p.title,120),brief,minutes:brief.minutes,visibility:p.visibility==='public'?'public':'private',version:1};state.tasks[task.id]=task;log('task_created',task.id);return task;
   }
   if(operation==='list'){
    if(agent)fail('permission_denied','Agents may access only the task in their grant.');
    return {tasks:Object.values(state.tasks).filter(t=>t.ownerId===user||t.visibility==='public'||Object.values(state.contributions).some(c=>c.taskId===t.id&&c.builderId===user)).map(t=>t.ownerId===user?t:{id:t.id,title:t.title,ownerId:t.ownerId,minutes:t.minutes,visibility:t.visibility,version:t.version}),contributions:Object.values(state.contributions).filter(c=>[c.founderId,c.builderId].includes(user)).map(c=>({...c,next:next(c)})),grants:Object.values(state.grants).filter(g=>g.ownerId===user)};
   }
   if(operation==='report'){
    human();const collaborations=Object.values(state.contributions).filter(c=>[c.founderId,c.builderId].includes(user)),ids=new Set(collaborations.map(c=>c.id));
    const events=state.events.filter(e=>ids.has(e.contributionId)||e.actorId===user),grants=Object.values(state.grants).filter(g=>g.ownerId===user);
    return {scope:'This account’s authorized collaboration records only; no ecosystem comparison or independently verified outcomes.',contributions:collaborations.length,closed:collaborations.filter(c=>c.stage==='closed').length,cancelled:collaborations.filter(c=>c.stage==='cancelled').length,awaitingMyAction:collaborations.filter(c=>next(c).who===user).length,termsConfirmed:events.filter(e=>e.type==='terms_confirmed').length,deliveries:events.filter(e=>e.type==='work_delivered').length,feedbackShared:events.filter(e=>e.type==='feedback_shared').length,clarifyingMessages:events.filter(e=>e.type==='message_shared').length,permittedCredits:collaborations.filter(c=>c.portfolioAllowed&&Object.hasOwn(state.credits,c.id)).length,activeGrants:grants.filter(g=>g.revokedAt===null&&g.expiresAt>now()&&g.used<g.maxActions).length,revokedGrants:grants.filter(g=>g.revokedAt!==null).length,suggestion:collaborations.some(c=>c.stage==='terms')?'Some proposed terms await confirmation. Keep scope and portfolio permission explicit; do not bypass review.':'Use completed work and participant feedback to improve briefs. These records do not establish which agent or person performs better.'};
   }
   if(operation==='grant'){
    human();const task=taskFor(p.taskId);if(task.visibility!=='public'&&task.ownerId!==user&&!Object.values(state.contributions).some(c=>c.taskId===task.id&&c.builderId===user))fail('not_found','Task unavailable.');
    if(!Array.isArray(p.actions)||!p.actions.length||p.actions.some(a=>!agentActions.includes(a))||!Number.isInteger(p.maxActions)||p.maxActions<1||p.maxActions>20||!Number.isInteger(p.maxTaskMinutes)||p.maxTaskMinutes<15||p.maxTaskMinutes>180||!Number.isInteger(p.expiresInMinutes)||p.expiresInMinutes<1||p.expiresInMinutes>1440)fail('invalid','Choose explicit actions, a task limit, 1–20 actions and an expiry within 24 hours.');
    const g={id:id(),ownerId:user,taskId:task.id,actions:[...new Set(p.actions)],maxActions:p.maxActions,maxTaskMinutes:p.maxTaskMinutes,used:0,createdAt:now(),expiresAt:now()+p.expiresInMinutes*60000,revokedAt:null};state.grants[g.id]=g;log('agent_granted',task.id);return g;
   }
   if(operation==='revoke'){
    human();const g=own(state.grants,p.grantId);if(!g||g.ownerId!==user)fail('not_found','Grant unavailable.');if(g.revokedAt===null){g.revokedAt=now();log('agent_revoked',g.taskId);}return {id:g.id,revoked:true};
   }
   if(operation==='readTask'){
    const task=taskFor(p.taskId);if(task.visibility!=='public'&&task.ownerId!==user&&!Object.values(state.contributions).some(c=>c.taskId===task.id&&c.builderId===user))fail('not_found','Task unavailable.');authorize('read',task);return task;
   }
   if(operation==='interest'){
    const task=taskFor(p.taskId);if(task.visibility!=='public'||task.ownerId===user)fail('forbidden','Choose an available task owned by someone else.');
    if(Object.values(state.contributions).some(c=>c.taskId===task.id&&c.builderId===user))fail('conflict','Interest is already recorded for this task.');
    const note=text(p.note);authorize('interest',task);const c={id:id(),taskId:task.id,founderId:task.ownerId,builderId:user,note,messages:[],stage:'interest',version:1,terms:null,acceptedTermsVersion:null,delivery:null,feedback:null,portfolioAllowed:false};state.contributions[c.id]=c;log('interest_shared',task.id,c.id,{note});return {...c,next:next(c)};
   }
   if(operation==='activity'){
    const task=taskFor(p.taskId);authorize('read',task);
    const mine=new Set(Object.values(state.contributions).filter(c=>c.taskId===task.id&&[c.founderId,c.builderId].includes(user)).map(c=>c.id));
    if(task.ownerId!==user&&!mine.size)fail('not_found','Activity unavailable.');
    return state.events.filter(e=>e.taskId===task.id&&(task.ownerId===user||mine.has(e.contributionId)||e.actorId===user));
   }
   const c=contributionFor(p.contributionId),task=taskFor(c.taskId);
   if(operation==='exportCredit'){
    human();const credit=own(state.credits,c.id);if(c.builderId!==user||!credit||!c.portfolioAllowed||c.stage!=='closed')fail('forbidden','Portfolio permission is unavailable or has been revoked.');
    return {format:'fb-permitted-credit-v1',text:credit.text,scope:'Participant-recorded contribution; not independently verified by Founders & Builders.'};
   }
   if(operation==='revokePortfolio'){
    human();owner(task);if(c.portfolioAllowed){c.portfolioAllowed=false;c.version++;log('portfolio_permission_revoked',task.id,c.id);}return {...c,next:next(c)};
   }
   version(c,p.expectedVersion);
   if(operation==='message'){
    if(['closed','cancelled'].includes(c.stage))fail('invalid_stage','This conversation is closed.');const message=text(p.text);authorize('message',task);(c.messages||=[]).push({actorId:user,at:now(),text:message});c.version++;log('message_shared',task.id,c.id,{text:message});return {...c,next:next(c)};
   }
   if(operation==='close'){
    human();if(['closed','cancelled'].includes(c.stage))fail('invalid_stage','This contribution is already closed.');c.endReason=text(p.reason,800);c.stage='cancelled';c.version++;log('contribution_cancelled',task.id,c.id,{reason:c.endReason});return {...c,next:next(c)};
   }
   if(operation==='allowPortfolio'){
    human();owner(task);if(!c.feedback||!['feedback','closed'].includes(c.stage)||p.confirm!==true)fail('forbidden','Review and explicitly allow the exact credit text first.');c.portfolioAllowed=true;c.version++;log('portfolio_permission_granted',task.id,c.id,{creditText:c.feedback.creditText});return {...c,next:next(c)};
   }
   if(operation==='closePrivate'){
    human();if(c.builderId!==user||c.stage!=='feedback')fail('forbidden','Only the contributor can close reviewed work.');c.stage='closed';c.version++;log('contribution_closed_privately',task.id,c.id);return {...c,next:next(c)};
   }
   if(operation==='propose'){
    owner(task);if(!['interest','terms','agreed'].includes(c.stage)||c.delivery)fail('invalid_stage','Terms cannot change after delivery.');const proposed=terms(p.terms);authorize('propose',{...task,minutes:proposed.minutes});c.terms={...proposed,version:(c.terms?.version||0)+1};c.acceptedTermsVersion=null;c.stage='terms';log('terms_proposed',task.id,c.id,c.terms);
   }else if(operation==='accept'){
    human();if(c.builderId!==user||c.stage!=='terms'||p.termsVersion!==c.terms.version)fail('forbidden','Only the contributor can confirm this exact proposal.');c.acceptedTermsVersion=c.terms.version;c.stage='agreed';log('terms_confirmed',task.id,c.id);
   }else if(operation==='deliver'){
    if(c.builderId!==user||c.stage!=='agreed'||c.acceptedTermsVersion!==c.terms.version)fail('forbidden','Confirm the current terms before delivering work.');const delivery={notes:text(p.notes),evidence:optional(p.evidence,800)};
    if(delivery.evidence){let u;try{u=new URL(delivery.evidence);}catch{}if(!u||u.protocol!=='https:'||u.username||u.password)fail('invalid','Use an HTTPS evidence link without credentials.');}
    authorize('deliver',{...task,minutes:c.terms.minutes});c.delivery=delivery;c.stage='delivered';log('work_delivered',task.id,c.id,delivery);
   }else if(operation==='feedback'){
    human();owner(task);if(c.stage!=='delivered')fail('invalid_stage','Review delivered work before giving credit.');c.feedback={notes:text(p.notes),creditText:text(p.creditText,800)};c.portfolioAllowed=p.allowPortfolio===true;c.stage='feedback';log('feedback_shared',task.id,c.id,{...c.feedback,portfolioAllowed:c.portfolioAllowed});
   }else if(operation==='recordCredit'){
    human();if(c.builderId!==user||!['feedback','closed'].includes(c.stage)||!c.portfolioAllowed)fail('forbidden','Founder sharing permission is required before recording portfolio credit.');state.credits[c.id]={contributionId:c.id,ownerId:user,text:c.feedback.creditText,recordedAt:now()};c.stage='closed';log('credit_recorded',task.id,c.id);
   }else fail('invalid','Unsupported collaboration action.');
   c.version++;return {...c,next:next(c)};
  }
  return {run};
 }
 const api={initial,create,agentActions};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBSharedCollaboration=api;
})(typeof window==='undefined'?{}:window);

export default module.exports;
