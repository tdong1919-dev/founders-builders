const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const kit=require('../next-step-kit.js');
const interest={title:'Review one sample',project:'Fictional project',deliverable:'Three notes',interestName:'Alex',interestNote:'I can help test',availability:'Friday'};
const contribution=(id,status,extra={})=>({id,title:'Task '+id,deliverable:'Notes',project:'Project',status,...extra});
const review=(id,phase)=>({id,interest,review:{phase}});
test('each active contribution and founder review has one stage-appropriate action without changing records',()=>{
 const cs=['interest','agreed','in_progress','awaiting_feedback'].map((s,i)=>contribution(String(i),s,{interestName:'Alex',interestNote:'I can help',availability:'Friday'}));
 const rs=['reviewing','agreement','working','feedback'].map((s,i)=>review(String(i),s));
 const before=JSON.stringify([cs,rs]),items=kit.items(cs,rs,false);
 assert.deepEqual(items.map(i=>i.action.target),['interestSharePermission','contributionNextStep','contributionNextStep','draftFeedbackRequest','reviewReply','reviewAgreement','reviewFeedback','reviewFeedback']);
 assert.equal(items.length,8);assert.equal(JSON.stringify([cs,rs]),before);
 assert.ok(items.every(i=>i.action.button&&i.action.text&&i.action.target));
});
test('completed and closed work is optional and permissions do not transfer through the board',()=>{
 const cs=[contribution('a','completed',{result:'Actual result',creditAgreement:'May show notes',permission:false})],rs=[review('b','closed')];
 assert.equal(kit.items(cs,rs,false).length,0);const all=kit.items(cs,rs,true);assert.equal(all.length,2);assert.equal(all[0].action.target,'portfolioTerms');assert.equal(cs[0].permission,false);
});
test('read-only loading isolates malformed records and keeps valid work available',()=>{
 const raw=JSON.stringify([contribution('ok','interest'),{id:'bad',title:{}},contribution('ok','interest'),contribution('unknown','verified')]);
 const result=kit.load(raw,'contribution');assert.equal(result.records.length,1);assert.equal(result.skipped,3);assert.equal(result.records[0].id,'ok');
 assert.equal(kit.load(JSON.stringify([review('r','working')]),'review').records[0].review.phase,'working');
 for(const raw of ['bad','{}','x'.repeat(1500001)])assert.throws(()=>kit.load(raw,'contribution'));
 assert.equal(kit.load(null,'review').records.length,0);
});
test('one-time resume pointers cannot choose another tool or a removed record',()=>{
 let raw=JSON.stringify({kind:'contribution',id:'c',title:'ignored',target:'ignored'}),removed=0;
 const storage={getItem:()=>raw,removeItem:()=>{removed++;raw=null;}};
 const record=contribution('c','agreed');assert.equal(kit.consume(storage,'contribution',[record]),record);assert.equal(removed,1);
 assert.throws(()=>kit.consume(storage,'contribution',[record]),/expired/);
 raw=JSON.stringify({kind:'review',id:'c'});assert.throws(()=>kit.consume(storage,'contribution',[record]),/does not match/);
 raw=JSON.stringify({kind:'contribution',id:'gone'});assert.throws(()=>kit.consume(storage,'contribution',[record]),/removed/);
});
function board({blocked=false,sessionBlocked=false,cs=[],rs=[]}={}){
 const nodes={},events={},writes=[],reads=[];
 class E{constructor(){this.textContent='';this.children=[];this.listeners={};this.checked=false;this.attributes={};}setAttribute(k,v){this.attributes[k]=v;}append(...v){this.children.push(...v);}replaceChildren(){this.children=[];}addEventListener(k,fn){this.listeners[k]=fn;}}
 const get=id=>nodes[id]||(nodes[id]=new E());const stored={fb_contributions_v1:JSON.stringify(cs),fb_interest_reviews_v1:JSON.stringify(rs)};
 const location={href:''};
 vm.runInNewContext(fs.readFileSync(require.resolve('../my-next-step.js'),'utf8'),{window:{FBNextStepKit:kit,location,addEventListener:(k,fn)=>events[k]=fn},document:{getElementById:get,createElement:()=>new E()},
  localStorage:{getItem:key=>{reads.push(key);if(blocked)throw Error('PRIVATE storage error');return stored[key];}},
  sessionStorage:{setItem:(key,value)=>{if(sessionBlocked)throw Error();writes.push({key,value});}}});
 return {get,events,writes,reads,stored,location};
}
test('cards render saved text literally with one action, passing only an opaque local pointer',()=>{
 const s=board({cs:[contribution('c','interest',{title:'<img src=x onerror=alert(1)>',project:'PRIVATE project',interestNote:'PRIVATE note'})],rs:[review('r','working')]});
 const cards=s.get('nextStepCards').children;assert.equal(cards.length,2);
 assert.equal(cards[0].children.filter(c=>c.type==='button').length,1);assert.match(cards[0].children.at(-1).attributes['aria-label'],/<img src=x/);
 assert.equal(cards[0].children[1].textContent,'<img src=x onerror=alert(1)>');assert.equal(cards[0].children[1].children.length,0);
 cards[0].children.at(-1).listeners.click();assert.equal(s.writes.length,1);assert.equal(s.writes[0].value,'{"kind":"contribution","id":"c"}');assert.doesNotMatch(s.location.href,/PRIVATE|<img|id=/);assert.equal(s.location.href,'learn-by-building.html?next-step=1');
 cards[1].children.at(-1).listeners.click();assert.equal(s.location.href,'review-interest.html?next-step=1');
});
test('empty, finished-only, blocked storage and failed resume states remain actionable',()=>{
 const empty=board();assert.equal(empty.get('nextStepEmpty').hidden,false);assert.match(empty.get('nextStepEmptyTitle').textContent,/one small task/);assert.equal(empty.get('nextStepStartPaths').hidden,false);
 const finished=board({cs:[contribution('c','completed')]});assert.match(finished.get('nextStepEmptyTitle').textContent,/list is clear/);finished.get('includeFinishedWork').checked=true;finished.get('includeFinishedWork').listeners.change();assert.equal(finished.get('nextStepCards').children.length,1);
 const blocked=board({blocked:true});assert.match(blocked.get('nextStepWarning').textContent,/unavailable/);assert.doesNotMatch(blocked.get('nextStepWarning').textContent,/PRIVATE/);assert.equal(blocked.get('nextStepStartPaths').hidden,true);assert.match(blocked.get('nextStepEmptyTitle').textContent,/could not be fully loaded/);
 const failed=board({sessionBlocked:true,cs:[contribution('c','interest')]});failed.get('nextStepCards').children[0].children.at(-1).listeners.click();assert.equal(failed.location.href,'');assert.match(failed.get('nextStepStatus').textContent,/unchanged/);
});
test('refresh and cross-tab changes update actions without writing saved records',()=>{
 const s=board({cs:[contribution('c','interest')]});s.stored.fb_contributions_v1=JSON.stringify([contribution('c','awaiting_feedback')]);s.events.storage({key:'unrelated'});assert.equal(s.reads.length,2);
 s.events.storage({key:'fb_contributions_v1'});assert.match(s.get('nextStepCards').children[0].children.at(-1).textContent,/feedback/);assert.equal(s.writes.length,0);
 s.stored.fb_contributions_v1='[]';s.events.pageshow();assert.equal(s.get('nextStepCards').children.length,0);
});

test('first-visit choices stay hidden for existing work and return only when all records are gone',()=>{
 const s=board({cs:[contribution('c','interest')]});assert.equal(s.get('nextStepStartPaths').hidden,true);assert.equal(s.writes.length,0);
 s.stored.fb_contributions_v1='[]';s.events.pageshow();assert.equal(s.get('nextStepStartPaths').hidden,false);assert.equal(s.writes.length,0);
 const finished=board({rs:[review('r','closed')]});assert.equal(finished.get('nextStepStartPaths').hidden,true);assert.match(finished.get('nextStepEmptyTitle').textContent,/list is clear/);
});
