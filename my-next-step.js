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
    const list=kit.items(contributions,reviews,get('includeFinishedWork').checked),all=kit.items(contributions,reviews,true);
    get('nextStepCount').textContent=list.length+' saved '+(list.length===1?'task':'tasks')+' shown · '+all.filter(item=>!item.closed).length+' active';
    get('nextStepWarning').textContent=warnings.join(' ');
    get('nextStepEmpty').hidden=!!list.length;
    const firstVisit=!all.length&&!warnings.length;
    get('nextStepStartPaths').hidden=!firstVisit;
    get('nextStepEmptyTitle').textContent=warnings.length?'Your saved work could not be fully loaded.':all.length?'Your active list is clear.':'Your next step starts with one small task.';
    get('nextStepEmptyText').textContent=warnings.length?'Your saved copies have not been changed. Use the notebook or founder desk links below to review readable work and recovery guidance.':all.length?'Completed contributions and closed reviews stay in your local tools. Include finished work above if you want to revisit them.':'Choose a place to start. Saved contributions and founder reviews will appear here on this device. No account is needed for these local tools; nothing is sent automatically.';
    for(const item of list){
      const card=element('article','','contribution-panel next-step-card');
      card.append(element('p',item.kind==='review'?'Founder review':'My contribution','kicker'),element('h2',item.title),element('p',item.project||'Project to discuss','next-step-context'));
      if(item.person)card.append(element('p','With '+item.person,'next-step-context'));
      card.append(element('p',item.stage+' · local record','contribution-hint'),element('h3',item.action.title),element('p',item.action.text));
      const button=element('button',item.action.button+' →','btn btn--secondary');button.type='button';button.setAttribute('aria-label',item.action.button+' for '+item.title);
      button.addEventListener('click',()=>{
        try{sessionStorage.setItem(kit.pointerKey,JSON.stringify({kind:item.kind,id:item.id}));window.location.href=(item.kind==='review'?'review-interest.html':'learn-by-building.html')+'?next-step=1';}
        catch(error){get('nextStepStatus').textContent='Unable to open that record in this tab. Open your notebook or founder review desk using the links below; your saved work is unchanged.';}
      });
      card.append(button);box.append(card);
    }
  }
  get('includeFinishedWork').addEventListener('change',render);
  get('refreshNextSteps').addEventListener('click',refresh);
  window.addEventListener('storage',event=>{if(event.key===null||['fb_contributions_v1','fb_interest_reviews_v1'].includes(event.key))refresh();});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
