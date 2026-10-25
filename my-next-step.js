(function(){
  'use strict';
  const get=id=>document.getElementById(id),kit=window.FBNextStepKit;
  let contributions=[],reviews=[],warnings=[];
  function refresh(){
    warnings=[];
    function read(key,kind){try{const result=kit.load(localStorage.getItem(key),kind);if(result.skipped)warnings.push('Some saved '+(kind==='review'?'reviews':'contributions')+' could not be read. Your saved copies were not changed.');return result.records;}catch(error){warnings.push('Saved '+(kind==='review'?'founder reviews':'contributions')+' are unavailable on this device. Your saved copies were not changed.');return [];}}
    contributions=read('fb_contributions_v1','contribution');reviews=read('fb_interest_reviews_v1','review');render();
  }
  function element(tag,text,cls){const node=document.createElement(tag);node.textContent=text;if(cls)node.className=cls;return node;}
  function render(){
    const box=get('nextStepCards');box.replaceChildren();
    const query=get('nextStepSearch').value||'',searching=!!query.trim(),visible=kit.items(contributions,reviews,get('includeFinishedWork').checked),all=kit.items(contributions,reviews,true);
    const list=kit.filterItems(visible,query),allCompleted=all.filter(item=>item.kind==='contribution'&&item.closed),completed=kit.filterItems(allCompleted,query);
    get('nextStepSearch').disabled=!all.length;get('clearNextStepSearch').hidden=!searching;
    const finishedMessage=completed.length?'Completed contributions are available in the work-and-credit section below. Include finished work above to revisit closed founder reviews too.':'Closed founder reviews stay saved in your local review desk. Include finished work above to revisit them.';
    const active=all.filter(item=>!item.closed),waiting=active.filter(item=>item.action.waiting).length;
    get('nextStepCount').textContent=list.length+' of '+visible.length+' saved '+(visible.length===1?'task':'tasks')+' shown · '+(active.length-waiting)+' ready for your attention · '+waiting+' waiting overall';
    get('nextStepWarning').textContent=warnings.join(' ');
    get('nextStepEmpty').hidden=!!list.length;
    const firstVisit=!all.length&&!warnings.length;
    get('nextStepStartPaths').hidden=!firstVisit;
    get('nextStepEmptyTitle').textContent=warnings.length?'Your saved work could not be fully loaded.':all.length?'Your active list is clear.':'Your next step starts with one small task.';
    get('nextStepEmptyText').textContent=warnings.length?'Your saved copies have not been changed. Use the notebook or founder desk links below to review readable work and recovery guidance.':all.length?finishedMessage:'Choose a place to start. Saved contributions and founder reviews will appear here on this device. No account is needed for these local tools; nothing is sent automatically.';
    if(searching&&all.length&&!list.length){
      get('nextStepEmptyTitle').textContent=completed.length&&!get('includeFinishedWork').checked?'No active tasks match this search.':'No saved tasks match this view.';
      get('nextStepEmptyText').textContent=completed.length&&!get('includeFinishedWork').checked?'Matching completed contributions are in the work-and-credit section below.':'Try another task, project, collaborator or stage, clear the search, or include finished work. Your saved records have not changed.';
    }
    for(const item of list)box.append(taskCard(item));
    const finished=get('completedWorkCards');finished.replaceChildren();
    get('completedWorkSection').hidden=!completed.length||get('includeFinishedWork').checked;
    get('completedWorkSummary').textContent=completed.length+' of '+allCompleted.length+' completed '+(allCompleted.length===1?'contribution':'contributions')+' · review work and credit';
    if(!get('includeFinishedWork').checked)for(const item of completed)finished.append(taskCard(item));
  }
  function taskCard(item){
      const card=element('article','','contribution-panel next-step-card');
      card.append(element('p',item.kind==='review'?'Founder review':'My contribution','kicker'),element('h2',item.title),element('p',item.project||'Project to discuss','next-step-context'));
      if(item.person)card.append(element('p','With '+item.person,'next-step-context'));
      card.append(element('p',item.stage+' · local record'+(item.action.waiting?' · follow up when appropriate':''),'contribution-hint'),element('h3',item.action.title),element('p',item.action.text));
      const button=element('button',item.action.button+' →','btn btn--secondary');button.type='button';button.setAttribute('aria-label',item.action.button+' for '+item.title);
      button.addEventListener('click',()=>{
        try{sessionStorage.setItem(kit.pointerKey,JSON.stringify({kind:item.kind,id:item.id}));window.location.href=(item.kind==='review'?'review-interest.html':'learn-by-building.html')+'?next-step=1';}
        catch(error){get('nextStepStatus').textContent='Unable to open that record in this tab. Open your notebook or founder review desk using the links below; your saved work is unchanged.';}
      });
      card.append(button);return card;
  }
  get('nextStepSearch').addEventListener('input',render);
  get('clearNextStepSearch').addEventListener('click',()=>{get('nextStepSearch').value='';render();get('nextStepSearch').focus();});
  get('includeFinishedWork').addEventListener('change',render);
  get('refreshNextSteps').addEventListener('click',refresh);
  window.addEventListener('storage',event=>{if(event.key===null||['fb_contributions_v1','fb_interest_reviews_v1'].includes(event.key))refresh();});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
