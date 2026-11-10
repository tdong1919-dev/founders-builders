const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
const core=require('../collaboration-core.js');
const brief={deliverable:'Three onboarding observations',acceptance:'Three clear observations on the sample screen',outside:'No production code or private access',minutes:45,support:'15 minute founder check-in',compensation:'unpaid',compensationDetails:'Voluntary sample task, no payment promised',ownership:'Contributor retains original notes; founder can use agreed feedback',feedbackTiming:'Within three days',credit:'Only the exact agreed public credit may be exported'};
async function setup(){const {openStore,createSharedService}=await import('../server/shared-service.mjs');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fb-shared-')),file=path.join(dir,'private.sqlite');let store=openStore(file),now=Date.now();const sessions={test_founder_verified_session:'founder',test_builder_verified_session:'builder',test_other_verified_session:'other'};
 const service=()=>createSharedService({store,origin:'https://private.invalid',now:()=>now,verifySession:async token=>sessions[token]?{id:sessions[token],emailVerified:true}:null});let handler=service();
 async function call(who,operation,params={},key=randomUUID()){const token=sessions[who]?who:who==='founder'?'test_founder_verified_session':who==='builder'?'test_builder_verified_session':who==='other'?'test_other_verified_session':who;const r=await handler.fetch(new Request('https://private.invalid/api/collaboration',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,'Idempotency-Key':key},body:JSON.stringify({operation,params})}));return {status:r.status,...await r.json()};}
 return {call,store:()=>store,reopen(){store.close();store=openStore(file);handler=service();},advance(ms){now+=ms;},close(){store.close();fs.rmSync(dir,{recursive:true,force:true});}};
}
test('persistent two-account journey binds exact terms and limits portfolio output, including after restart and revocation',async t=>{
 const s=await setup();t.after(()=>s.close());const task=(await s.call('founder','createTask',{title:'Private founder idea',brief,visibility:'public'})).data;
 const c=(await s.call('builder','interest',{taskId:task.id,note:'I can review this screen and practice testing.'})).data;assert.equal(c.stage,'interest');
 assert.equal((await s.call('other','activity',{taskId:task.id})).status,404);
 let proposal=(await s.call('founder','propose',{contributionId:c.id,expectedVersion:1,terms:brief})).data;
 assert.equal((await s.call('founder','accept',{contributionId:c.id,expectedVersion:2,termsVersion:1})).status,403);
 assert.equal((await s.call('builder','accept',{contributionId:c.id,expectedVersion:1,termsVersion:1})).status,409);
 s.reopen();assert.equal((await s.call('builder','list')).data.contributions[0].stage,'terms');
 let agreed=(await s.call('builder','accept',{contributionId:c.id,expectedVersion:proposal.version,termsVersion:1})).data;
 // A founder amendment invalidates prior acceptance, instead of silently changing the commitment.
 proposal=(await s.call('founder','propose',{contributionId:c.id,expectedVersion:agreed.version,terms:{...brief,minutes:60}})).data;
 assert.equal(proposal.acceptedTermsVersion,null);assert.equal((await s.call('builder','deliver',{contributionId:c.id,expectedVersion:proposal.version,notes:'Work'})).status,403);
 agreed=(await s.call('builder','accept',{contributionId:c.id,expectedVersion:proposal.version,termsVersion:2})).data;
 const key=randomUUID(),delivery={contributionId:c.id,expectedVersion:agreed.version,notes:'Found three confusing controls',evidence:'https://example.com/sample'};
 const [one,two]=await Promise.all([s.call('builder','deliver',delivery,key),s.call('builder','deliver',delivery,key)]);assert.equal(one.data.version,two.data.version);
 assert.equal((await s.call('builder','deliver',{...delivery,notes:'Different'},key)).status,409);
 const f=(await s.call('founder','feedback',{contributionId:c.id,expectedVersion:one.data.version,notes:'Useful and clear',creditText:'Reviewed a sample onboarding screen; three usability observations.',allowPortfolio:true})).data;
 const credit=(await s.call('builder','recordCredit',{contributionId:c.id,expectedVersion:f.version})).data;assert.equal(credit.stage,'closed');
 const exportKey=randomUUID(),exported=await s.call('builder','exportCredit',{contributionId:c.id},exportKey);assert.equal(exported.status,200);assert.doesNotMatch(JSON.stringify(exported),/Private founder idea|Useful and clear|example.com/);
 await s.call('founder','revokePortfolio',{contributionId:c.id});assert.equal((await s.call('builder','exportCredit',{contributionId:c.id},exportKey)).status,403);
 const logs=(await s.call('builder','activity',{taskId:task.id})).data;assert.equal(logs.filter(e=>e.type==='work_delivered').length,1);assert.equal(logs.filter(e=>e.type==='terms_proposed').length,2);assert.equal(logs.find(e=>e.type==='terms_proposed').details.minutes,45);
 s.reopen();assert.equal((await s.call('builder','exportCredit',{contributionId:c.id})).status,403);assert.ok(s.store().db.prepare('SELECT count(*) AS n FROM ledger').get().n>=9);
});
test('agent ownership, scope, budget, expiry and durable revocation are enforced on every request and replay',async t=>{
 const s=await setup();t.after(()=>s.close());const task=(await s.call('founder','createTask',{title:'Sample screen',brief,visibility:'public'})).data;
 const issued=await s.call('builder','grant',{taskId:task.id,actions:['read','interest'],maxActions:2,maxTaskMinutes:45,expiresInMinutes:5});assert.equal(issued.status,200);assert.ok(issued.agentToken.startsWith('fb_agent_'));
 assert.doesNotMatch(JSON.stringify(s.store().db.prepare('SELECT body FROM state').get()),/fb_agent_/);assert.doesNotMatch(JSON.stringify((await s.call('builder','list')).data),/fb_agent_/);
 assert.equal((await s.call('other','revoke',{grantId:issued.data.id})).status,404);
 const replayKey=randomUUID();const interest=await s.call(issued.agentToken,'interest',{taskId:task.id,note:'A sample interest note'},replayKey);assert.equal(interest.status,200);
 assert.equal((await s.call(issued.agentToken,'accept',{contributionId:interest.data.id,expectedVersion:1,termsVersion:1})).status,403);
 await s.call(issued.agentToken,'readTask',{taskId:task.id});assert.equal((await s.call(issued.agentToken,'readTask',{taskId:task.id})).status,403);
 await s.call('builder','revoke',{grantId:issued.data.id});s.reopen();assert.equal((await s.call(issued.agentToken,'interest',{taskId:task.id,note:'A sample interest note'},replayKey)).status,403);
 const exp=await s.call('builder','grant',{taskId:task.id,actions:['read'],maxActions:3,maxTaskMinutes:45,expiresInMinutes:1});s.advance(60001);assert.equal((await s.call(exp.agentToken,'readTask',{taskId:task.id})).status,403);
 const limited=await s.call('builder','grant',{taskId:task.id,actions:['read'],maxActions:3,maxTaskMinutes:30,expiresInMinutes:1});assert.equal((await s.call(limited.agentToken,'readTask',{taskId:task.id})).status,403);
 assert.equal((await s.call('builder','grant',{taskId:task.id,actions:['accept'],maxActions:3,maxTaskMinutes:45,expiresInMinutes:1})).status,400);
});
test('unauthenticated and forged identities cannot read private data; transport has no credential-storage fallback',async t=>{
 const s=await setup();t.after(()=>s.close());const privateTask=(await s.call('founder','createTask',{title:'Secret',brief})).data;
 assert.equal((await s.call('other','readTask',{taskId:privateTask.id,ownerId:'founder',verified:true})).status,404);assert.equal((await s.call('bad_token_12345678','list')).status,401);assert.deepEqual((await s.call('other','list')).data.tasks,[]);
 const {supabaseSessionVerifier}=await import('../server/shared-service.mjs');let url;
 const verify=supabaseSessionVerifier({url:'https://sample.supabase.co',publishableKey:'sb_publishable_test_only',fetcher:async u=>{url=u;return new Response(JSON.stringify({id:'verified-user',email_confirmed_at:'2026-01-01'}));}});assert.equal((await verify('token')).id,'verified-user');assert.equal(url,'https://sample.supabase.co/auth/v1/user');
 const unverified=supabaseSessionVerifier({url:'https://sample.supabase.co',publishableKey:'sb_publishable_test_only',fetcher:async()=>new Response(JSON.stringify({id:'forged'}))});assert.equal(await unverified('token'),null);
});
test('shared client stops late token resolution and does not send after sign-out',async()=>{
 const {create}=require('../shared-collaboration-client.js');let release,calls=0;const c=create({fetcher:async()=>{calls++;},token:()=>new Promise(r=>release=r),uuid:randomUUID});const p=c.execute('list',{});c.close();release('test_verified_token_1234');await assert.rejects(p,/Session changed/);assert.equal(calls,0);
});

