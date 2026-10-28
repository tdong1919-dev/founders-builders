/* Project and builder journeys use only server-authorized records. */
(function(root){
 'use strict';
 function conversationState(c,userId){
  const messages=(c.messages||[]).filter(m=>[c.founderId,c.builderId].includes(m.actorId)&&typeof m.text==='string');
  const last=messages[messages.length-1];return {messages,incoming:!['closed','cancelled'].includes(c.stage)&&Boolean(last&&last.actorId!==userId)};
 }
 function nextSteps(records,userId,mode,projectId){
  return (records.contributions||[]).filter(c=>mode==='founder'?c.founderId===userId&&(!projectId||(records.tasks||[]).some(t=>t.id===c.taskId&&t.projectId===projectId)):c.builderId===userId).flatMap(c=>{
   if(c.stage==='cancelled')return [];
   const review=c.stage==='closed'&&!(records.reviews||[]).some(r=>r.contributionId===c.id&&r.authorId===userId);
   if(c.stage==='closed'&&!review)return [];
   const replyPending=conversationState(c,userId).incoming;const waiting=!review&&c.next?.who!==userId&&!replyPending;
   const label=review?'Leave a review':replyPending&&c.next?.who!==userId?'Reply to your collaborator':waiting?({interest:'Waiting for a founder reply',terms:'Waiting for confirmation',agreed:'Waiting for the work',delivered:'Waiting for feedback',feedback:'Waiting to close the loop'}[c.stage]||'Waiting for your collaborator'):c.next?.label||'Review contribution';
   return [{taskId:c.taskId,contributionId:c.id,title:(records.tasks||[]).find(t=>t.id===c.taskId)?.title||'Contribution',label,waiting,note:c.note||'',replyPending}];
  }).sort((a,b)=>Number(a.waiting)-Number(b.waiting));
 }
 function newMatches(records,userId){return (records.matches||[]).filter(m=>!(records.contributions||[]).some(c=>c.taskId===m.taskId&&c.builderId===userId)&&!(records.invitations||[]).some(i=>i.taskId===m.taskId&&i.builderId===userId));}
 function progressSummary(records,userId,mode,projectId){
  const tasks=records.tasks||[],belongs=record=>mode==='founder'?record.founderId===userId&&(!projectId||tasks.some(t=>t.id===record.taskId&&t.projectId===projectId)):record.builderId===userId;
  const contributions=(records.contributions||[]).filter(belongs);
  return {invitations:(records.invitations||[]).filter(belongs).length,applications:contributions.length,agreed:contributions.filter(c=>c.acceptedTermsVersion!=null).length,completed:contributions.filter(c=>c.stage==='closed').length};
 }
 function projectHealth(records,userId,projectId){
  const tasks=(records.tasks||[]).filter(t=>t.ownerId===userId&&(!projectId||t.projectId===projectId)),ids=new Set(tasks.map(t=>t.id)),contributions=(records.contributions||[]).filter(c=>c.founderId===userId&&ids.has(c.taskId)),groups={attention:[],feedback:[],moving:[],waiting:[]};
  const scoped={...records,tasks,contributions};
  for(const item of nextSteps(scoped,userId,'founder',projectId)){
   const c=contributions.find(c=>c.id===item.contributionId);let group;
   if(c.stage==='delivered')group='feedback';else if(!item.waiting)group='attention';else if(c.stage==='agreed')group='moving';else group='waiting';
   groups[group].push(item);
  }
  return {groups,pausedSteps:tasks.filter(t=>t.paused),completed:contributions.filter(c=>c.stage==='closed').length};
 }
 function create({document,client,run,selectTask}){
  const $=id=>document.getElementById(id);let records=null,mode='founder',projectId=null,healthFilter=null;
  const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  function button(text,action,secondary=false){const el=node('button',text);el.type='button';el.className=secondary?'btn btn--secondary':'btn';el.addEventListener('click',()=>run(action));return el;}
  function field(parent,label,value='',type='input'){const wrap=node('label',label),el=node(type);wrap.className='shared-label';el.className='shared-input';el.value=value;el.maxLength=1500;wrap.append(el);parent.append(wrap);return el;}
  function check(parent,label,checked=false){const wrap=node('label'),el=node('input');el.type='checkbox';el.checked=checked;wrap.className='shared-check';wrap.append(el,document.createTextNode(label));parent.append(wrap);return el;}
  const tags=value=>value.split(',').map(v=>v.trim()).filter(Boolean);
  const nextLabel=c=>!c?'Find a builder':!c.next?.who?'Contribution complete':c.next.who===client.user().id?c.next.label:c.founderId===client.user().id?'Waiting for the builder':'Waiting for the founder';
  function clear(){records=null;projectId=null;healthFilter=null;for(const id of ['projectOverview','builderProfile','networkMatches','networkSuggestions'])$(id).replaceChildren();$('projectTaskGroup').replaceChildren();$('cloudTaskSection').hidden=true;}
  function render(data){
   records=data;const user=client.user();if(!user)return;const projects=data.projects||[],mine=projects.filter(p=>p.ownerId===user.id);if(!mine.some(p=>p.id===projectId))projectId=mine[0]?.id||null;
   $('networkFounder').setAttribute('aria-pressed',String(mode==='founder'));$('networkBuilder').setAttribute('aria-pressed',String(mode==='builder'));$('founderJourney').hidden=mode!=='founder';$('builderJourney').hidden=mode!=='builder';
   const group=$('projectTaskGroup');group.replaceChildren();const choose=node('select');choose.id='task_project';choose.className='shared-input';choose.setAttribute('aria-label','Project for this step');const empty=node('option','Independent contribution');empty.value='';choose.append(empty);for(const p of mine){const o=node('option',p.title);o.value=p.id;choose.append(o);}choose.value=projectId||'';group.append(choose);
   renderProjects(mine);renderProfile(data.profile);renderMatches();renderSuggestions();
  }
  function renderProjects(mine){
   const host=$('projectOverview');host.replaceChildren();
   if(mine.length){const pick=node('select');pick.className='shared-input';pick.setAttribute('aria-label','Your project');for(const p of mine){const o=node('option',p.title);o.value=p.id;pick.append(o);}pick.value=projectId;pick.addEventListener('change',()=>{projectId=pick.value;healthFilter=null;render(records);});host.append(pick);const p=mine.find(p=>p.id===projectId);host.append(node('h2',p.title),node('p',p.overview),node('p','Success looks like: '+p.outcome),node('p',p.visibility==='public'?'Overview shared with beta members':'Private project overview'));
    const edit=node('details');edit.append(node('summary','Edit project overview'));const projectTitle=field(edit,'Project name',p.title),projectOverview=field(edit,'Who this project helps and how',p.overview,'textarea'),projectOutcome=field(edit,'Next milestone',p.outcome,'textarea'),projectPublic=check(edit,'Share this overview with approved beta members',p.visibility==='public');edit.append(button('Save overview changes',()=>client.execute('saveProject',{projectId:p.id,expectedVersion:p.version,title:projectTitle.value,overview:projectOverview.value,outcome:projectOutcome.value,visibility:projectPublic.checked?'public':'private'})));host.append(edit);
    const tasks=records.tasks.filter(t=>t.projectId===p.id);host.append(node('h3','Steps toward this outcome'));if(!tasks.length)host.append(node('p','Add the first contribution needed to move this project forward.'));for(const t of tasks){const c=records.contributions.find(c=>c.taskId===t.id);host.append(button(t.title+' · '+(t.paused?'Paused for new contributors':nextLabel(c)),async()=>{selectTask(t.id);return {viewOnly:true};},true));host.append(button(t.paused?'Resume step: '+t.title:'Pause step: '+t.title,()=>client.execute('setTaskPaused',{taskId:t.id,expectedVersion:t.version,paused:!t.paused}),true));}
    host.append(button('Add a project step',async()=>{$('cloudTaskSection').hidden=false;$('cloudTaskForm').parentElement.open=true;$('task_project').value=p.id;$('task_title').focus();return {viewOnly:true};}));
   }else host.append(node('h2','Start with the project.'),node('p','Describe what you’re building, then break the next milestone into contributions people can own.'));
   const details=node('details');details.className='mission-detail';details.append(node('summary',mine.length?'Create another project':'Create your project'));if(!mine.length)details.open=true;const title=field(details,'Project name'),overview=field(details,'What are you building, and for whom?','','textarea'),outcome=field(details,'What should the next milestone achieve?','','textarea'),publish=check(details,'Share this overview with approved beta members. Keep private ideas out of a shared overview.');details.append(button('Save project overview',()=>client.execute('saveProject',{title:title.value,overview:overview.value,outcome:outcome.value,visibility:publish.checked?'public':'private'})));host.append(details);
   const legacy=records.tasks.filter(t=>t.ownerId===client.user().id&&!t.projectId);if(legacy.length){const section=node('details');section.append(node('summary','Earlier contributions'));for(const t of legacy)section.append(button(t.title,async()=>{selectTask(t.id);return {viewOnly:true};},true));host.append(section);}
  }
  function renderProfile(p){
   const host=$('builderProfile');host.replaceChildren();host.append(node('h2','What would you like to build next?'),node('p','Match your current skills and learning goals with useful project work.'));let form=host;if(p){host.append(node('p',p.name+' · '+p.skills.join(', ')+' · up to '+p.maxMinutes+' minutes'));form=node('details');form.append(node('summary','Edit skills and preferences'));host.append(form);}const name=field(form,'Your name',p?.name||''),skills=field(form,'Skills you can contribute · separate with commas',p?.skills?.join(', ')||''),goal=field(form,'What do you want to learn or gain experience in?',p?.goal||'','textarea'),minutes=field(form,'Maximum minutes for one contribution',String(p?.maxMinutes||60));minutes.type='number';minutes.min='15';minutes.max='180';const paid=check(form,'Show only paid contributions',p?.paidOnly),discover=check(form,'Let founders match my name, skills and learning goal to their project steps.',p?.discoverable);form.append(button('Save my builder profile',()=>client.execute('saveProfile',{name:name.value,skills:tags(skills.value),goal:goal.value,maxMinutes:Number(minutes.value),paidOnly:paid.checked,discoverable:discover.checked})));
  }
  function renderMatches(){
   const host=$('networkMatches');host.replaceChildren();if(mode==='founder'){renderHealth(host);const totals=node('details');totals.append(node('summary','Progress totals'));renderProgress(totals);host.append(totals);}else{renderProgress(host);renderAttention(host);}renderInvitations(host);host.append(node('h2',mode==='founder'?'Builders who fit your project steps':'Project work that fits you'),node('p','Matches use shared skills, the time limit and paid-work preference. They are suggestions, not applications.'));
   if(mode==='builder'){
    const matches=newMatches(records,client.user().id);if(!matches.length)host.append(node('p',records.profile?((records.matches||[]).length?'No new matches right now. Check your invitations and collaborations.':'No skill matches yet. Update your skills or explore published contributions below.'):'Save your profile to see skill matches.'));
    for(const m of matches){const task=records.tasks.find(t=>t.id===m.taskId);if(!task)continue;const card=node('article');card.className='network-match';const p=(records.projects||[]).find(p=>p.id===task.projectId);card.append(node('h3',task.title),node('p',p?.title||'Independent project contribution'),node('p','Why it fits: '+m.reasons.join(' · ')),button('Explore this contribution',async()=>{selectTask(task.id);return {viewOnly:true};}));host.append(card);}
    const active=records.contributions.filter(c=>c.builderId===client.user().id&&['closed','cancelled'].includes(c.stage));if(active.length){host.append(node('h3','Past collaborations'));for(const c of active){const t=records.tasks.find(t=>t.id===c.taskId);host.append(button((t?.title||'Contribution')+' · '+nextLabel(c),async()=>{selectTask(c.taskId,c.id);return {viewOnly:true};},true));}}
    const browse=node('details');browse.append(node('summary','Explore all available contributions'));for(const t of records.tasks.filter(t=>t.ownerId!==client.user().id&&!t.paused))browse.append(button(t.title,async()=>{selectTask(t.id);return {viewOnly:true};},true));host.append(browse);
   }else{
    const matches=(records.builderMatches||[]).filter(m=>records.tasks.find(t=>t.id===m.taskId)?.projectId===projectId);if(!matches.length)host.append(node('p','Add skills to a project step. Builders who opt into discovery can then appear here.'));
    for(const m of matches){const task=records.tasks.find(t=>t.id===m.taskId),card=node('article');card.className='network-match';card.append(node('h3',m.builder.name),node('p',task.title+' · '+m.sharedSkills.join(', ')),node('p',m.builder.goal));
     const contribution=records.contributions.find(c=>c.taskId===task.id&&c.builderId===m.builder.userId),invitation=(records.invitations||[]).find(i=>i.taskId===task.id&&i.builderId===m.builder.userId);
     if(contribution)card.append(button('Review their application',async()=>{selectTask(task.id,contribution.id);return {viewOnly:true};}));
     else if(invitation)card.append(node('p',invitation.status==='declined'?'Invitation declined. Give this person space to choose their next project.':invitation.status==='applied'?'Application received.':invitation.status==='withdrawn'?'Invitation withdrawn.':'Invitation sent · waiting for their response.'));
     else if(task.visibility!=='public')card.append(node('p','This step is private. Invitations are available only for published steps.'));
     else{const details=node('details');details.append(node('summary','Invite to explore this step'),node('p','Send a private note in their workspace. They choose whether to apply; terms still need their confirmation. No email is sent.'));const note=field(details,'Why would you like to work with this builder?','','textarea');note.maxLength=800;details.append(button('Send private invitation',()=>client.execute('invite',{taskId:task.id,builderId:m.builder.userId,note:note.value})));card.append(details);}host.append(card);}
   }
  }
  function renderHealth(host){
   const health=projectHealth(records,client.user().id,projectId),section=node('section');section.className='network-health';section.setAttribute('aria-label','Project health');section.append(node('h2','Your project right now'),node('p','Where each collaboration stands. Choose a group to see its next action.'));
   if(!healthFilter)healthFilter=['feedback','attention','moving','waiting'].find(key=>health.groups[key].length)||'attention';
   const labels={attention:'Needs you',feedback:'Ready for feedback',moving:'Work in progress',waiting:'Waiting on others'},summary=node('div');summary.className='health-groups';for(const [key,label] of Object.entries(labels)){const control=button(label+' · '+health.groups[key].length,async()=>{healthFilter=key;render(records);return {viewOnly:true};},true);control.setAttribute('aria-pressed',String(healthFilter===key));summary.append(control);}section.append(summary);
   const list=node('section');list.setAttribute('aria-label',labels[healthFilter]);list.append(node('h3',labels[healthFilter]));if(!health.groups[healthFilter].length)list.append(node('p','Nothing in this group right now.'));
   for(const item of health.groups[healthFilter]){const card=node('article');card.className='network-match';card.append(node('h3',item.title));if(item.replyPending)card.append(node('p','Your collaborator sent a message.'));else if(item.note)card.append(node('p','Application: '+item.note));card.append(button(item.label,async()=>{selectTask(item.taskId,item.contributionId);return {viewOnly:true};},item.waiting));list.append(card);}section.append(list);
   section.append(node('p',health.completed+' completed contribution'+(health.completed===1?'':'s')+'. Counts describe saved stages, not deadlines or a prediction of success.'));
   if(health.pausedSteps.length){const paused=node('details');paused.append(node('summary','Paused for new contributors · '+health.pausedSteps.length),node('p','Pausing stops new applications. Existing collaborators can still finish their agreed work.'));for(const task of health.pausedSteps)paused.append(button('View paused step: '+task.title,async()=>{selectTask(task.id);return {viewOnly:true};},true));section.append(paused);}host.append(section);
  }
  function renderProgress(host){
   const counts=progressSummary(records,client.user().id,mode,projectId),section=node('section');section.className='network-progress';section.setAttribute('aria-label','Collaboration progress');section.append(node('h2','Progress together'));const list=node('dl');for(const [key,label] of [['invitations',mode==='founder'?'Invitations sent':'Invitations received'],['applications','Applications'],['agreed','Agreements confirmed'],['completed','Completed contributions']]){const item=node('div');item.append(node('dt',label),node('dd',String(counts[key])));list.append(item);}section.append(list,node('p','Totals for '+(mode==='founder'&&projectId?'this project':'your account')+'. Invitations include declined or withdrawn notes; applications can arrive without an invitation.'));host.append(section);
  }
  function renderInvitations(host){
   const founder=mode==='founder',user=client.user().id,invitations=(records.invitations||[]).filter(i=>founder?i.founderId===user&&(!projectId||records.tasks.some(t=>t.id===i.taskId&&t.projectId===projectId)):i.builderId===user&&['pending','withdrawn'].includes(i.status));if(!invitations.length)return;
   const section=node('section');section.append(node('h2',founder?'Your invitations':'Invitations to explore'),node('p',founder?'Withdraw a pending invitation if your plans change. Existing applications stay in your collaborations.':'A founder sees a possible fit. Review the scope before choosing to apply. This is not an agreement to work.'));
   for(const invitation of invitations){const task=records.tasks.find(t=>t.id===invitation.taskId);if(!task)continue;const card=node('article');card.className='network-match';card.append(node('h3',task.title));
    if(invitation.status==='pending'){card.append(node('p',invitation.note));if(task.paused)card.append(node('p','This step is paused. New applications are on hold.'));if(founder)card.append(node('p','Waiting for a response.'),button('Withdraw invitation',()=>client.execute('withdrawInvitation',{invitationId:invitation.id,expectedVersion:invitation.version}),true));else{if(!task.paused)card.append(button('Review this invitation',async()=>{selectTask(task.id);return {viewOnly:true};}));card.append(button('Decline invitation',()=>client.execute('declineInvitation',{invitationId:invitation.id,expectedVersion:invitation.version}),true));}}
    else card.append(node('p',invitation.status==='withdrawn'?'Invitation withdrawn. No response is needed.':invitation.status==='declined'?'Invitation declined.':'Application received.'));section.append(card);
   }host.append(section);
  }
  function renderAttention(host){
   const items=nextSteps(records,client.user().id,mode,projectId),section=node('section');section.className='network-attention';section.append(node('h2','Needs your attention'));
   const ready=items.filter(i=>!i.waiting),waiting=items.filter(i=>i.waiting);
   if(!ready.length)section.append(node('p',waiting.length?'You’re up to date. Your collaborators have the next move.':mode==='builder'&&(records.invitations||[]).some(i=>i.builderId===client.user().id&&i.status==='pending')?'You have an invitation to explore below.':'Nothing waiting on you. Explore a match or define your next project step.'));
   function row(item){const card=node('article');card.className='network-match';card.append(node('h3',item.title));if(item.replyPending)card.append(node('p','Your collaborator sent a message.'));else if(mode==='founder'&&item.note)card.append(node('p','Application: '+item.note));card.append(button(item.label,async()=>{selectTask(item.taskId,item.contributionId);return {viewOnly:true};},item.waiting));return card;}
   for(const item of ready)section.append(row(item));
   if(waiting.length){const details=node('details');details.append(node('summary','Waiting on others · '+waiting.length));for(const item of waiting)details.append(row(item));section.append(details);}host.append(section);
  }
  function renderSuggestions(){
   const host=$('networkSuggestions');host.replaceChildren();host.append(node('h2','Orchestrator suggestions'),node('p','Based on your saved project, contribution stages and mutual feedback. These are transparent rules, not an autonomous agent run.'));const user=client.user().id,own=records.tasks.filter(t=>t.ownerId===user),notes=[];
   if(mode==='founder'&&own.some(t=>!t.skills?.length))notes.push('Add required skills to each project step so matching has a clear signal.');if(records.contributions.some(c=>c.stage==='terms'&&c.builderId===user))notes.push('A proposal is ready for your review. Confirm the exact scope before work starts.');if(records.contributions.some(c=>c.stage==='delivered'&&c.founderId===user))notes.push('Someone delivered work. Give specific feedback and recognize what moved the project forward.');const reviews=records.reviews||[];for(const r of reviews.filter(r=>r.recipientId===user).slice(-2))notes.push('Your collaborator suggested: '+r.improve);if(!notes.length)notes.push(mode==='founder'?'Make your next project step small enough to finish and clear enough to review.':'Choose work that fits your time, ask one useful question and agree on what done means.');for(const text of notes)host.append(node('p',text));
  }
  $('networkFounder').addEventListener('click',()=>{mode='founder';if(records)render(records);});$('networkBuilder').addEventListener('click',()=>{mode='builder';if(records)render(records);});
  return {render,clear};
 }
 const api={create,nextSteps,newMatches,progressSummary,conversationState,projectHealth};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBProjectWorkspace=api;
})(typeof window==='undefined'?{}:window);
