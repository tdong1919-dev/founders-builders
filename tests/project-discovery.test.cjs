const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const offers=require('../task-offer-kit.js'),journey=require('../task-journey-kit.js');
const task={title:'Review a screen',project:'Fictional project',outcome:'Make a page clearer',deliverable:'Three notes',acceptance:'Reviewed notes',outside:'No code changes',skill:'Testing',experience:'Basic web navigation',minutes:60,support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',compensation:'Paid',terms:'Agree a fee first',creditPolicy:'Agree credit and portfolio permission'};
function setup({list=[],demo=false,query='',deferred=false,error=null}={}){
 const nodes={},location={search:query,href:''};let packed;const requests=[];class E{constructor(tag){this.tag=tag;this.textContent='';this.value='';this.children=[];this.listeners={};}append(...xs){this.children.push(...xs);}replaceChildren(){this.children=[];}addEventListener(k,f){this.listeners[k]=f;}}
 const get=id=>nodes[id]||(nodes[id]=new E('div'));vm.runInNewContext(fs.readFileSync(require.resolve('../projects.js'),'utf8'),{URLSearchParams,window:{location,FBTaskJourneyKit:journey,FBTaskOfferKit:offers,FBPlatform:{fetchType:(type,cb)=>{requests.push(cb);if(!deferred)cb(error,list,demo);}}},document:{getElementById:get,createElement:tag=>new E(tag)},sessionStorage:{setItem:(k,v)=>packed=v}});return {get,location,requests,packed:()=>packed};
}
test('discovery shows complete public task briefs, filters time, and excludes pending and demo records',()=>{
 const row={title:task.title,description:offers.brief(task),category:'Project',email:'owner@example.com'};const s=setup({list:[row,{...row,status:'pending'},{...row,moderationStatus:'approved',status:'private'},{...row,visibility:'private'},{...row,_id:'demo1'},{title:'General collaboration',description:'Not scoped'}],query:'?scope=small'});assert.equal(s.get('projectCards').children.length,1);s.get('projectTime').value='30';s.get('projectTime').listeners.change();assert.match(s.get('projectStatus').textContent,/0 public/);
});
test('opening interest stores a scoped snapshot and navigates without submitting or contacting the owner',()=>{
 const s=setup({list:[{title:task.title,description:offers.brief(task),email:'owner@example.com'}]});const card=s.get('projectCards').children[0],button=card.children.find(e=>e.tag==='button');button.listeners.click();assert.equal(JSON.parse(s.packed()).source,'public');assert.match(s.location.href,/founder-task=1/);assert.doesNotMatch(s.packed(),/owner@example.com/);
});
test('unavailable live data never promotes demo founder tasks as real openings',()=>{
 const s=setup({list:[{title:task.title,description:offers.brief(task)}],demo:true});assert.match(s.get('projectStatus').textContent,/not presented as real/);assert.equal(s.get('projectScope').disabled,true);assert.equal(s.get('projectCards').children[0].tag,'div');
});
test('unsupported collaboration feeds explain the unavailable setup without displaying raw server errors',()=>{
 const s=setup({error:new Error('Error: Unknown type: collab / PRIVATE SERVER DETAIL'),demo:true});assert.match(s.get('projectStatus').textContent,/not connected/);assert.doesNotMatch(s.get('projectStatus').textContent,/PRIVATE|Unknown type/);assert.equal(s.get('retryProjects').disabled,false);assert.equal(s.get('projectScope').disabled,true);assert.equal(s.get('projectCards').children[0].tag,'div');
});
test('manual retries recover live discovery while retaining filters and suppressing duplicate callbacks',()=>{
 const row={title:task.title,description:offers.brief(task)};const s=setup({deferred:true,query:'?scope=small'});assert.equal(s.requests.length,1);assert.equal(s.get('retryProjects').disabled,true);s.get('retryProjects').listeners.click();assert.equal(s.requests.length,1);
 s.requests[0](new Error('Network error'),[row],true);assert.equal(s.get('projectCards').children[0].tag,'div');s.get('projectSearch').value='Testing';s.get('projectTime').value='60';s.get('retryProjects').listeners.click();assert.equal(s.requests.length,2);assert.equal(s.get('retryProjects').disabled,true);
 s.requests[0](null,[{...row,title:'STALE RESPONSE'}],false);assert.equal(s.get('projectCards').children.length,0);assert.match(s.get('projectStatus').textContent,/Checking/);
 s.requests[1](null,[row],false);assert.equal(s.get('projectScope').disabled,false);assert.equal(s.get('projectCards').children[0].tag,'article');assert.equal(s.get('projectScope').value,'small');assert.equal(s.get('projectTime').value,'60');assert.equal(s.get('projectSearch').value,'Testing');assert.equal(s.get('retryProjects').textContent,'Refresh task listings');
 s.requests[1](new Error('Late error'),[],true);assert.equal(s.get('projectCards').children[0].tag,'article');assert.equal(s.get('projectScope').disabled,false);
});
test('invalid live response data never becomes an empty successful feed and can be retried',()=>{
 const s=setup({list:{records:[]}});assert.match(s.get('projectStatus').textContent,/unavailable/);assert.equal(s.get('retryProjects').disabled,false);assert.equal(s.get('projectScope').disabled,true);
 const empty=setup({list:[]});assert.match(empty.get('projectStatus').textContent,/0 public/);assert.equal(empty.get('projectScope').disabled,false);assert.equal(empty.get('retryProjects').disabled,false);
});
