(function(){
  'use strict';
  const get=id=>document.getElementById(id),search=get('projectSearch'),filter=get('projectCategory'),status=get('projectStatus'),cards=get('projectCards'),journey=window.FBTaskJourneyKit; if(!cards||!window.FBPlatform)return;
  let records=[];
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
  window.FBPlatform.fetchType('collab',(err,list,isDemo)=>{
    if(err||isDemo){status.textContent='Live collaboration data is unavailable. Demo listings are not presented as real founder tasks.';cards.replaceChildren();const box=el('div','You can still plan a starter contribution or ask a founder for a scoped task. ','pj-empty');box.append(link('Explore starter ideas →','learn-by-building.html#first-contribution'),link(' Prepare a founder task →','offer-task.html'));cards.append(box);[search,filter,get('projectScope'),get('projectTime')].forEach(e=>e.disabled=true);return;}
    const blocked=['demo','hidden','rejected','spam','blocked','archived','deleted','draft','private','pending','pending_review','pending review','unapproved','closed'];
    records=(list||[]).filter(p=>p.title&&p.isPublic!==false&&!['private','draft'].includes(String(p.visibility||'').trim().toLowerCase())&&![p.moderationStatus,p.status].some(s=>blocked.includes(String(s||'').trim().toLowerCase()))&&!String(p._id||'').startsWith('demo')).map(p=>({...p,task:journey.parseListing(p)}));render();
  });
})();
