const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
async function page({failInterest=false}={}){
 const nodes={},all=[];class E{constructor(tag='div',text=''){this.tagName=tag;this.textContent=text;this.children=[];this.listeners={};this.value='';this.checked=false;all.push(this);}append(...c){this.children.push(...c);}replaceChildren(...c){this.children=[...c];}setAttribute(k,v){this[k]=v;}addEventListener(k,v){this.listeners[k]=v;}}
 const get=id=>nodes[id]||(nodes[id]=new E());const document={getElementById:get,createElement:tag=>new E(tag),createTextNode:text=>new E('text',text),querySelectorAll:selector=>all.filter(e=>e.tagName==='button'&&(selector!=='main button'||e!==nodes.navToggle))};
 get('navToggle').tagName='button';
 const originalCore=require('../collaboration-core.js');const core={...originalCore,create(options){const engine=originalCore.create(options);return {run(op,params){if(failInterest&&op==='interest'){failInterest=false;throw Error('Connection interrupted.');}return engine.run(op,params);}};}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../shared-workspace-demo.js'),'utf8'),{window:{FBSharedCollaboration:core,crypto:webcrypto,addEventListener:()=>{}},document,location:{search:'',hostname:'preview.invalid'},URL,URLSearchParams,structuredClone,Date});
 await new Promise(setImmediate);
 const tree=(e)=>[e,...e.children.flatMap(c=>typeof c==='object'?tree(c):[])];const find=label=>tree(get('sharedAction')).find(e=>e.tagName==='button'&&e.textContent===label);
 return {get,find,tree,click:async label=>{const b=find(label);assert.ok(b,'Missing '+label);await b.listeners.click();}};
}
test('actual walkthrough UI enables role switching, requires confirmation and connects the whole contribution journey',async()=>{
 const p=await page();assert.equal(p.get('viewSharedFounder').disabled,false);assert.notEqual(p.get('navToggle').disabled,true);await p.click('Share sample interest');assert.match(p.get('sharedProgress').textContent,/✓ Interest · → Agreement/);assert.match(p.get('sharedSummary').textContent,/Other person/);
 await p.get('viewSharedFounder').listeners.click();await p.click('Propose these terms');await p.get('viewSharedBuilder').listeners.click();assert.match(p.get('sharedProgress').textContent,/✓ Interest · → Agreement/);
 await p.click('Confirm sample terms');assert.match(p.get('sharedStatus').textContent,/Read and confirm/);assert.ok(p.find('Confirm sample terms'));
 p.tree(p.get('sharedAction')).find(e=>e.tagName==='input'&&e.type==='checkbox').checked=true;await p.click('Confirm sample terms');assert.match(p.get('sharedProgress').textContent,/→ Delivery/);
 await p.click('Deliver sample work');await p.get('viewSharedFounder').listeners.click();p.tree(p.get('sharedAction')).find(e=>e.tagName==='input'&&e.type==='checkbox').checked=true;await p.click('Share sample feedback');await p.get('viewSharedBuilder').listeners.click();await p.click('Record permitted credit');await p.click('Prepare permitted portfolio text');assert.match(p.get('sharedPortfolio').textContent,/three usability observations/);
 await p.get('viewSharedFounder').listeners.click();await p.click('Revoke future portfolio export');await p.get('viewSharedBuilder').listeners.click();assert.equal(p.find('Prepare permitted portfolio text'),undefined);assert.equal(p.get('sharedPortfolio').textContent,'');assert.equal(p.get('viewSharedFounder').disabled,false);
});

test('an interrupted action preserves typed notes and does not fabricate a successful save',async()=>{
 const p=await page({failInterest:true});let input=p.tree(p.get('sharedAction')).find(e=>e.tagName==='textarea');input.value='My own unsent contribution note';input.listeners.input();await p.click('Share sample interest');assert.match(p.get('sharedStatus').textContent,/Connection interrupted/);input=p.tree(p.get('sharedAction')).find(e=>e.tagName==='textarea');assert.equal(input.value,'My own unsent contribution note');await p.click('Share sample interest');assert.match(p.get('sharedSummary').textContent,/Other person/);
});
