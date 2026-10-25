const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const kit=require('../brief-experiment-kit.js');
async function setup({settings={},transform}={}){
 const {createSandbox}=await import('../sandbox/a2a-handler.mjs'),server=createSandbox({secret:'test-only-brief-experiment-not-hosted-key',cryptoApi:webcrypto}),calls=[];
 const options={settings,origin:'https://sandbox.invalid',uuid:()=>webcrypto.randomUUID(),fetcher:async(url,opts)=>{calls.push({url,opts});const response=await server.fetch(new Request(url,opts));return transform?transform(response,calls.length):response;}};
 return {options,calls,server};
}
test('clearer brief reaches the same review stage with one fewer observed message and identical permissions',async()=>{
 const {options,calls}=await setup(),result=await kit.compare(options);
 assert.deepEqual(result.arms.map(a=>a.outcome),['ready-for-review','ready-for-review']);assert.deepEqual(result.arms.map(a=>a.processedMessages),[2,1]);assert.deepEqual(result.arms.map(a=>a.clarifications),[1,0]);assert.equal(result.processedMessageDifference,1);assert.equal(result.clarificationDifference,1);assert.deepEqual(result.arms[0].policies,result.arms[1].policies);assert.equal(calls.length,5);
 assert.ok(calls.filter(c=>c.opts.method==='POST').every(c=>!['approve','decline'].includes(JSON.parse(c.opts.body).params.message.parts[0].data.action)));assert.doesNotMatch(JSON.stringify(result),/resumeToken|taskId|test-only|onboarding screen/);assert.equal(result.authority.introductionsPrepared,false);
});
test('one-message budget stops the incomplete brief and remains unchanged for the clearer brief',async()=>{
 const {options}=await setup({settings:{maxMessages:1}}),result=await kit.compare(options);
 assert.equal(result.arms[0].outcome,'policy-stopped');assert.equal(result.arms[0].reason,'message_limit');assert.equal(result.arms[1].outcome,'ready-for-review');assert.equal(result.arms[1].policies.builder.maxMessages,1);assert.equal(result.processedMessageDifference,null);
});
test('time restrictions stop both briefs and disabled questions are not bypassed by a clarification request',async()=>{
 const low=await setup({settings:{maxTaskMinutes:30}}),r=await kit.compare(low.options);assert.ok(r.arms.every(a=>a.outcome==='policy-stopped'&&a.reason==='scope_limit'));assert.equal(r.clarificationDifference,null);
 const noQuestions=await setup({settings:{founderClarification:false}}),q=await kit.compare(noQuestions.options);assert.equal(q.arms[0].reason,'clarification_permission');assert.equal(q.arms[1].clarifications,0);assert.equal(q.arms[1].outcome,'ready-for-review');assert.deepEqual(q.arms[0].policies,q.arms[1].policies);
});
test('a failure cannot become a successful comparison or a claim of improvement',async()=>{
 const {options}=await setup({transform:async(response,index)=>index===2?new Response('sign in'):response}),r=await kit.compare(options);
 assert.equal(r.arms[0].outcome,'request-failed');assert.equal(r.processedMessageDifference,null);assert.match(r.conclusion,/stopped or failed/);assert.equal(r.arms[0].reason,'request-failed');
});
test('comparison snapshots settings once and aborts before starting the second arm',async()=>{
 const settings={maxMessages:3},s=await setup({settings});const original=s.options.fetcher;s.options.fetcher=async(...args)=>{settings.maxMessages=1;return original(...args);};const result=await kit.compare(s.options);assert.equal(result.arms[1].policies.builder.maxMessages,3);
 const aborter=new AbortController(),a=await setup();a.options.signal=aborter.signal;a.options.onEvent=e=>{if(e.kind==='exchange')aborter.abort();};await assert.rejects(kit.compare(a.options),{name:'AbortError'});assert.ok(a.calls.length<=3);
});
test('server rejects a changed brief on continuation instead of altering the signed scenario',async()=>{
 const s=await setup();const start={jsonrpc:'2.0',id:'one',method:'SendMessage',params:{message:{messageId:'one',role:'ROLE_USER',parts:[{data:{action:'inquire'}}]}}};
 const make=b=>new Request('https://sandbox.invalid/a2a/founder',{method:'POST',headers:{'content-type':'application/json','A2A-Version':'1.0'},body:JSON.stringify(b)});
 const task=(await (await s.server.fetch(make(start))).json()).result.task;const next={jsonrpc:'2.0',id:'two',method:'SendMessage',params:{message:{messageId:'two',taskId:task.id,contextId:task.contextId,role:'ROLE_USER',parts:[{data:{action:'clarify'}}]},metadata:{resumeToken:task.metadata.resumeToken,brief:'clear'}}};assert.equal((await (await s.server.fetch(make(next))).json()).error.data.sandboxReason,'policy_change');
});
function ui(){
 const nodes={},pending=[],copies=[];let options;
 class E{constructor(){this.value='';this.checked=true;this.textContent='';this.listeners={};this.children=[];}addEventListener(k,f){this.listeners[k]=f;}replaceChildren(){this.children=[];}append(e){this.children.push(e);}}
 const get=id=>nodes[id]||(nodes[id]=new E());get('compareMessages').value='3';get('compareMinutes').value='45';
 vm.runInNewContext(fs.readFileSync(require.resolve('../brief-experiment.js'),'utf8'),{window:{FBBriefExperimentKit:{compare:o=>{options=o;return new Promise((resolve,reject)=>pending.push({resolve,reject}));}},fetch:()=>{},location:{origin:'https://sandbox.invalid'},crypto:webcrypto,addEventListener:()=>{}},document:{getElementById:get,createElement:()=>new E()},navigator:{clipboard:{writeText:async t=>copies.push(t)}},AbortController,setTimeout,clearTimeout});
 return {get,pending,copies,emit:e=>options.onEvent(e)};
}
test('comparison UI invalidates old results and late traces when settings change',async()=>{
 const s=ui(),work=s.get('compareStart').listeners.click();s.get('compareMinutes').value='30';s.get('compareMinutes').listeners.change();s.emit({kind:'exchange',brief:'clear',builder:'late',founder:'late'});s.pending[0].resolve({arms:[]});await work;assert.equal(s.get('compareTrace').children.length,0);assert.equal(s.get('compareResults').hidden,true);assert.equal(s.get('compareCopy').disabled,true);assert.match(s.get('compareStatus').textContent,/Settings changed/);
});
test('partial or aborted comparisons are not presented as finished results',async()=>{
 const s=ui(),work=s.get('compareStart').listeners.click();s.pending[0].reject(Object.assign(Error('aborted'),{name:'AbortError'}));await work;assert.equal(s.get('compareResults').hidden,true);assert.equal(s.get('compareCopy').disabled,true);assert.match(s.get('compareStatus').textContent,/No partial result/);
});
