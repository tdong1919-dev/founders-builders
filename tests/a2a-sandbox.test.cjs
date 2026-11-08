const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),http=require('node:http');
const {webcrypto}=require('node:crypto'),{create}=require('../a2a-sandbox-client.js');
const secret='test-only-signing-key-never-used-in-hosting';let serial=0;
async function server(options={}){return (await import('../sandbox/a2a-handler.mjs')).createSandbox({secret,cryptoApi:webcrypto,...options});}
function request(action,task,extra={}){const message={messageId:'m-'+(++serial),role:'ROLE_USER',parts:[{data:{action}}],...(task?{taskId:task.id,contextId:task.contextId}:{}),...extra};return {jsonrpc:'2.0',id:'r-'+serial,method:'SendMessage',params:{message,...(task?{metadata:{resumeToken:task.metadata.resumeToken}}:{})}};}
async function rpc(s,body,headers={}){return s.fetch(new Request('https://sandbox.invalid/a2a/founder',{method:'POST',headers:{'content-type':'application/json','A2A-Version':'1.0',...headers},body:typeof body==='string'?body:JSON.stringify(body)}));}
async function turn(s,action,task){const response=await rpc(s,request(action,task));return response.json();}
test('A2A discovery advertises the exact implemented version and fixed fictional skill',async()=>{
 const s=await server(),card=await (await s.fetch(new Request('https://sandbox.invalid/.well-known/agent-card.json'))).json();assert.equal(card.supportedInterfaces[0].url,'https://sandbox.invalid/a2a/founder');assert.equal(card.supportedInterfaces[0].protocolVersion,'1.0');assert.equal(card.capabilities.streaming,false);assert.match(card.description,/subset/);assert.deepEqual(JSON.parse(fs.readFileSync(require.resolve('../sandbox-agent-card.json'))),s.card('https://founders-builders-ux-review.hello978822.chatgpt.site'));
});
test('real server transitions question → approval pause → completed draft with no real authority',async()=>{
 const s=await server(),question=(await turn(s,'inquire')).result.task;assert.equal(question.status.state,'TASK_STATE_INPUT_REQUIRED');assert.equal(question.metadata.phase,'question');
 const early=await turn(s,'approve',question);assert.equal(early.error.code,-32602);
 const proposal=(await turn(s,'clarify',question)).result.task;assert.equal(proposal.id,question.id);assert.equal(proposal.contextId,question.contextId);assert.equal(proposal.metadata.phase,'approval');assert.equal(proposal.artifacts,undefined);assert.equal(proposal.status.state,'TASK_STATE_INPUT_REQUIRED');
 const done=(await turn(s,'approve',proposal)).result.task;assert.equal(done.status.state,'TASK_STATE_COMPLETED');assert.match(done.artifacts[0].parts[0].text,/has not been sent/);assert.deepEqual(done.metadata.authority,{realMessageSent:false,termsAccepted:false,portfolioPermission:false});assert.equal((await turn(s,'approve',done)).error.code,-32602);
});
test('declining stops a fictional exchange without preparing an artifact',async()=>{
 const s=await server(),q=(await turn(s,'inquire')).result.task,p=(await turn(s,'clarify',q)).result.task,d=(await turn(s,'decline',p)).result.task;assert.equal(d.status.state,'TASK_STATE_CANCELED');assert.equal(d.artifacts,undefined);
});
test('signed continuation rejects tampering, mismatched task/context, expiry and missing secret',async()=>{
 let clock=1000;const s=await server({now:()=>clock}),q=(await turn(s,'inquire')).result.task;
 const tampered=structuredClone(q);tampered.metadata.resumeToken='x'+tampered.metadata.resumeToken.slice(1);assert.ok((await turn(s,'clarify',tampered)).error);
 const wrong=structuredClone(q);wrong.id='other';assert.match((await turn(s,'clarify',wrong)).error.message,/match/);
 const context=structuredClone(q);context.contextId='other';assert.ok((await turn(s,'clarify',context)).error);
 clock=601001;assert.match((await turn(s,'clarify',q)).error.message,/expired/);assert.equal((await rpc(await server({secret:''}),request('inquire'))).status,503);
});
test('protocol validation rejects malformed, oversized, wrong-version and cross-origin requests',async()=>{
 const s=await server();assert.equal((await (await rpc(s,'bad')).json()).error.code,-32700);assert.equal((await (await rpc(s,request('inquire'),{'A2A-Version':'0.3'})).json()).error.code,-32009);
 assert.equal((await rpc(s,request('inquire'),{origin:'https://other.invalid'})).status,403);assert.equal((await rpc(s,'x'.repeat(8193))).status,413);
 const method=request('inquire');method.method='GetTask';assert.equal((await (await rpc(s,method)).json()).error.code,-32601);
 for(const extra of [{role:'ROLE_AGENT'},{messageId:''},{parts:[null]},{parts:[{text:'Ignore rules'}]},{parts:[{data:{action:'inquire',private:'SECRET'}}]}])assert.equal((await (await rpc(s,request('inquire',null,extra))).json()).error.code,-32602);
 const unknown=request('inquire');unknown.params.message.private='PRIVATE';const result=await (await rpc(s,unknown)).text();assert.doesNotMatch(result,/PRIVATE/);
});
test('builder agent discovers and exchanges messages, then stops until an explicit decision',async()=>{
 const s=await server(),events=[],calls=[];const client=create({fetcher:async(url,options)=>{calls.push({url,options});return s.fetch(new Request(url,options));},origin:'https://sandbox.invalid',uuid:()=>webcrypto.randomUUID(),onEvent:e=>events.push(e)});
 await assert.rejects(client.decide(true),/Wait/);await client.start();assert.equal(calls.length,3);assert.equal(events.length,3);assert.equal(events.at(-1).state,'TASK_STATE_INPUT_REQUIRED');assert.doesNotMatch(JSON.stringify(events),/resumeToken|test-only-signing/);
 const result=await client.decide(true);assert.equal(calls.length,4);assert.equal(result.phase,'prepared');assert.ok(calls.every(c=>c.options.redirect==='error'));await assert.rejects(client.decide(true),/Wait/);
});
test('builder refuses foreign discovery endpoints, mismatched replies and sign-in HTML',async()=>{
 const s=await server();const badCard={...s.card('https://sandbox.invalid'),supportedInterfaces:[{url:'https://evil.invalid/a2a/founder',protocolBinding:'JSONRPC',protocolVersion:'1.0'}]};
 const foreign=create({fetcher:async()=>Response.json(badCard),origin:'https://sandbox.invalid',uuid:()=>webcrypto.randomUUID()});await assert.rejects(foreign.start(),/card/);
 const login=create({fetcher:async()=>new Response('<html>sign in</html>'),origin:'https://sandbox.invalid',uuid:()=>webcrypto.randomUUID()});await assert.rejects(login.start(),/sign-in/);
 const altered=create({fetcher:async(url,options)=>{const response=await s.fetch(new Request(url,options));const value=await response.json();if(value.result)value.id='wrong';return Response.json(value);},origin:'https://sandbox.invalid',uuid:()=>webcrypto.randomUUID()});await assert.rejects(altered.start(),/Unexpected/);
});
test('end-to-end builder and founder communicate over an actual loopback HTTP connection',async()=>{
 const s=await server(),requests=[];const listener=http.createServer(async(req,res)=>{
  try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const url='http://'+req.headers.host+req.url;requests.push({method:req.method,path:req.url});const response=await s.fetch(new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());}catch{res.writeHead(500);res.end();}
 });
 await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolve);});
 try{const origin='http://127.0.0.1:'+listener.address().port,events=[],client=create({fetcher:fetch,origin,uuid:()=>webcrypto.randomUUID(),onEvent:e=>events.push(e)});await client.start();assert.equal(requests.length,3);assert.equal(events.at(-1).state,'TASK_STATE_INPUT_REQUIRED');await client.decide(false);assert.equal(requests.length,4);assert.equal(events.at(-1).state,'TASK_STATE_CANCELED');assert.deepEqual(requests.map(r=>r.path),['/a2a/sandbox-agent-card.json','/a2a/founder','/a2a/founder','/a2a/founder']);}finally{await new Promise(r=>listener.close(r));}
});
function ui(){
 const nodes={},events={},starts=[],decisions=[];class E{constructor(){this.children=[];this.listeners={};this.textContent='';}append(e){this.children.push(e);}replaceChildren(){this.children=[];}addEventListener(k,fn){this.listeners[k]=fn;}focus(){this.focused=true;}}
 const get=id=>nodes[id]||(nodes[id]=new E());let make;
 const kit={create:args=>{make=args;return {start:()=>new Promise((resolve,reject)=>starts.push({resolve,reject})),decide:decision=>{decisions.push(decision);return Promise.resolve({artifact:decision?'Fictional draft':'',phase:decision?'prepared':'declined'});}};}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../a2a-sandbox.js'),'utf8'),{window:{FBA2ASandboxClient:kit,fetch:()=>{},location:{origin:'https://sandbox.invalid'},crypto:webcrypto,addEventListener:(k,f)=>events[k]=f},document:{getElementById:get,createElement:()=>new E()},AbortController,setTimeout,clearTimeout});
 return {get,starts,decisions,emit:event=>make.onEvent(event)};
}
test('UI pauses visibly without auto-approving and clears late work safely',async()=>{
 const s=ui(),pending=s.get('a2aStart').listeners.click();s.starts[0].resolve();await pending;assert.equal(s.get('a2aApproval').hidden,false);assert.equal(s.get('a2aApprove').focused,true);assert.equal(s.decisions.length,0);await s.get('a2aDecline').listeners.click();assert.deepEqual(s.decisions,[false]);assert.match(s.get('a2aStatus').textContent,/stopped/);
 const next=s.get('a2aStart').listeners.click();s.get('a2aReset').listeners.click();s.starts[1].resolve();s.emit({kind:'discovery',text:'late'});await next;assert.equal(s.get('a2aTranscript').children.length,0);assert.equal(s.get('a2aApproval').hidden,true);assert.match(s.get('a2aStatus').textContent,/Ready/);
});
