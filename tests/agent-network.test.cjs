const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const kit=require('../agent-network-kit.js');
const input={taskId:'sample-design',name:'Alex',goal:'Practice accessible design',availability:'One hour next week',email:'PRIVATE',token:'SECRET',accepted:true};
test('agent directory is a fictional allowlist with no private or messaging capabilities',()=>{
 const dir=kit.directory();assert.deepEqual(JSON.parse(fs.readFileSync(require.resolve('../agent-tasks.json'))),dir);assert.equal(dir.tasks.length,3);assert.ok(dir.tasks.every(t=>t.fictional&&t.agentDiscoveryOptIn));assert.equal(dir.capabilities.readPrivateData,false);assert.equal(dir.capabilities.sendMessages,false);assert.equal(dir.capabilities.acceptTerms,false);
 dir.tasks[0].title='Changed';assert.notEqual(kit.directory().tasks[0].title,'Changed');assert.throws(()=>kit.find('private-project'));
});
test('skill and time filters have predictable empty and bounded matches',()=>{
 assert.equal(kit.search('',120).length,3);assert.equal(kit.search('Research',30)[0].id,'sample-research');assert.equal(kit.search('Development',30).length,0);assert.equal(kit.search('',NaN).length,0);assert.equal(kit.search('',-1).length,0);
});
test('introductions minimize fields and cannot claim sending, acceptance or verified identity',()=>{
 const before=JSON.stringify(input),packet=kit.introduction(input);assert.equal(JSON.stringify(input),before);assert.equal(packet.status,'draft-not-sent');assert.deepEqual(packet.authority,{sent:false,termsAccepted:false,portfolioPermission:false});assert.match(packet.disclosure,/unverified/);assert.doesNotMatch(JSON.stringify(packet),/PRIVATE|SECRET|email|token/);assert.equal(packet.person.chosenName,'Alex');assert.equal(kit.introduction({...input,name:'<img src=x>'}).person.chosenName,'<img src=x>');
 for(const change of [{name:''},{name:'x'.repeat(81)},{goal:'x'.repeat(601)},{availability:'x'.repeat(201)},{goal:'bad\u0000text'},{taskId:'unknown'}])assert.throws(()=>kit.introduction({...input,...change}));
 assert.throws(()=>kit.reviewed(input,false),/Review/);assert.throws(()=>kit.reviewed(input,'true'),/Review/);assert.equal(JSON.parse(kit.reviewed(input,true)).status,'draft-not-sent');
});
function screen({clipboardFail=false,defer=false}={}){
 const nodes={},writes=[];let resolveCopy;
 class E{constructor(){this.value='';this.textContent='';this.children=[];this.listeners={};this.attributes={};this.checked=false;}append(...els){this.children.push(...els);}replaceChildren(){this.children=[];}setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){this.listeners[k]=fn;}focus(){this.focused=true;}}
 const get=id=>nodes[id]||(nodes[id]=new E());get('agentTime').value='120';
 vm.runInNewContext(fs.readFileSync(require.resolve('../agent-network.js'),'utf8'),{window:{FBAgentNetworkKit:kit},document:{getElementById:get,createElement:()=>new E()},navigator:{clipboard:{writeText:raw=>{writes.push(raw);if(clipboardFail)return Promise.reject(Error('Copy unavailable'));if(defer)return new Promise(r=>resolveCopy=r);return Promise.resolve();}}}});
 function choose(){get('agentTasks').children[0].children.at(-1).listeners.click();get('agentName').value=input.name;get('agentGoal').value=input.goal;get('agentAvailability').value=input.availability;get('agentPreview').listeners.click();}
 return {get,writes,choose,resolve:()=>resolveCopy()};
}
test('task choice opens a literal introduction preview and explicit review gates copying',async()=>{
 const s=screen();assert.equal(s.get('agentTasks').children.length,3);s.choose();assert.equal(s.get('agentComposer').hidden,false);assert.equal(s.get('agentName').focused,true);assert.equal(s.get('agentCopy').disabled,true);await s.get('agentCopy').listeners.click();assert.equal(s.writes.length,0);
 s.get('agentConsent').checked=true;s.get('agentConsent').listeners.change();assert.equal(s.get('agentCopy').disabled,false);await s.get('agentCopy').listeners.click();assert.equal(s.writes.length,1);assert.equal(JSON.parse(s.writes[0]).authority.sent,false);assert.match(s.get('agentStatus').textContent,/Nothing sent/);
});
test('editing or changing tasks clears old output and review permission',async()=>{
 const s=screen();s.choose();s.get('agentConsent').checked=true;s.get('agentConsent').listeners.change();s.get('agentGoal').value='<script>PRIVATE</script>';s.get('agentGoal').listeners.input();assert.equal(s.get('agentOutput').textContent,'');assert.equal(s.get('agentConsent').checked,false);await s.get('agentCopy').listeners.click();assert.equal(s.writes.length,0);
 s.get('agentPreview').listeners.click();assert.match(s.get('agentOutput').textContent,/<script>PRIVATE<\/script>/);assert.equal(s.get('agentOutput').children.length,0);
 s.get('agentSkill').value='Research';s.get('agentSkill').listeners.change();assert.equal(s.get('agentComposer').hidden,true);assert.equal(s.get('agentOutput').textContent,'');
});
test('empty filters recover and stale clipboard completion never overwrites new guidance',async()=>{
 const s=screen({defer:true});s.get('agentSkill').value='Development';s.get('agentTime').value='30';s.get('agentTime').listeners.change();assert.equal(s.get('agentEmpty').hidden,false);s.get('agentReset').listeners.click();assert.equal(s.get('agentTasks').children.length,3);assert.equal(s.get('agentSkill').focused,true);
 s.choose();s.get('agentConsent').checked=true;s.get('agentConsent').listeners.change();const pending=s.get('agentCopy').listeners.click();s.get('agentGoal').listeners.input();s.resolve();await pending;assert.equal(s.get('agentStatus').textContent,'');assert.equal(s.get('agentCopy').disabled,true);
});
test('clipboard failure is visible without claiming a message was sent',async()=>{
 const s=screen({clipboardFail:true});s.choose();s.get('agentConsent').checked=true;s.get('agentConsent').listeners.change();await s.get('agentCopy').listeners.click();assert.match(s.get('agentStatus').textContent,/Copy unavailable/);assert.doesNotMatch(s.get('agentStatus').textContent,/Draft copied/);
});

test('only the supported fictional design task links into the complete agent journey',()=>{
 const s=screen(),cards=s.get('agentTasks').children;const links=cards.flatMap(c=>c.children.filter(e=>e.href==='orchestrator.html#mission-task'));assert.equal(links.length,1);assert.match(links[0].textContent,/Walk through/);assert.equal(s.writes.length,0);
});