test('two independent HTTP clients share persisted progress and stale writes fail without overwriting',async t=>{
 const http=require('node:http'),s=await setup();t.after(()=>s.close());
 const server=http.createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;const headers={...req.headers};const token=headers.authorization?.replace('Bearer ','');let input;try{input=JSON.parse(raw);}catch{res.writeHead(400);return res.end();}const result=await s.call(token,input.operation,input.params,headers['idempotency-key']);res.writeHead(result.status,{'Content-Type':'application/json'});res.end(JSON.stringify(result));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const endpoint='http://127.0.0.1:'+server.address().port;
 const {create}=require('../shared-collaboration-client.js');const founder=create({fetcher:(_,o)=>fetch(endpoint,o),token:async()=> 'test_founder_verified_session',uuid:randomUUID}),builder=create({fetcher:(_,o)=>fetch(endpoint,o),token:async()=> 'test_builder_verified_session',uuid:randomUUID});t.after(()=>{founder.close();builder.close();});
 const task=(await founder.execute('createTask',{title:'HTTP collaboration',brief,visibility:'public'})).data;
 const interest=(await builder.execute('interest',{taskId:task.id,note:'Independent contributor client'})).data;
 assert.equal((await founder.execute('list')).data.contributions[0].id,interest.id);
 const proposed=(await founder.execute('propose',{contributionId:interest.id,expectedVersion:1,terms:brief})).data;
 s.reopen();assert.equal((await builder.execute('list')).data.contributions[0].terms.version,1);
 await assert.rejects(builder.execute('accept',{contributionId:interest.id,expectedVersion:1,termsVersion:1}),e=>e.code==='conflict');
 await builder.execute('accept',{contributionId:interest.id,expectedVersion:proposed.version,termsVersion:1});assert.equal((await founder.execute('list')).data.contributions[0].stage,'agreed');
});
test('withheld portfolio permission allows private completion; later explicit permission can be granted and revoked',async t=>{
 const s=await setup();t.after(()=>s.close());const task=(await s.call('founder','createTask',{title:'Private completion sample',brief,visibility:'public'})).data;let c=(await s.call('builder','interest',{taskId:task.id,note:'Sample'})).data;
 for(const [who,op,extra] of [['founder','propose',{terms:brief}],['builder','accept',{termsVersion:1}],['builder','deliver',{notes:'Done'}],['founder','feedback',{notes:'Helpful',creditText:'Sample testing contribution',allowPortfolio:false}],['builder','closePrivate',{}]]){const result=await s.call(who,op,{contributionId:c.id,expectedVersion:c.version,...extra});assert.equal(result.status,200);c=result.data;}
 assert.equal(c.stage,'closed');assert.equal((await s.call('builder','exportCredit',{contributionId:c.id})).status,403);
 assert.equal((await s.call('builder','allowPortfolio',{contributionId:c.id,expectedVersion:c.version,confirm:true})).status,403);
 c=(await s.call('founder','allowPortfolio',{contributionId:c.id,expectedVersion:c.version,confirm:true})).data;
 c=(await s.call('builder','recordCredit',{contributionId:c.id,expectedVersion:c.version})).data;assert.equal((await s.call('builder','exportCredit',{contributionId:c.id})).status,200);
 await s.call('founder','revokePortfolio',{contributionId:c.id});assert.equal((await s.call('builder','exportCredit',{contributionId:c.id})).status,403);
});

