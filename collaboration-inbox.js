/* Read-only inbox derived from existing authorized collaboration records. */
(function(root){
 'use strict';
 function inbox(records,userId,nextSteps,now=Date.now()){
  const tasks=new Map((records.tasks||[]).map(t=>[t.id,t])),contributions=new Map((records.contributions||[]).filter(c=>[c.founderId,c.builderId].includes(userId)).map(c=>[c.id,c]));
  const time=(...values)=>values.filter(n=>Number.isFinite(n)&&n>0&&n<=now).sort((a,b)=>b-a)[0]??null;
  const items=[],seen=new Set();const add=item=>{if(!tasks.has(item.taskId)||seen.has(item.key))return;seen.add(item.key);items.push({...item,title:tasks.get(item.taskId).title||'Contribution'});};
  for(const mode of ['founder','builder'])for(const step of nextSteps(records,userId,mode)){
   const c=contributions.get(step.contributionId);if(!c||['cancelled'].includes(c.stage))continue;
   const at=time(c.lastActivityAt,...(c.messages||[]).filter(m=>[c.founderId,c.builderId].includes(m.actorId)).map(m=>m.at));
   const other=c.founderId===userId?'Builder':'Founder';
   add({key:'contribution:'+c.id,kind:'contribution',taskId:c.taskId,contributionId:c.id,waiting:step.waiting===true,label:step.waiting?'View conversation':step.label,summary:step.waiting?step.label:step.replyPending?other+' sent a message.':c.stage==='closed'?'The work is complete. Your collaboration review is still due.':step.label,who:step.waiting?other+' has the next move':'Your reply or decision is next',at});
  }
  for(const invitation of records.invitations||[]){
   if(invitation.status!=='pending'||![invitation.founderId,invitation.builderId].includes(userId)||[...contributions.values()].some(c=>c.taskId===invitation.taskId&&c.builderId===invitation.builderId&&c.founderId===invitation.founderId))continue;
   const founder=invitation.founderId===userId,paused=tasks.get(invitation.taskId)?.paused;
   add({key:'invitation:'+invitation.id,kind:'invitation',taskId:invitation.taskId,invitationId:invitation.id,waiting:founder,label:founder?'View invitation':'Review invitation',summary:paused?'This step is paused for new applications.':founder?'Invitation sent. Waiting for the builder to decide.':'A founder invited you to explore this contribution.',who:founder?'Builder has the next move':'You can review or decline; no agreement is implied',at:time(invitation.updatedAt,invitation.at,invitation.createdAt)});
  }
  for(const request of records.agentTasks||[]){
   if(request.ownerId!==userId||request.status!=='TASK_STATE_INPUT_REQUIRED')continue;
   add({key:'agent:'+request.id,kind:'agent',taskId:request.taskId,requestId:request.id,waiting:false,label:'Answer your agent',summary:'Your agent needs your input before continuing.',who:'Your answer is next',at:time(request.updatedAt,request.createdAt)});
  }
  return {needs:items.filter(i=>!i.waiting).sort((a,b)=>(b.at||0)-(a.at||0)||a.key.localeCompare(b.key)),waiting:items.filter(i=>i.waiting).sort((a,b)=>(a.at===null)-(b.at===null)||(a.at||0)-(b.at||0)||a.key.localeCompare(b.key))};
 }
 function create({document,user,nextSteps,openContribution,openInvitation,openAgent}){
  const host=document.getElementById('collaborationInbox');let records=null,view='needs',ownerId=null,revision=0;
  const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  function clear(){revision++;records=null;view='needs';ownerId=null;host.replaceChildren();host.hidden=true;}
  function render(data){const owner=user();if(!owner){clear();return false;}if(ownerId!==owner.id){view='needs';ownerId=owner.id;}records=data;const ticket=++revision,who=owner.id;const model=inbox(data,owner.id,nextSteps);host.replaceChildren();host.hidden=!model.needs.length&&!model.waiting.length;if(host.hidden)return false;
   host.append(node('h2','Your collaboration inbox'),node('p','Replies and decisions from your saved collaborations. Refresh saved progress for updates. These are action states, not unread counts or read receipts.'));
   const switches=node('div');switches.className='inbox-views';switches.setAttribute('role','group');switches.setAttribute('aria-label','Collaboration inbox views');
   for(const [key,label] of [['needs','Needs you'],['waiting','Waiting on others']]){const b=node('button',label+' · '+model[key].length);b.type='button';b.className='btn btn--secondary';b.setAttribute('aria-pressed',String(view===key));b.addEventListener('click',()=>{if(user()?.id!==who||ownerId!==who||ticket!==revision)return;view=key;render(records);});switches.append(b);}host.append(switches);
   const list=node('section');list.setAttribute('aria-label',view==='needs'?'Replies and decisions needed':'Waiting on others');
   if(!model[view].length)list.append(node('p',view==='needs'?'You’re up to date. Check Waiting on others for the next move.':'Nothing is waiting on someone else right now.'));
   for(const item of model[view]){const row=node('article');row.className='inbox-item';row.append(node('h3',item.title),node('p',item.summary),node('p',item.who));if(item.at!==null){const date=new Date(item.at),stamp=node('time','Last recorded update · '+date.toLocaleString());stamp.dateTime=date.toISOString();row.append(stamp);}else row.append(node('p','Last update not recorded.'));
    const action=node('button',item.label);action.type='button';action.className='btn';action.addEventListener('click',()=>{if(user()?.id!==who||ownerId!==who||ticket!==revision||!records)return;if(item.kind==='agent')openAgent(item.taskId,item.requestId);else if(item.kind==='invitation'&&openInvitation)openInvitation(item.invitationId);else openContribution(item.taskId,item.contributionId);});row.append(action);list.append(row);
   }host.append(list);return true;
  }
  return {render,clear};
 }
 const api={inbox,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBCollaborationInbox=api;
})(typeof window==='undefined'?{}:window);
