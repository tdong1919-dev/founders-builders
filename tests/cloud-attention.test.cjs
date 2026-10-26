const {test}=require('node:test'),assert=require('node:assert/strict');
const {nextSteps,newMatches,create}=require('../cloud-network.js');
const task={id:'t',title:'Review the welcome flow',ownerId:'f',projectId:'p'};
const contribution=(id,stage,who)=>({id,taskId:'t',founderId:'f',builderId:'b',stage,note:id,next:{who,label:'Review exact terms'}});
test('attention list separates the actor’s next action from their waiting state',()=>{
 const records={tasks:[task],contributions:[contribution('a','terms','b')]};
 assert.equal(nextSteps(records,'f','founder','p')[0].label,'Waiting for confirmation');
 assert.equal(nextSteps(records,'f','founder','p')[0].waiting,true);
 assert.equal(nextSteps(records,'b','builder')[0].label,'Review exact terms');
 assert.equal(nextSteps(records,'b','builder')[0].waiting,false);
 for(const [stage,who,label] of [['interest','f','Waiting for a founder reply'],['agreed','b','Waiting for the work'],['delivered','f','Waiting for feedback'],['feedback','b','Waiting to close the loop']]){
  records.contributions=[contribution('a',stage,who)];
  assert.equal(nextSteps(records,who==='b'?'f':'b',who==='b'?'founder':'builder')[0].label,label);
 }
});
test('attention is project and participant specific, actionable first, with exact application identities',()=>{
 const records={tasks:[task,{...task,id:'other',projectId:'q'}],contributions:[contribution('waiting','terms','b'),contribution('ready','interest','f'),{...contribution('elsewhere','interest','f'),taskId:'other'}]};
 assert.deepEqual(nextSteps(records,'f','founder','p').map(c=>c.contributionId),['ready','waiting']);
 assert.equal(nextSteps(records,'stranger','builder').length,0);
 assert.equal(nextSteps(records,'f','founder','q')[0].contributionId,'elsewhere');
});
test('closed work asks each participant for their own review once and excludes cancelled work',()=>{
 const records={tasks:[task],contributions:[contribution('done','closed',null),contribution('cancelled','cancelled',null)],reviews:[{contributionId:'done',authorId:'f'}]};
 assert.equal(nextSteps(records,'f','founder','p').length,0);
 assert.equal(nextSteps(records,'b','builder')[0].label,'Leave a review');
 records.reviews.push({contributionId:'done',authorId:'b'});
 assert.equal(nextSteps(records,'b','builder').length,0);
});
test('new matches exclude this builder’s existing applications across every lifecycle state',()=>{
 for(const stage of ['interest','terms','agreed','delivered','feedback','closed','cancelled']){
  const records={matches:[{taskId:'t'},{taskId:'new'}],contributions:[contribution('a',stage,'f')]};
  assert.deepEqual(newMatches(records,'b'),[{taskId:'new'}]);
  assert.equal(newMatches(records,'someone-else').length,2);
 }
});
test('rendered attention action selects the exact applicant rather than the first task conversation',async()=>{
 class Element{constructor(tag){this.tag=tag;this.children=[];this.listeners={};}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(){}addEventListener(type,fn){this.listeners[type]=fn;}}
 const elements=new Map(),document={getElementById:id=>{if(!elements.has(id))elements.set(id,new Element('div'));return elements.get(id);},createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
 let selected;
 const workspace=create({document,client:{user:()=>({id:'f'})},run:fn=>fn(),selectTask:(...args)=>selected=args});
 workspace.render({tasks:[task],projects:[{id:'p',ownerId:'f',title:'Project',overview:'Overview',outcome:'Milestone'}],contributions:[contribution('first','terms','b'),contribution('second','interest','f')],reviews:[],builderMatches:[]});
 const flatten=e=>[e,...(e.children||[]).flatMap(flatten)];
 const buttons=flatten(elements.get('networkMatches')).filter(e=>e.tag==='button');
 await buttons.find(b=>b.textContent==='Review exact terms').listeners.click();
 assert.deepEqual(selected,['t','second']);
 workspace.clear();assert.equal(elements.get('networkMatches').children.length,0);
});
