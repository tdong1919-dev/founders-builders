const {test}=require('node:test'),assert=require('node:assert/strict'),{webcrypto,randomUUID}=require('node:crypto'),core=require('../collaboration-core.js');
const brief={deliverable:'Three observations',acceptance:'Each gives a suggestion',outside:'No private files',minutes:45,support:'Founder check-in',compensation:'unpaid',compensationDetails:'Voluntary sample',ownership:'Contributor owns notes',feedbackTiming:'Three days',credit:'Exact approved text only'};
async function setup({emailLimited=false}={}){const {createCloudHandler}=await import('../supabase/functions/fb-collaboration/handler.mjs');let state={...core.initial(),credentials:{},requests:{},securityEvents:[]},revision=0,interfere=null,sent=[];const handler=createCloudHandler({origins:['https://review.invalid'],load:async()=>({state:structuredClone(state),revision}),commit:async(r,s)=>{if(interfere){const fn=interfere;interfere=null;fn(state);revision++;return false;}if(r!==revision)return false;state=structuredClone(s);revision++;return true;},verifySession:async token=>({'human_founder_verified':{id:'founder'},'human_builder_verified':{id:'builder'},'human_outsider_verified':{id:'outsider'}}[token]||null),reserveLogin:async email=>email==='approved@example.com',sendCode:async email=>{if(emailLimited)throw Object.assign(Error('provider response must stay private'),{code:'email_rate_limited'});sent.push(email);}});
 async function call(token,operation,params={},key=randomUUID()){const r=await handler(new Request('https://project.invalid/functions/v1/fb-collaboration',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,'Idempotency-Key':key,Origin:'https://review.invalid'},body:JSON.stringify({operation,params})}));return {status:r.status,...await r.json()};}
 return {handler,call,sent,state:()=>state,interfere(fn){interfere=fn;}};
}
test('cloud adapter persists authorized data and prevents stale writes and unauthenticated access',async()=>{
 const s=await setup();assert.equal((await s.call('invalid_token_1234','list')).status,401);const task=(await s.call('human_founder_verified','createTask',{title:'Private cloud idea',brief})).data;assert.equal((await s.call('human_outsider_verified','readTask',{taskId:task.id})).status,404);
 const publicTask=(await s.call('human_founder_verified','createTask',{title:'Sample public task',brief,visibility:'public'})).data;const interest=(await s.call('human_builder_verified','interest',{taskId:publicTask.id,note:'Interested'})).data;const proposal=(await s.call('human_founder_verified','propose',{contributionId:interest.id,expectedVersion:1,terms:brief})).data;
 assert.equal((await s.call('human_builder_verified','accept',{contributionId:interest.id,expectedVersion:1,termsVersion:1})).status,409);assert.equal((await s.call('human_builder_verified','accept',{contributionId:interest.id,expectedVersion:proposal.version,termsVersion:1})).status,200);
 assert.equal((await s.call('human_builder_verified','list')).data.contributions[0].stage,'agreed');assert.doesNotMatch(JSON.stringify((await s.call('human_outsider_verified','list')).data),/Private cloud idea|Interested/);
});
test('cloud CAS retry checks revocation again and never returns an old successful agent replay after revocation',async()=>{
 const s=await setup(),task=(await s.call('human_founder_verified','createTask',{title:'Sample task',brief,visibility:'public'})).data;
 const grant=await s.call('human_builder_verified','grant',{taskId:task.id,actions:['read'],maxActions:3,maxTaskMinutes:45,expiresInMinutes:5});assert.ok(grant.agentToken);assert.doesNotMatch(JSON.stringify(s.state()),/fb_agent_/);
 s.interfere(state=>{state.grants[grant.data.id].revokedAt=Date.now();});assert.equal((await s.call(grant.agentToken,'readTask',{taskId:task.id})).status,403);assert.equal(s.state().grants[grant.data.id].used,0);
 assert.equal((await s.call(grant.agentToken,'readTask',{taskId:task.id})).status,403);
});
test('login sends only to approved addresses and rejects unapproved origins without exposing approval status',async()=>{
 const s=await setup();const a=await s.call('','sendCode',{email:'approved@example.com'}),b=await s.call('','sendCode',{email:'unapproved@example.com'});assert.deepEqual(a,b);assert.deepEqual(s.sent,['approved@example.com']);const denied=await s.handler(new Request('https://project.invalid/functions/v1/fb-collaboration',{method:'POST',headers:{Origin:'https://evil.invalid','Content-Type':'application/json'},body:'{}'}));assert.equal(denied.status,403);
});
test('deployed core bridge matches the tested core exactly',()=>{const fs=require('node:fs');assert.equal(fs.readFileSync(require.resolve('../supabase/functions/fb-collaboration/core.mjs'),'utf8'),'/* Generated from collaboration-core.js. No credentials. */\nconst module={exports:{}};\n'+fs.readFileSync(require.resolve('../collaboration-core.js'),'utf8')+'\nexport default module.exports;\n');});

test('mail provider throttling returns an actionable limit without claiming an email was sent or leaking provider details',async()=>{const s=await setup({emailLimited:true});const result=await s.call('','sendCode',{email:'approved@example.com'});assert.equal(result.status,429);assert.equal(result.error,'email_rate_limited');assert.match(result.message,/No sign-in email was sent/);assert.doesNotMatch(JSON.stringify(result),/provider response/);});

