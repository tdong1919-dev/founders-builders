// Private beta controls. No client-selected identity or notification destination.
const error=(code,message)=>{throw Object.assign(Error(message),{code});};
export const blocked=(state,a,b)=>Boolean(state.blocks?.[a]?.[b]||state.blocks?.[b]?.[a]);
export function settings(state,user,available=false){const p=state.emailUpdates?.[user]||{};return {enabled:p.enabled===true,version:p.version||0,available,blockedUsers:Object.keys(state.blocks?.[user]||{})};}
export function control(state,principal,operation,p,now,available){
 if(principal.grantId)error('human_required','Only you can change account settings or submit a report.');
 const user=principal.userId;state.emailUpdates??={};state.blocks??={};state.concerns??=[];
 if(operation==='accountSettings')return settings(state,user,available);
 if(operation==='setEmailUpdates'){
  const old=state.emailUpdates[user]||{version:0};if(p.expectedVersion!==old.version)error('conflict','Refresh your email settings before changing them.');
  if(typeof p.enabled!=='boolean'||p.enabled&&p.consent!==true)error('invalid','Choose whether to receive collaboration updates.');
  if(p.enabled&&(!available||!principal.email))error('unavailable','Email updates are not connected yet. Sign-in emails continue to work.');
  state.emailUpdates[user]={enabled:p.enabled,email:principal.email||old.email,version:old.version+1,changedAt:now};
  if(!p.enabled)for(const job of Object.values(state.emailOutbox||{}))if(job.userId===user&&job.status!=='sent')job.status='cancelled';
  return settings(state,user,available);
 }
 const c=state.contributions?.[p.contributionId];if(!c||![c.founderId,c.builderId].includes(user))error('not_found','Choose one of your collaborations.');
 const other=c.founderId===user?c.builderId:c.founderId;
 if(operation==='blockParticipant'){
  if(typeof p.blocked!=='boolean')error('invalid','Choose block or unblock.');state.blocks[user]??={};
  if(p.blocked)state.blocks[user][other]={at:now};else delete state.blocks[user][other];return settings(state,user,available);
 }
 if(operation==='reportConcern'){
  if(!['spam','harassment','privacy','misrepresentation','other'].includes(p.reason)||typeof p.details!=='string'||!p.details.trim()||p.details.length>1500)error('invalid','Choose a reason and add up to 1,500 characters.');
  if(state.concerns.filter(r=>r.reporterId===user&&r.at>now-86400000).length>=5||state.concerns.length>=1000)error('quota','Report limit reached. Contact support@getjidoka.com for help.');
  const report={id:crypto.randomUUID(),reporterId:user,contributionId:c.id,subjectId:other,reason:p.reason,details:p.details.trim(),at:now,status:'pending'};state.concerns.push(report);return {id:report.id,status:'pending',message:'Saved privately for operator review. For urgent concerns, email support@getjidoka.com. No automatic removal or email was sent.'};
 }
 error('invalid','Unsupported account control.');
}
export function enforceBlock(state,user,operation,p){
 if(!['invite','interest','message','propose','proposeCheckin'].includes(operation))return;
 const c=state.contributions?.[p.contributionId],t=state.tasks?.[p.taskId];const other=c?(c.founderId===user?c.builderId:c.founderId):operation==='invite'?p.builderId:t?.ownerId;
 if(other&&blocked(state,user,other))error('forbidden','New outreach is unavailable between these accounts. Existing delivery and closing actions remain available.');
}
export function queueUpdates(state,events,actor,now){
 state.emailOutbox??={};
 // Keep only bounded terminal history; never evict a pending delivery to make room.
 for(const [key,job] of Object.entries(state.emailOutbox))if(['sent','cancelled','expired'].includes(job.status)&&job.at<now-30*86400000)delete state.emailOutbox[key];
 for(const e of events){
  const c=state.contributions?.[e.contributionId];let recipients=c?[c.founderId,c.builderId].filter(u=>u!==actor):[];
  if(e.type==='builder_invited')recipients=Object.values(state.invitations||{}).filter(i=>i.taskId===e.taskId&&i.founderId===actor&&i.status==='pending'&&i.at===e.at).map(i=>i.builderId);
  if(e.type==='agent_task_received')recipients=[actor];
  if(!['interest_shared','terms_proposed','terms_confirmed','work_delivered','feedback_shared','credit_recorded','message_shared','collaboration_reviewed','builder_invited','checkin_proposed','checkin_confirmed','checkin_completed','agent_task_received'].includes(e.type))continue;
  for(const userId of new Set(recipients)){const pref=state.emailUpdates?.[userId];if(!pref?.enabled||blocked(state,userId,actor)||Object.keys(state.emailOutbox).length>=2000)continue;const key=e.sequence+':'+userId;state.emailOutbox[key]??={id:key,userId,preferenceVersion:pref.version,at:now,status:'pending'};}
 }
}
