const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const kit=require('../orchestrator-kit.js'),client=require('../a2a-sandbox-client.js');
async function journey({mode='review-first',time='45',fail=false}={}){
 const {createSandbox}=await import('../sandbox/a2a-handler.mjs'),server=createSandbox({secret:'test-only-full-journey-not-hosted-key',cryptoApi:webcrypto}),nodes={},calls=[],copies=[];
 class E{constructor(){this.value='';this.checked=true;this.textContent='';this.children=[];this.listeners={};}append(e){this.children.push(e);}replaceChildren(){this.children=[];}addEventListener(k,f){this.listeners[k]=f;}focus(){this.focused=true;}}
 const get=id=>nodes[id]||(nodes[id]=new E());get('missionMode').value=mode;get('missionMinutes').value=time;get('missionMessages').value='3';
 const fetcher=async(url,options)=>{calls.push({url,options});if(fail)throw Error('Connection unavailable');return server.fetch(new Request(url,options));};
 vm.runInNewContext(fs.readFileSync(require.resolve('../orchestrator.js'),'utf8'),{window:{FBOrchestratorKit:kit,FBA2ASandboxClient:client,fetch:fetcher,location:{origin:'https://sandbox.invalid'},crypto:webcrypto,addEventListener:()=>{}},document:{getElementById:get,createElement:()=>new E()},navigator:{clipboard:{writeText:async text=>copies.push(text)}},AbortController,setTimeout,clearTimeout,Date});
 return {get,calls,copies};
}
test('real controller, builder and founder complete a reviewed journey and produce a minimized owner report',async()=>{
 const s=await journey();assert.match(s.get('missionTaskTitle').textContent,/onboarding/);assert.equal(s.calls.length,0);
 await s.get('missionStart').listeners.click();assert.equal(s.calls.length,3);assert.equal(s.get('missionDecision').hidden,false);assert.match(s.get('missionMetrics').textContent,/1 awaiting review/);assert.equal(s.get('missionTrace').children.length,3);
 await s.get('missionApprove').listeners.click();assert.equal(s.calls.length,4);assert.match(s.get('missionResult').textContent,/has not been sent/);await s.get('missionCopyReport').listeners.click();const r=JSON.parse(s.copies[0]);assert.equal(r.drafts,1);assert.equal(r.waiting,0);assert.equal(r.exchanges,3);assert.equal(r.byMode['review-first'].runs,1);assert.doesNotMatch(s.copies[0],/resumeToken|taskId|test-only|fictional builder would/i);
});
test('delegated journey completes once and time-limited journey stops with honest recovery',async()=>{
 const delegated=await journey({mode:'delegated'});await delegated.get('missionStart').listeners.click();assert.equal(delegated.calls.length,4);assert.equal(delegated.get('missionDecision').hidden,true);assert.match(delegated.get('missionMetrics').textContent,/1 drafts/);
 const bounded=await journey({time:'30'});assert.match(bounded.get('missionPlanWarnings').children.map(n=>n.textContent).join(' '),/beyond/);await bounded.get('missionStart').listeners.click();assert.equal(bounded.get('missionResult').textContent,'');assert.match(bounded.get('missionMetrics').textContent,/1 policy blocks · 0 failures/);assert.equal(bounded.get('missionRecover').textContent,'Review the task-time limit');bounded.get('missionRecover').listeners.click();assert.equal(bounded.get('missionMinutes').focused,true);assert.equal(bounded.get('missionMinutes').value,'30');assert.equal(bounded.calls.length,3);
});
test('request failures are not treated as policy stops and recovery does not resend',async()=>{
 const s=await journey({fail:true});await s.get('missionStart').listeners.click();assert.match(s.get('missionMetrics').textContent,/0 policy blocks · 1 failures/);assert.equal(s.get('missionDecision').hidden,true);assert.equal(s.get('missionStart').disabled,false);assert.equal(s.get('missionRecover').hidden,false);s.get('missionRecover').listeners.click();assert.equal(s.get('missionMode').focused,true);assert.equal(s.calls.length,1);assert.equal(s.get('missionResult').textContent,'');
});

test('journey markup contains controller and recovery targets, and task scope matches discovery',()=>{
 const html=fs.readFileSync(require.resolve('../orchestrator.html'),'utf8'),source=fs.readFileSync(require.resolve('../orchestrator.js'),'utf8'),ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 for(const match of source.matchAll(/get\('([^']+)'\)/g))assert.ok(ids.has(match[1]),'Missing controller target '+match[1]);
 for(const reason of ['scope_limit','message_limit','clarification_permission','draft_permission','network'])assert.ok(ids.has(kit.recovery(reason,kit.normalize({})).target));
 const task=require('../agent-network-kit.js').find('sample-design'),plan=kit.plan(kit.normalize({}));assert.equal(plan.title,task.title);assert.equal(plan.deliverable,task.deliverable);assert.equal(plan.minutes,task.minutes);assert.match(task.support,/three days/);
});

test('minimal dashboard follows approval, draft and protected recovery without silently acting',async()=>{
 const s=await journey();assert.equal(s.get('dashboardTitle').textContent,'Ready when you are.');
 await s.get('dashboardAction').listeners.click();assert.equal(s.calls.length,3);assert.equal(s.get('dashboardTitle').textContent,'Review the task.');assert.equal(s.get('dashboardAttention').textContent,'1');
 s.get('dashboardAction').listeners.click();assert.equal(s.get('missionApprove').focused,true);assert.equal(s.calls.length,3);
 await s.get('missionApprove').listeners.click();assert.equal(s.get('dashboardTitle').textContent,'Your draft is ready.');assert.equal(s.get('dashboardDrafts').textContent,'1');assert.equal(s.get('dashboardAttention').textContent,'0');
 s.get('dashboardAction').listeners.click();assert.equal(s.get('missionResult').focused,true);assert.equal(s.calls.length,4);
 const b=await journey({time:'30'});await b.get('dashboardAction').listeners.click();assert.equal(b.get('dashboardTitle').textContent,'A boundary protected you.');b.get('dashboardAction').listeners.click();assert.equal(b.get('missionSettingsPanel').open,true);assert.equal(b.calls.length,3);assert.equal(b.get('missionMinutes').value,'30');
 b.get('missionMinutes').value='45';b.get('missionMinutes').listeners.change();assert.equal(b.get('dashboardAction').textContent,'Start sample mission');assert.equal(b.get('dashboardRuns').textContent,'1');
 b.get('missionClear').listeners.click();assert.equal(b.get('dashboardRuns').textContent,'0');assert.equal(b.get('dashboardTitle').textContent,'Ready when you are.');
});