test('two-account check-in to portfolio journey persists through fresh reads and retry-safe commands',async()=>{
 const s=await setup(),f='human_founder_verified',b='human_builder_verified',o='human_outsider_verified';
 const act=async(token,operation,params,key)=>{const result=await s.call(token,operation,params,key);assert.equal(result.status,200,operation+': '+JSON.stringify(result));return result.data;};
 const task=await act(f,'createTask',{title:'Release journey sample',brief,visibility:'public'});
 let c=await act(b,'interest',{taskId:task.id,note:'Private application note'});
 c=await act(f,'propose',{contributionId:c.id,expectedVersion:c.version,terms:brief});
 c=await act(b,'accept',{contributionId:c.id,expectedVersion:c.version,termsVersion:1});
 const key=randomUUID(),params={contributionId:c.id,expectedVersion:c.version,targetAt:Date.now()+86400000,plan:'Compare the first observations privately'};
 c=await act(f,'proposeCheckin',params,key);const version=c.version;
 assert.deepEqual(await act(f,'proposeCheckin',params,key),c);
 assert.equal(s.state().events.filter(e=>e.type==='checkin_proposed').length,1);
 const fresh=(await act(b,'list')).contributions.find(x=>x.id===c.id);assert.deepEqual(fresh.checkin,c.checkin);
 assert.equal((await s.call(o,'readContribution',{contributionId:c.id})).status,404);
 assert.doesNotMatch(JSON.stringify(await act(o,'list')),/Private application note|Compare the first observations privately/);
 c=await act(b,'confirmCheckin',{contributionId:c.id,expectedVersion:version,checkinVersion:1});
 assert.equal((await s.call(f,'proposeCheckin',{...params,targetAt:Date.now()+172800000})).status,409);
 assert.equal((await act(f,'readContribution',{contributionId:c.id})).checkin.status,'confirmed');
 c=await act(f,'completeCheckin',{contributionId:c.id,expectedVersion:c.version,note:'Clear scope; proceed with three observations'});
 assert.equal((await act(b,'readContribution',{contributionId:c.id})).checkin.status,'completed');
 c=await act(b,'deliver',{contributionId:c.id,expectedVersion:c.version,notes:'Three specific observations',evidence:'https://example.com/sample'});
 c=await act(f,'feedback',{contributionId:c.id,expectedVersion:c.version,notes:'Clear and useful',creditText:'Contributed a usability review',allowPortfolio:true});
 c=await act(b,'recordCredit',{contributionId:c.id,expectedVersion:c.version});assert.equal(c.stage,'closed');
 for(const token of [f,b])await act(token,'review',{contributionId:c.id,rating:5,worked:'Clear communication',improve:'Schedule the next check-in early'});
 const completed=await act(b,'list');assert.equal(completed.reviews.length,2);assert.equal(completed.contributions[0].delivery.notes,'Three specific observations');
 assert.equal((await act(b,'exportCredit',{contributionId:c.id})).text,'Contributed a usability review');
 await act(f,'revokePortfolio',{contributionId:c.id});assert.equal((await s.call(b,'exportCredit',{contributionId:c.id})).status,403);
 assert.equal((await act(o,'list')).reviews.length,0);
 assert.equal((await s.call(b,'confirmCheckin',{contributionId:c.id,expectedVersion:c.version,checkinVersion:1})).status,409);
 assert.equal(s.sent.length,0);
});
test('anonymous discovery exposes only explicitly approved public cards; publishing remains authenticated',async()=>{const s=await setup(),task=(await s.call('human_founder_verified','createTask',{title:'SECRET BETA TASK',brief,skills:['design'],visibility:'public'})).data;let found=await s.call('','discoverPublic',{kind:'opportunities'});assert.equal(found.status,200);assert.equal(found.data.items.length,0);assert.equal((await s.call('','publishOpportunity',{taskId:task.id})).status,401);await s.call('human_founder_verified','publishOpportunity',{taskId:task.id,expectedVersion:1,title:'Public invitation',summary:'An approved small review',skills:['design'],confirm:true});found=await s.call('','discoverPublic',{kind:'opportunities'});assert.equal(found.data.items[0].title,'Public invitation');assert.doesNotMatch(JSON.stringify(found),/SECRET BETA TASK|Each gives a suggestion|Contributor owns notes/);assert.equal((await s.call('','discoverPublic',{kind:'opportunities',ownerId:'founder'})).status,400);await s.call('human_founder_verified','withdrawOpportunity',{taskId:task.id});assert.equal((await s.call('','discoverPublic',{kind:'opportunities'})).data.items.length,0);});
test('owners can withdraw public discovery even when the beta storage quota is reached',async()=>{const s=await setup(),task=(await s.call('human_founder_verified','createTask',{title:'Sample task',brief,skills:['design'],visibility:'public'})).data;await s.call('human_founder_verified','publishOpportunity',{taskId:task.id,expectedVersion:1,title:'Public sample',summary:'A small contribution',skills:['design'],confirm:true});s.state().testPadding='x'.repeat(2000001);assert.equal((await s.call('human_founder_verified','withdrawOpportunity',{taskId:task.id})).status,200);assert.equal((await s.call('','discoverPublic',{kind:'opportunities'})).data.items.length,0);});
