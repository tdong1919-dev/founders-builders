const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const kit=require('../orchestrator-kit.js'),clientKit=require('../a2a-sandbox-client.js'),{webcrypto}=require('node:crypto');
async function setup(policies){const {createSandbox}=await import('../sandbox/a2a-handler.mjs');const handler=createSandbox({secret:'test-only-orchestrator-signing-key-not-hosted',cryptoApi:webcrypto});const events=[],requests=[];const client=clientKit.create({origin:'https://sandbox.invalid',fetcher:async(url,opts)=>{requests.push({url,opts});return handler.fetch(new Request(url,opts));},uuid:()=>webcrypto.randomUUID(),policies,onEvent:e=>events.push(e)});return {handler,client,events,requests};}
const policy=extra=>kit.normalize(extra);
test('default settings preserve review-first and constrain numeric and boolean values',()=>{
 assert.equal(policy({}).builder.mode,'review-first');assert.equal(policy({mode:'anything',maxMessages:999,maxTaskMinutes:-10}).builder.maxMessages,3);assert.equal(policy({allowDraft:false,founderDraft:false}).founder.allowDraft,false);
});
test('server binds both policies, step counts and audit trail into the signed run',async()=>{
 const s=await setup(policy({mode:'delegated'}));await s.client.start();const result=await s.client.decide(true);assert.equal(result.phase,'prepared');assert.equal(s.events.filter(e=>e.kind==='exchange').length,3);assert.equal(s.events.at(-1).sequence,3);assert.equal(s.events.at(-1).decisionBasis,'sandbox-standing-policy');assert.match(s.events.at(-1).builder,/standing policy/);assert.doesNotMatch(JSON.stringify(s.events),/resumeToken|test-only/);
});
test('neither delegated mode nor a human decision overrides founder or builder restrictions',async()=>{
 for(const settings of [{mode:'delegated',founderDraft:false},{mode:'delegated',allowDraft:false}]){
  const s=await setup(policy(settings));await s.client.start();await assert.rejects(s.client.decide(true),e=>e.sandboxReason==='draft_permission');assert.equal(s.events.at(-1).kind,'blocked');assert.equal(s.events.at(-1).reason,'draft_permission');
 }
 for(const settings of [{founderClarification:false},{allowClarification:false},{maxMessages:1},{maxTaskMinutes:30}]){
  const s=await setup(policy(settings));await assert.rejects(s.client.start(),e=>['clarification_permission','message_limit','scope_limit'].includes(e.sandboxReason));assert.equal(s.events.at(-1).kind,'blocked');assert.equal(s.events.filter(e=>e.kind==='exchange').length,1);
 }
});
test('message budget counts human-requested drafting too and cannot be changed midway',async()=>{
 const s=await setup(policy({maxMessages:2}));await s.client.start();await assert.rejects(s.client.decide(true),e=>e.sandboxReason==='message_limit');
 const start=JSON.parse(s.requests[1].opts.body);const first=await (await s.handler.fetch(new Request(s.requests[1].url,s.requests[1].opts))).json();
 const next={...start,id:'override',params:{message:{messageId:'override-message',taskId:first.result.task.id,contextId:first.result.task.contextId,role:'ROLE_USER',parts:[{data:{action:'clarify'}}]},metadata:{resumeToken:first.result.task.metadata.resumeToken,policies:policy({maxMessages:3})}}};
 const response=await s.handler.fetch(new Request('https://sandbox.invalid/a2a/founder',{method:'POST',headers:{'content-type':'application/json','A2A-Version':'1.0'},body:JSON.stringify(next)}));assert.equal((await response.json()).error.data.sandboxReason,'policy_change');
});
test('server rejects invalid policies instead of treating them as new authority',async()=>{
 for(const policies of [false,[],{builder:{mode:'unlimited'}},{builder:{maxMessages:100}},{builder:{allowDraft:'true'}},{founder:{allowDraft:'yes'}}]){const s=await setup(policies);await assert.rejects(s.client.start(),e=>e.sandboxReason==='invalid_policy'||e.sandboxReason==='protocol_rejected');}
});
test('report uses actual session observations, strips messages/tokens and separates mode denominators',()=>{
 const a=kit.begin('PRIVATE id',policy({}),0);kit.record(a,{kind:'discovery',text:'PRIVATE'},1);kit.record(a,{kind:'exchange',action:'inquire',state:'TASK_STATE_INPUT_REQUIRED',elapsedMs:12,builder:'PRIVATE',resumeToken:'SECRET'},2);a.outcome='waiting';
 const b=kit.begin('b',policy({mode:'delegated'}),0);kit.record(b,{kind:'blocked',action:'clarify',reason:'scope_limit',token:'SECRET'},1);b.outcome='blocked';
 const c=kit.begin('c',policy({mode:'delegated'}),0);kit.record(c,{kind:'exchange',action:'approve',state:'TASK_STATE_COMPLETED',elapsedMs:8},2);c.outcome='prepared';
 const r=kit.report([a,b,c]);assert.equal(r.runs,3);assert.equal(r.waiting,1);assert.equal(r.blocked,1);assert.equal(r.drafts,1);assert.equal(r.meanMessageResponseMs,10);assert.deepEqual(r.byMode.delegated,{runs:2,drafts:1,blocked:1});assert.equal(r.friction.scope_limit,1);assert.match(r.feedback.builder.join(' '),/never expand/);assert.match(r.ownerRecommendations.join(' '),/No real collaboration/);assert.doesNotMatch(kit.exportReport([a,b,c]),/PRIVATE|SECRET|resumeToken/);
 const count=c.events.length;kit.record(c,{kind:'exchange',action:'approve'},9);assert.equal(c.events.length,count);
});
test('report has no invented averages or rankings when there is no evidence',()=>{
 const r=kit.report([]);assert.equal(r.runs,0);assert.equal(r.meanMessageResponseMs,null);assert.equal(r.drafts,0);assert.deepEqual(r.friction,{});assert.match(r.scope,/not ecosystem/);
 const run=kit.begin('x',policy({}),0);kit.record(run,{kind:'blocked',action:'unknown',reason:'SECRET arbitrary'},1);run.outcome='blocked';assert.equal(kit.report([run]).friction.protocol_rejected,1);assert.doesNotMatch(kit.exportReport([run]),/SECRET/);
});
function screen({mode='review-first',blocked=false}={}){
 const nodes={},starts=[],decisions=[],clips=[];let options;
 class E{constructor(){this.value='';this.checked=true;this.children=[];this.listeners={};this.textContent='';}addEventListener(k,f){this.listeners[k]=f;}replaceChildren(){this.children=[];}append(e){this.children.push(e);}focus(){this.focused=true;}}
 const get=id=>nodes[id]||(nodes[id]=new E());get('missionMode').value=mode;get('missionMessages').value='3';get('missionMinutes').value='45';
 const agent={create:o=>{options=o;return {start:()=>new Promise((resolve,reject)=>starts.push({resolve,reject})),decide:async value=>{decisions.push(value);if(blocked){options.onEvent({kind:'blocked',action:'approve',reason:'draft_permission'});const e=Error('Founder does not allow drafting');e.sandboxReason='draft_permission';throw e;}return {phase:value?'prepared':'declined',artifact:value?'Fictional draft':''};}};}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../orchestrator.js'),'utf8'),{window:{FBOrchestratorKit:kit,FBA2ASandboxClient:agent,fetch:()=>{},location:{origin:'https://sandbox.invalid'},crypto:webcrypto,addEventListener:()=>{}},document:{getElementById:get,createElement:()=>new E()},navigator:{clipboard:{writeText:async text=>clips.push(text)}},AbortController,setTimeout,clearTimeout,Date});
 return {get,starts,decisions,clips,emit:e=>options.onEvent(e),getPolicy:()=>options.policies};
}
test('review-first pauses and delegated mode prepares a draft only after explicit run start',async()=>{
 const review=screen(),p=review.get('missionStart').listeners.click();review.starts[0].resolve();await p;assert.equal(review.decisions.length,0);assert.equal(review.get('missionDecision').hidden,false);assert.equal(review.get('missionApprove').focused,true);
 const delegated=screen({mode:'delegated'});assert.equal(delegated.decisions.length,0);const run=delegated.get('missionStart').listeners.click();delegated.starts[0].resolve();await run;assert.deepEqual(delegated.decisions,[true]);assert.equal(delegated.get('missionDecision').hidden,true);assert.equal(delegated.get('missionResult').textContent,'Fictional draft');assert.match(delegated.get('missionMetrics').textContent,/1 drafts/);
});
test('policy changes stop a pending run and ignore late messages, while report copy is aggregate only',async()=>{
 const s=screen(),pending=s.get('missionStart').listeners.click();s.get('missionMinutes').value='30';s.get('missionMinutes').listeners.change();s.emit({kind:'exchange',action:'inquire',builder:'PRIVATE',founder:'PRIVATE',elapsedMs:1});s.starts[0].resolve();await pending;assert.equal(s.get('missionTrace').children.length,0);assert.equal(s.decisions.length,0);assert.equal(s.get('missionDecision').hidden,true);assert.match(s.get('missionStatus').textContent,/Settings changed/);
 await s.get('missionCopyReport').listeners.click();assert.equal(JSON.parse(s.clips[0]).cleared,1);assert.doesNotMatch(s.clips[0],/PRIVATE|resumeToken/);s.get('missionClear').listeners.click();assert.match(s.get('missionMetrics').textContent,/0 runs/);assert.equal(s.get('missionCopyReport').disabled,true);
});
test('server policy stops are reported as blocks and never mislabeled as prepared drafts',async()=>{
 const s=screen({mode:'delegated',blocked:true}),p=s.get('missionStart').listeners.click();s.starts[0].resolve();await p;assert.equal(s.get('missionResult').textContent,'');assert.match(s.get('missionMetrics').textContent,/0 drafts · 1 policy blocks · 0 failures/);assert.match(s.get('missionStatus').textContent,/does not allow/);assert.match(s.get('builderAdvice').textContent,/Respect/);
});

test('mission plan predicts fixed-scenario stops without changing either policy',()=>{
 const policies=policy({mode:'delegated',maxMessages:1,maxTaskMinutes:30,founderDraft:false,founderClarification:false}),before=JSON.stringify(policies),plan=kit.plan(policies);assert.equal(plan.minutes,45);assert.match(plan.summary,/No fresh decision/);assert.equal(plan.warnings.length,4);assert.equal(JSON.stringify(policies),before);assert.match(plan.limitSummary,/No real contact/);
 assert.equal(kit.plan(policy({})).warnings.length,0);assert.match(kit.plan(policy({})).summary,/pauses/);
});
test('recovery targets are allowlisted and respect which side restricts permission',()=>{
 assert.equal(kit.recovery('scope_limit',policy({})).target,'missionMinutes');assert.equal(kit.recovery('draft_permission',policy({founderDraft:false})).target,'founderDraft');assert.equal(kit.recovery('clarification_permission',policy({allowClarification:false})).target,'missionClarification');assert.equal(kit.recovery('PRIVATE arbitrary target',policy({})).target,'missionMode');
});
test('plan previews are read-only and recovery focuses settings without changing or retrying',async()=>{
 const s=screen({mode:'delegated',blocked:true});assert.match(s.get('missionPlanSummary').textContent,/No fresh decision/);assert.equal(s.starts.length,0);const run=s.get('missionStart').listeners.click();s.starts[0].resolve();await run;assert.equal(s.get('missionRecover').hidden,false);const before=JSON.stringify(s.getPolicy());s.get('missionRecover').listeners.click();assert.equal(s.get('founderDraft').focused,true);assert.equal(JSON.stringify(s.getPolicy()),before);assert.equal(s.starts.length,1);assert.equal(s.decisions.length,1);assert.match(s.get('missionStatus').textContent,/Nothing was changed/);
});
test('duplicate or post-completion decisions do not send again or turn a completed run into failure',async()=>{
 const s=screen(),run=s.get('missionStart').listeners.click();s.starts[0].resolve();await run;
 const first=s.get('missionApprove').listeners.click(),second=s.get('missionApprove').listeners.click();await Promise.all([first,second]);assert.deepEqual(s.decisions,[true]);await s.get('missionDecline').listeners.click();assert.deepEqual(s.decisions,[true]);assert.match(s.get('missionMetrics').textContent,/1 drafts · 0 policy blocks · 0 failures/);assert.equal(s.get('missionResult').textContent,'Fictional draft');
});