test('clarifying messages stay participant-private and closing cannot claim completion or credit',async t=>{
 const s=await setup();t.after(()=>s.close());const task=(await s.call('founder','createTask',{title:'Clarify scope',brief,visibility:'public'})).data;let c=(await s.call('builder','interest',{taskId:task.id,note:'Interested'})).data;
 c=(await s.call('founder','message',{contributionId:c.id,expectedVersion:c.version,text:'Which screen would you prefer?'})).data;assert.equal(c.stage,'interest');assert.equal(c.messages[0].actorId,'founder');
 assert.equal((await s.call('other','message',{contributionId:c.id,expectedVersion:c.version,text:'Forged reply'})).status,404);
 c=(await s.call('builder','close',{contributionId:c.id,expectedVersion:c.version,reason:'The scope is not a fit right now.'})).data;assert.equal(c.stage,'cancelled');assert.equal(c.next.label,'Closed without completion');
 assert.equal((await s.call('builder','recordCredit',{contributionId:c.id,expectedVersion:c.version})).status,403);assert.equal((await s.call('builder','exportCredit',{contributionId:c.id})).status,403);
});

test('task scope, denial audit and grant retries cannot leak credentials or broaden authority',async t=>{
 const s=await setup();t.after(()=>s.close());const one=(await s.call('founder','createTask',{title:'One',brief,visibility:'public'})).data,two=(await s.call('founder','createTask',{title:'Two',brief,visibility:'public'})).data;
 const params={taskId:one.id,actions:['read'],maxActions:2,maxTaskMinutes:45,expiresInMinutes:5},key=randomUUID(),grant=await s.call('builder','grant',params,key);
 assert.equal((await s.call('builder','grant',params,key)).agentToken,undefined);
 assert.equal((await s.call(grant.agentToken,'readTask',{taskId:two.id})).status,403);assert.equal((await s.call('builder','list')).data.grants[0].used,0);
 assert.equal((await s.call(grant.agentToken,'readTask',{taskId:one.id})).status,200);
 const audit=(await s.call('builder','agentAudit')).data;assert.equal(audit[0].reason,'permission_denied');assert.equal(audit[0].grantId,grant.data.id);assert.doesNotMatch(JSON.stringify(audit),/fb_agent_|Bearer/);assert.deepEqual((await s.call('other','agentAudit')).data,[]);
 const report=(await s.call('builder','report')).data;assert.equal(report.activeGrants,1);assert.equal(report.contributions,0);assert.doesNotMatch(JSON.stringify(report),/One|Two|Three onboarding/);
});
