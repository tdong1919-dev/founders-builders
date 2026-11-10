(function(){
  'use strict';
  const get=id=>document.getElementById(id),search=get('projectSearch'),filter=get('projectCategory'),status=get('projectStatus'),cards=get('projectCards'),journey=window.FBTaskJourneyKit; if(!cards||!window.FBPlatform)return;
  let records=[],loading=false,requestId=0;
  const retry=get('retryProjects'),controls=[search,filter,get('projectScope'),get('projectTime')];
  if(new URLSearchParams(window.location.search).get('scope')==='small')get('projectScope').value='small';
  function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
  function link(text,href){const a=el('a',text);a.href=href;return a;}
  function render(){
    const q=search.value.trim().toLowerCase(),cat=filter.value,small=get('projectScope').value==='small',limit=Number(get('projectTime').value);
    const shown=records.filter(p=>(!cat||String(p.category||'')===cat)&&(!q||[p.title,p.description,p.category,p.city].join(' ').toLowerCase().includes(q))&&(!small||p.task)&&(!limit||(p.task&&p.task.minutes<=limit)));
    status.textContent=shown.length+' public '+(small?'small-task':'collaboration')+' listing'+(shown.length===1?'':'s')+' · confirm availability and terms with the owner';cards.replaceChildren();
    if(!shown.length){const box=el('div','No public listings match these filters. Try another skill or more time.','pj-empty');box.append(link(' Plan a starter contribution →','learn-by-building.html#first-contribution'));cards.append(box);return;}
    shown.forEach(p=>{const card=el('article',null,'pj-card');card.append(el('span',p.task?'Small founder task':p.category||'Collaboration','pj-pill'),el('h2',p.title),el('p',p.task?p.task.outcome:String(p.description||'').slice(0,400)));
      if(p.task){const t=p.task;card.append(el('span',t.minutes+' minutes','pj-pill'),el('span',t.compensation,'pj-pill'),el('p','Practice: '+t.skill),el('p','Support: '+t.support));const details=el('details');details.append(el('summary','Read scope, feedback and credit'),el('pre',window.FBTaskOfferKit.brief(t),'contribution-output'));card.append(details);const b=el('button','Draft interest and track this task →','btn btn--secondary');b.type='button';b.addEventListener('click',()=>{try{sessionStorage.setItem('fb_task_interest_draft_v1',JSON.stringify(journey.pack(t,'public')));window.location.href='learn-by-building.html?founder-task=1#contribution-notebook';}catch(e){status.textContent='Unable to open the notebook in this tab. You can still copy the task details and plan a contribution manually.';}});card.append(b);}
      card.append(el('span',String(p.city||'Remote / unspecified'),'pj-pill'));const email=String(p.email||'').trim();card.append(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?link('Contact the owner yourself →','mailto:'+encodeURIComponent(email).replace('%40','@')+'?subject='+encodeURIComponent('Founders & Builders: '+String(p.title||'Collaboration'))):link('Explore the collaboration board →','collaborate.html'));cards.append(card);
    });
  }
  search.addEventListener('input',render);[filter,get('projectScope'),get('projectTime')].forEach(e=>e.addEventListener('change',render));
  function unavailable(err){
    const unsupported=/unknown type:\s*collab\b/i.test(String(err&&err.message||''));
    status.textContent=(unsupported?'Task discovery is not connected to the community feed yet.':'Live collaboration data is unavailable.')+' Demo listings are not presented as real founder tasks.';
    records=[];cards.replaceChildren();const box=el('div','You can still plan a starter contribution or ask a founder for a scoped task. ','pj-empty');box.append(link('Explore starter ideas →','learn-by-building.html#first-contribution'),link(' Prepare a founder task →','offer-task.html'));cards.append(box);
    controls.forEach(e=>e.disabled=true);retry.textContent='Try task listings again';
  }
  function load(){
    if(loading)return;loading=true;const id=++requestId;let settled=false;
    retry.disabled=true;retry.textContent='Checking task listings…';controls.forEach(e=>e.disabled=true);cards.replaceChildren();status.textContent='Checking live task listings…';
    function finish(err,list,isDemo){
      if(settled||id!==requestId)return;settled=true;loading=false;retry.disabled=false;
      if(err||isDemo||!Array.isArray(list)){unavailable(err);return;}
      const blocked=['demo','hidden','rejected','spam','blocked','archived','deleted','draft','private','pending','pending_review','pending review','unapproved','closed'];
      try{records=list.filter(p=>p&&typeof p==='object'&&p.title&&p.isPublic!==false&&!['private','draft'].includes(String(p.visibility||'').trim().toLowerCase())&&![p.moderationStatus,p.status].some(s=>blocked.includes(String(s||'').trim().toLowerCase()))&&!String(p._id||'').startsWith('demo')).map(p=>({...p,task:journey.parseListing(p)}));}
      catch(e){unavailable(e);return;}
      controls.forEach(e=>e.disabled=false);retry.textContent='Refresh task listings';render();
    }
    try{window.FBPlatform.fetchType('collab',finish);}catch(e){finish(e);}
  }
  retry.addEventListener('click',load);load();
})();
