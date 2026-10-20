const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const offers=require('../task-offer-kit.js'),journey=require('../task-journey-kit.js');
const task={title:'Review a screen',project:'Fictional project',outcome:'Make a page clearer',deliverable:'Three notes',acceptance:'Reviewed notes',outside:'No code changes',skill:'Testing',experience:'Basic web navigation',minutes:60,support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',compensation:'Paid',terms:'Agree a fee first',creditPolicy:'Agree credit and portfolio permission'};
function setup({list=[],demo=false,query=''}={}){
 const nodes={},location={search:query,href:''};let packed;class E{constructor(tag){this.tag=tag;this.textContent='';this.value='';this.children=[];this.listeners={};}append(...xs){this.children.push(...xs);}replaceChildren(){this.children=[];}addEventListener(k,f){this.listeners[k]=f;}}
 const get=id=>nodes[id]||(nodes[id]=new E('div'));vm.runInNewContext(fs.readFileSync(require.resolve('../projects.js'),'utf8'),{URLSearchParams,window:{location,FBTaskJourneyKit:journey,FBTaskOfferKit:offers,FBPlatform:{fetchType:(type,cb)=>cb(null,list,demo)}},document:{getElementById:get,createElement:tag=>new E(tag)},sessionStorage:{setItem:(k,v)=>packed=v}});return {get,location,packed:()=>packed};
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
