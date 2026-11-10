/* Server-rendered discovery. Reads only the existing explicitly public card API. */
export function createPublicDirectory({fetcher=fetch,origin='https://founders-builders-ux-review.hello978822.chatgpt.site',maxPages=10}={}){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function clean(c,kind){
  const opportunities=kind==='opportunities',minutes=opportunities?c?.minutes:c?.maxMinutes;
  if(!c||typeof c.id!=='string'||! /^[A-Za-z0-9_-]{1,120}$/.test(c.id)||!Number.isInteger(minutes)||minutes<15||minutes>180||!Array.isArray(c.skills)||c.skills.length>12||c.skills.some(s=>typeof s!=='string'||!s.trim()||s.length>40))throw Error('invalid');
  const title=opportunities?c.title:c.name,summary=opportunities?c.summary:c.goal;
  if(typeof title!=='string'||!title.trim()||title.length>120||typeof summary!=='string'||summary.length>400)throw Error('invalid');
  if(opportunities&&(!['paid','unpaid'].includes(c.compensation)||typeof c.taskId!=='string'||! /^[A-Za-z0-9_-]{1,120}$/.test(c.taskId)))throw Error('invalid');
  return opportunities?{id:c.id,taskId:c.taskId,title,summary,skills:c.skills,minutes,compensationType:c.compensation,compensation:c.compensation==='paid'?'Paid · agreed directly':'Voluntary / unpaid'}:{id:c.id,name:title,goal:summary,skills:c.skills,maxMinutes:minutes};
 }
 function filters(search,kind){
  const timeKey=kind==='opportunities'?'maxMinutes':'minCapacityMinutes',allowed=['skills',timeKey,'offset',...(kind==='opportunities'?['compensation']:[])];
  if([...search.keys()].some(k=>!allowed.includes(k)||search.getAll(k).length!==1))throw Error('invalid');
  const raw=search.get('skills')||'';if(raw.length>500)throw Error('invalid');
  const skills=[...new Set(raw.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean))];
  if(skills.length>12||skills.some(s=>s.length>40||/[\u0000-\u001f\u007f]/.test(s)))throw Error('invalid');
  const offset=Number(search.get('offset')||0),time=search.get(timeKey)?Number(search.get(timeKey)):null;
  if(!Number.isInteger(offset)||offset<0||offset>5000||time!==null&&(!Number.isInteger(time)||time<15||time>180))throw Error('invalid');
  const compensation=search.get('compensation')||'';if(!['','paid','unpaid'].includes(compensation))throw Error('invalid');
  return {skills,offset,time,timeKey,compensation};
 }
 function query(f,offset=f.offset){const p=new URLSearchParams();if(f.skills.length)p.set('skills',f.skills.join(', '));if(f.time!==null)p.set(f.timeKey,String(f.time));if(f.compensation)p.set('compensation',f.compensation);if(offset)p.set('offset',String(offset));return p.size?'?'+p.toString():'';}
 async function load(kind,offset,deadline,f){
  if(Date.now()>=deadline)throw Error('timeout');
  const params={kind,limit:20,offset};if(f?.skills.length)params.skills=f.skills;if(f?.time!==null&&f?.time!==undefined)params[f.timeKey]=f.time;
  const response=await fetcher('https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-collaboration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'discoverPublic',params}),redirect:'error',signal:AbortSignal.timeout(Math.max(1,Math.min(3000,deadline-Date.now())))});
  if(!response.ok)throw Error('unavailable');const {data}=await response.json();
  if(!data||!Array.isArray(data.items)||data.items.length>20||data.nextOffset!==null&&(!Number.isInteger(data.nextOffset)||data.nextOffset<=offset||data.nextOffset>5000))throw Error('invalid');
  return {items:data.items.map(c=>clean(c,kind)),nextOffset:data.nextOffset};
 }
 function fit(c,kind,f){
  if(!f.skills.length&&f.time===null&&!f.compensation)return '';
  const shared=f.skills.filter(s=>c.skills.some(value=>value.toLowerCase()===s)),timeFits=f.time===null||(kind==='opportunities'?c.minutes<=f.time:c.maxMinutes>=f.time);
  if(f.skills.length&&!shared.length||!timeFits||f.compensation&&c.compensationType!==f.compensation)return '<p class="experience-note">This card has changed and may no longer match your earlier filters. Review its current details.</p>';
  return '<p><strong>Matches your filters:</strong> '+esc([...(shared.length?['Shared skills: '+shared.join(', ')]:[]),...(f.compensation?['Compensation: '+(f.compensation==='paid'?'paid, agreed directly':'voluntary / unpaid')]:[]),...(f.time!==null?[kind==='opportunities'?c.minutes+' minutes is within your '+f.time+' minute limit':'Capacity of '+c.maxMinutes+' minutes meets your '+f.time+' minute minimum']:[])].join(' · '))+'</p><p class="experience-note">This compares public skills, time and selected compensation filters only. It does not verify ability, schedule, goals or a commitment.</p>';
 }
 function filterForm(path,kind,f){return '<form class="discovery-filters" action="/'+path+'/" method="get"><label>Skills<input name="skills" value="'+esc(f.skills.join(', '))+'" maxlength="500" placeholder="Design, research" autocomplete="off"><small>At least one skill must match. Use public skill names only.</small></label><label>'+(kind==='opportunities'?'Maximum contribution time':'Minimum builder capacity')+'<select name="'+f.timeKey+'"><option value="">Any time</option>'+[...new Set([15,30,45,60,90,120,180,...(f.time!==null?[f.time]:[])])].sort((a,b)=>a-b).map(n=>'<option value="'+n+'"'+(f.time===n?' selected':'')+'>'+n+' minutes</option>').join('')+'</select></label>'+(kind==='opportunities'?'<label>Compensation<select name="compensation"><option value="">Paid + voluntary</option><option value="paid"'+(f.compensation==='paid'?' selected':'')+'>Paid</option><option value="unpaid"'+(f.compensation==='unpaid'?' selected':'')+'>Voluntary / unpaid</option></select></label>':'')+'<button class="experience-prompt" type="submit">Find '+(kind==='opportunities'?'contributions':'builders')+'</button><a href="/'+path+'/">Clear filters</a></form>';}
 function record(c,kind,f,detail=false){const opportunities=kind==='opportunities',title=opportunities?c.title:c.name,body=opportunities?c.summary:c.goal,path=opportunities?'opportunities':'builders';return '<article class="experience-card"><h2>'+esc(title)+'</h2><p>'+esc(body)+'</p><p>Skills: '+esc(c.skills.join(', '))+'</p><p>'+esc(opportunities?c.minutes+' minutes · '+c.compensation:'Up to '+c.maxMinutes+' minutes per contribution')+'</p>'+fit(c,kind,f)+(detail?'<section class="discovery-checklist"><h3>Before you agree</h3><p>Founders &amp; Builders takes no transaction commission. Paid work and payment are agreed and arranged directly between participants; the platform does not process or guarantee payment or resolve payment disputes.</p><p>Discuss the deliverable, starting knowledge, support, schedule, compensation and ownership. Portfolio permission is a separate decision.</p><p>This owner-approved public card is an introduction, not verification, an application or an agreement. Full scope and support must be discussed in the private beta.</p><div class="experience-links"><a href="/cloud-workspace.html'+(opportunities?'#task='+encodeURIComponent(c.taskId)+'&amp;opportunity='+encodeURIComponent(c.id):'')+'">'+(opportunities?'Open this contribution in my workspace →':'Sign in to explore →')+'</a><a href="/beta-access.html">New here? Request access →</a></div></section>':'<a href="/'+path+'/'+encodeURIComponent(c.id)+esc(query(f))+'">View '+(opportunities?'contribution':'capability')+' →</a>')+'</article>';}
 function reply(request,{title,description,body,status=200,canonical,noindex=false}){
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' · Founders &amp; Builders</title><meta name="description" content="'+esc(description)+'"><meta name="robots" content="'+(noindex?'noindex,follow':'index,follow')+'"><link rel="canonical" href="'+esc(origin+canonical)+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(origin+canonical)+'"><meta property="og:image" content="'+esc(origin+'/social-card.png')+'"><link rel="stylesheet" href="/experience.css"><link rel="stylesheet" href="/platform-brand.css"><link rel="icon" type="image/svg+xml" href="/assets/brand/fb-connection-mark.svg"></head><body class="brand-cohesive"><main class="public-directory"><header><a href="/">Founders &amp; Builders</a><nav aria-label="Primary"><a href="/opportunities/">Contributions</a><a href="/builders/">Builders</a><a href="/beta-access.html">Request access / sign in</a></nav></header><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p>'+body+'<footer><nav aria-label="Help"><a href="/questions.html">Questions</a><a href="/privacy.html">Privacy</a><a href="/report-listing.html">Report a concern</a></nav></footer></main></body></html>';
  return new Response(request.method==='HEAD'?null:html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'none'; style-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...(status===503?{'Retry-After':'60'}:{})}});
 }
 return async request=>{
  const url=new URL(request.url),match=/^\/(opportunities|builders)\/(?:([A-Za-z0-9_-]{1,120}))?$/.exec(url.pathname);
  if(!match)return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const kind=match[1]==='opportunities'?'opportunities':'builders',id=match[2],base='/'+match[1]+'/';let f;
  try{f=filters(url.searchParams,kind);}catch{return new Response('Invalid filters. Use up to 12 skills and a 15–180 minute time preference.',{status:400,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
  try{
   const deadline=Date.now()+8000;let page=await load(kind,id?0:f.offset,deadline,id?null:f);
   if(id){let card=page.items.find(c=>c.id===id),pages=1;while(!card&&page.nextOffset!==null&&pages<maxPages){page=await load(kind,page.nextOffset,deadline);pages++;card=page.items.find(c=>c.id===id);}
    const back='<a href="'+base+esc(query(f))+'">← Back to your results</a>';
    if(!card){if(page.nextOffset!==null)throw Error('lookup_limit');return reply(request,{title:'This public card is unavailable.',description:'It may have been withdrawn, paused or changed by its owner.',body:back,status:404,canonical:url.pathname,noindex:true});}
    return reply(request,{title:kind==='opportunities'?card.title:card.name,description:kind==='opportunities'?card.summary:card.goal,body:back+record(card,kind,f,true),canonical:url.pathname});
   }
   if(f.compensation){let items=page.items.filter(c=>c.compensationType===f.compensation),pages=1;while(items.length<20&&page.nextOffset!==null&&pages<maxPages){page=await load(kind,page.nextOffset,deadline,f);items.push(...page.items.filter(c=>c.compensationType===f.compensation));pages++;}page={items,nextOffset:page.nextOffset};}
   const hasFilters=f.skills.length>0||f.time!==null||Boolean(f.compensation);
   const empty=hasFilters?'<p>No public cards match these filters on this page. Try fewer skills, change the time preference, or clear filters.</p>':'<p>No public cards on this page yet. You can explore a fictional example or request beta access.</p>';
   const paging=(f.offset?'<a href="'+esc(query(f,f.compensation?0:Math.max(0,f.offset-20))||base)+'">'+(f.compensation?'← First results':'← Previous page')+'</a>':'')+(page.nextOffset!==null?'<a href="'+esc(query(f,page.nextOffset))+'">Next page →</a>':'');
   return reply(request,{title:kind==='opportunities'?'Find your next contribution.':'Meet builders open to contributing.',description:'Only explicitly owner-approved public cards. Private ideas, full briefs, contact details, conversations and reviews are excluded.',body:filterForm(match[1],kind,f)+(page.items.length?page.items.map(c=>record(c,kind,f)).join(''):empty+'<a href="/quick-tour.html">View an example →</a>')+'<nav class="experience-links" aria-label="Result pages">'+paging+'</nav>',canonical:base,noindex:page.items.length===0||hasFilters||f.offset>0});
  }catch{return reply(request,{title:'Public discovery is temporarily unavailable.',description:'We could not confirm the current public cards. Please try again later.',body:'<a href="'+base+esc(query(f))+'">Try these filters again →</a> <a href="/quick-tour.html">View a fictional example →</a>',status:503,canonical:base,noindex:true});}
 };
}
