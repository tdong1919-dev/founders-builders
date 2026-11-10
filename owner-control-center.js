/* Owner control center derives attention and access from server-authorized account records. */
(function(root){
 'use strict';
 const actions={read:'Read brief and activity',interest:'Share interest',message:'Send messages',propose:'Propose terms',deliver:'Deliver agreed work',coordinate:'Ask you through A2A'};
 function summarize(records,userId,nextSteps,now=Date.now()){
  const grants=(records.grants||[]).filter(g=>g.ownerId===userId).map(g=>({...g,remaining:Math.max(0,g.maxActions-g.used),status:g.revokedAt!==null?'Revoked':g.expiresAt<=now?'Expired':g.used>=g.maxActions?'Request limit reached':'Active'}));
  const attention=[...(records.agentTasks||[]).filter(r=>r.ownerId===userId&&r.status==='TASK_STATE_INPUT_REQUIRED').map(r=>({kind:'agent',taskId:r.taskId,requestId:r.id,label:'Respond to your agent'})),...['founder','builder'].flatMap(mode=>nextSteps(records,userId,mode).filter(r=>!r.waiting).map(r=>({...r,kind:'contribution'})))];
  const ids=new Set();return {attention:attention.filter(r=>{const key=r.kind+':'+(r.requestId||r.contributionId);if(ids.has(key))return false;ids.add(key);return true;}),grants,active:grants.filter(g=>g.status==='Active')};
 }
 function missionSummary(records,userId,nextSteps,now=Date.now()){
  const grants=summarize(records,userId,nextSteps,now).grants;
  const steps=['founder','builder'].flatMap(mode=>nextSteps(records,userId,mode));
  return [...new Set(grants.map(g=>g.taskId))].flatMap(taskId=>{
   const task=(records.tasks||[]).find(t=>t.id===taskId);if(!task)return [];
   const access=grants.filter(g=>g.taskId===taskId),active=access.filter(g=>g.status==='Active');
   const work=(records.contributions||[]).filter(c=>c.taskId===taskId&&[c.founderId,c.builderId].includes(userId));
   const questions=(records.agentTasks||[]).filter(r=>r.ownerId===userId&&r.taskId===taskId);
   const question=questions.find(r=>r.status==='TASK_STATE_INPUT_REQUIRED');
   const todo=steps.filter(r=>r.taskId===taskId),human=todo.find(r=>!r.waiting),waiting=todo.find(r=>r.waiting);
   const complete=work.length>0&&work.every(c=>['closed','cancelled'].includes(c.stage));
   let status,detail,action;
   if(question){status='Needs you';detail='Your agent asked a question.';action={label:'Answer your agent',kind:'agent',requestId:question.id};}
   else if(human){status='Needs you';detail='This contribution has a next step for you.';action={label:human.label,kind:'contribution',contributionId:human.contributionId};}
   else if(waiting){status='Waiting';detail=waiting.label+'.';action={label:'View contribution',kind:'contribution',contributionId:waiting.contributionId};}
   else if(complete){status=work.some(c=>c.stage==='closed')?'Finished':'Ended';detail='No open contribution steps are recorded.';action={label:'View contribution',kind:'contribution',contributionId:work[0].id};}
   else if(!active.length){status='Access stopped';detail='Your agent needs fresh permission before it can make more requests.';action={label:'Review permissions',kind:'permissions'};}
   else{status='Ready for your agent';detail='Access is available. No current agent work is confirmed.';action={label:'View connection',kind:'permissions'};}
   const updates=[...questions.map(r=>({at:r.updatedAt||r.createdAt,label:'Agent question updated'})),...work.map(c=>({at:c.lastActivityAt,label:'Collaboration updated'}))].filter(e=>Number.isFinite(e.at)&&e.at>0&&e.at<=now).sort((a,b)=>b.at-a.at);
   const created=Math.max(...access.map(g=>g.createdAt).filter(t=>Number.isFinite(t)&&t>0&&t<=now),0);
   const latest=updates[0]||(created?{at:created,label:'Access created'}:null);
   return [{taskId,title:task.title,goal:task.brief?.deliverable||work.find(c=>c.terms?.deliverable)?.terms.deliverable||task.title,status,detail,action,access,active,latest,paused:task.paused===true,otherSteps:Math.max(0,todo.length-1)}];
  }).sort((a,b)=>Number(b.status==='Needs you')-Number(a.status==='Needs you'));
 }
 function progressMetrics(records,userId){
  const work=(records.contributions||[]).filter(c=>[c.founderId,c.builderId].includes(userId)),ids=new Set(work.map(c=>c.id));
  return {invitations:(records.invitations||[]).filter(i=>[i.founderId,i.builderId].includes(userId)).length,applications:work.length,conversations:work.filter(c=>(c.messages||[]).some(m=>[c.founderId,c.builderId].includes(m.actorId))).length,agreed:work.filter(c=>c.acceptedTermsVersion!=null).length,delivered:work.filter(c=>c.delivery).length,completed:work.filter(c=>c.stage==='closed').length,reviews:(records.reviews||[]).filter(r=>r.recipientId===userId&&ids.has(r.contributionId)).length};
 }
 function create({document,user,execute,run,nextSteps,openContribution,openAgent,learningInsights,preview=false}){
  const host=document.getElementById('ownerControlCenter');let data=null,tab='attention',ticket=0,activityTask=null;
  const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  const button=(text,action,secondary=true)=>{const el=node('button',text);el.type='button';el.className=secondary?'btn btn--secondary':'btn';el.addEventListener('click',()=>run(action));return el;};
  const title=id=>(data?.tasks||[]).find(t=>t.id===id)?.title||'Contribution';
  function clear(){ticket++;data=null;tab='attention';activityTask=null;host.replaceChildren();}
  function render(records){ticket++;data=records;host.replaceChildren();const owner=user();if(!owner)return;const model=summarize(records,owner.id,nextSteps);host.append(node('h2','Your control center'),node('p','Decide what needs you. See what your agents can do. Review what happened.'));
   const tabs=node('div');tabs.className='owner-control-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Control center views');for(const [key,label] of [['attention','Needs you · '+model.attention.length],['missions','Agent missions'],['access','Agent access · '+model.active.length],['history','What happened']]){const b=button(label,async()=>{tab=key;render(data);return {viewOnly:true};});b.setAttribute('aria-pressed',String(tab===key));tabs.append(b);}host.append(tabs);
   const panel=node('section');panel.className='owner-control-panel';panel.setAttribute('aria-label',tab==='attention'?'Needs you':tab==='missions'?'Agent missions':tab==='access'?'Agent access':'What happened');host.append(panel);
   if(tab==='attention'){if(!model.attention.length)panel.append(node('p','You’re up to date. No decisions are waiting on you.'));for(const item of model.attention){const row=node('article');row.className='network-match';row.append(node('h3',title(item.taskId)),node('p',item.kind==='agent'?'Your agent has a question.':'A collaboration has a next step for you.'),button(item.label,async()=>{if(item.kind==='agent')openAgent(item.taskId,item.requestId);else openContribution(item.taskId,item.contributionId);return {viewOnly:true};},false));panel.append(row);}return;}
   if(tab==='missions'){
    panel.append(node('h3','Your agent missions'),node('p','One contribution. One next step. Refresh saved progress for updates. These are recorded steps, not a live agent monitor.'));
    const missions=missionSummary(data,owner.id,nextSteps);if(!missions.length)panel.append(node('p','No agent missions yet. Choose a contribution to connect your agent.'),button('Connect my agent',async()=>{openAgent();return {viewOnly:true};},false));
    for(const mission of missions){const row=node('article');row.className='network-match agent-mission';row.append(node('h4',mission.title),node('p',mission.status),node('p','Goal: '+(mission.goal.length>240?mission.goal.slice(0,237)+'…':mission.goal)),node('p',mission.detail));
     if(mission.latest){const stamp=node('time',mission.latest.label+' · '+new Date(mission.latest.at).toLocaleString());stamp.dateTime=new Date(mission.latest.at).toISOString();row.append(stamp);}else row.append(node('p','No dated activity recorded yet.'));
     if(mission.paused)row.append(node('p','New applications are paused. Existing work and agent permissions are unchanged.'));
     if(mission.otherSteps)row.append(node('p',mission.otherSteps+' more contribution steps appear in Needs you or your project.'));
     row.append(button(mission.action.label,async()=>{const a=mission.action;if(a.kind==='contribution')openContribution(mission.taskId,a.contributionId);else openAgent(mission.taskId,a.requestId);return {viewOnly:true};},false));
     const controls=node('details');controls.append(node('summary','Permissions and controls'));
     for(const grant of mission.access){const block=node('section');block.append(node('p',grant.status+' · '+grant.actions.map(a=>actions[a]||a).join(', ')),node('p',grant.remaining+' of '+grant.maxActions+' requests remaining · '+grant.maxTaskMinutes+' minute task limit'),node('p','Expires: '+new Date(grant.expiresAt).toLocaleString()));if(grant.status==='Active')block.append(button('Stop this access',()=>execute('revoke',{grantId:grant.id})));controls.append(block);}
     controls.append(node('p','Stopping access blocks future requests. It cannot recall information already read.'),button('Review new access',async()=>{openAgent(mission.taskId);return {viewOnly:true};}));row.append(controls);panel.append(row);
    }return;
   }
   if(tab==='access'){panel.append(node('p','Permissions are scoped to one contribution. Revoking stops future requests; completed actions stay in history.'));
    if(!model.active.length)panel.append(node('p','No active agent access.'));
    function grantRow(g,target){const row=node('article');row.className='network-match';row.append(node('h3',title(g.taskId)),node('p',g.status+' · '+(g.actions.every(a=>a==='read')?'Read only':'Can take permitted actions')),node('p','Allowed: '+g.actions.map(a=>actions[a]||a).join(', ')),node('p',g.remaining+' of '+g.maxActions+' requests remaining · '+g.maxTaskMinutes+' minute task limit'),node('p','Expires: '+new Date(g.expiresAt).toLocaleString()));if(g.status==='Active')row.append(button('Revoke access',()=>execute('revoke',{grantId:g.id})));target.append(row);}
    for(const g of model.active)grantRow(g,panel);const inactive=model.grants.filter(g=>g.status!=='Active');if(inactive.length){const past=node('details');past.append(node('summary','Past connections · '+inactive.length));for(const g of inactive)grantRow(g,past);panel.append(past);}panel.append(button('Manage task permissions',async()=>{openAgent();return {viewOnly:true};}));return;
   }
   const metrics=progressMetrics(data,owner.id),numbers=node('section');numbers.setAttribute('aria-label','Your recorded progress');numbers.append(node('h3','Your recorded progress'));for(const [key,label] of [['invitations','Invitations'],['applications','Applications'],['conversations','Conversations'],['agreed','Agreements confirmed'],['delivered','Work delivered'],['completed','Completed contributions'],['reviews','Reviews received']])numbers.append(node('p',label+' · '+metrics[key]));numbers.append(node('p','Account records only. These totals overlap; they are not a sequential conversion rate. No private text is sent to analytics.'));panel.append(numbers);
   const learning=learningInsights?.(data,owner.id);if(learning&&(learning.active||learning.completed||learning.receivedReviews))panel.append(node('h3','Learning from your work'),node('p',learning.completed+' completed contributions · '+learning.inactiveHandoffs+' handoffs with no recorded update for 7+ days.'),button('Review evidence and suggestions',async()=>{document.getElementById('networkSuggestions')?.scrollIntoView?.({behavior:'smooth',block:'start'});return {viewOnly:true};}));
   panel.append(node('p','Load activity for one contribution and your account’s recent blocked attempts. Refresh saved progress to update access and attention.'));
   const allowed=(data.tasks||[]).filter(t=>t.ownerId===owner.id||(data.contributions||[]).some(c=>c.taskId===t.id&&[c.founderId,c.builderId].includes(owner.id)));if(!allowed.some(t=>t.id===activityTask))activityTask=allowed[0]?.id||null;
   if(allowed.length){const select=node('select');select.className='shared-input';select.setAttribute('aria-label','Contribution activity');for(const t of allowed){const o=node('option',t.title);o.value=t.id;select.append(o);}select.value=activityTask;select.addEventListener('change',()=>{activityTask=select.value;results.replaceChildren();});panel.append(select);}
   const results=node('div');results.setAttribute('aria-live','polite');const load=button('Load recent activity',async()=>{const requestTicket=ticket,who=owner.id,scope=activityTask;const loaded=await Promise.allSettled([scope?execute('activity',{taskId:scope}):Promise.resolve([]),preview?Promise.resolve([]):execute('agentAudit')]);if(ticket!==requestTicket||user()?.id!==who||activityTask!==scope)return {viewOnly:true};results.replaceChildren();
    if(loaded[0].status==='fulfilled'){const events=loaded[0].value.filter(e=>e.taskId===scope).slice(-20).reverse();results.append(node('h3',scope?'Activity · '+title(scope):'Contribution activity'));if(!events.length)results.append(node('p','No recorded activity for this contribution.'));for(const event of events){const who=event.actorId===owner.id?(event.grantId?'Your agent':'You'):(event.grantId?'Collaborator’s agent':'Your collaborator'),row=node('p',who+' · '+event.type.replaceAll('_',' '));const at=new Date(event.at);if(Number.isFinite(at.getTime()))row.append(node('time',' · '+at.toLocaleString()));results.append(row);}}else results.append(node('p','Contribution activity could not be loaded. Try again after refreshing.'));
    results.append(node('h3','Recent blocked attempts · your account'));if(loaded[1].status==='fulfilled'){const blocked=loaded[1].value.slice(-10).reverse();if(!blocked.length)results.append(node('p',preview?'The fictional preview has no security audit.':'No blocked attempts in the recent account audit.'));for(const event of blocked){const labels={permission_denied:'Outside permission, limit or expiry',conflict:'Record changed before the action',human_required:'A person must make this decision',forbidden:'Action not allowed',not_found:'Record unavailable',invalid:'Details need correction',invalid_stage:'This step is not available now'};const row=node('p',(event.grantId?'Agent attempt':'Account attempt')+' · '+(labels[event.reason]||'Request was blocked'));const date=new Date(event.at);if(Number.isFinite(date.getTime()))row.append(node('time',' · '+date.toLocaleString()));results.append(row);}}else results.append(node('p','The account audit could not be loaded. Try again after refreshing.'));return {viewOnly:true};});panel.append(load,results);
  }
  return {render,clear};
 }
 const api={create,summarize,missionSummary,progressMetrics};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBOwnerControl=api;
})(typeof window==='undefined'?{}:window);
