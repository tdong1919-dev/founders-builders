/* Credentials stay in stdin memory; output contains only test results. */
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{create}=require('../a2a-sandbox-client.js'),orchestrator=require('../orchestrator-kit.js'),comparison=require('../brief-experiment-kit.js');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for sandbox verification JSON on stdin (input is hidden).\n');
const args=await new Promise((resolve,reject)=>{let text='';function read(chunk){text+=chunk.toString();if(text.length>20000){reject(Error('Input too large'));return;}if(text.includes('\n')){process.stdin.off('data',read);process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);try{resolve(JSON.parse(text.trim()));}catch{reject(Error('Invalid verification input'));}}}process.stdin.on('data',read);process.stdin.resume();});
try{
 const origin=new URL(args.url).origin;
 if(origin!=='https://founders-builders-ux-review.hello978822.chatgpt.site')throw Error('Unexpected review origin');
 let count=0;
 const fetcher=async(url,options)=>{count++;const headers=new Headers(options?.headers);if(args.bearer)headers.set('OAI-Sites-Authorization','Bearer '+args.bearer);return fetch(url,{...options,redirect:'error',headers,signal:AbortSignal.timeout(15000)});};
 for(const decision of [true,false]){
  const events=[],client=create({fetcher,origin,uuid:()=>crypto.randomUUID(),onEvent:e=>events.push(e)});
  await client.start();assert.equal(events.at(-1).state,'TASK_STATE_INPUT_REQUIRED');assert.equal(events.length,3);
  const result=await client.decide(decision);assert.equal(result.phase,decision?'prepared':'declined');
  console.log(decision?'Hosted inquiry → clarification → human decision → draft: PASS':'Hosted inquiry → clarification → decline: PASS');
 }
 for(const scenario of [
  {name:'Delegated draft within bounds',settings:{mode:'delegated'},expected:'prepared'},
  {name:'Founder restriction overrides delegation',settings:{mode:'delegated',founderDraft:false},expected:'draft_permission'},
  {name:'Outgoing-message budget enforced',settings:{maxMessages:1},expected:'message_limit'},
  {name:'Task-time budget enforced',settings:{maxTaskMinutes:30},expected:'scope_limit'}
 ]){
  const client=create({fetcher,origin,uuid:()=>crypto.randomUUID(),policies:orchestrator.normalize(scenario.settings)});
  let outcome;try{await client.start();outcome=(await client.decide(true)).phase;}catch(error){outcome=error.sandboxReason;}
  assert.equal(outcome,scenario.expected);console.log(scenario.name+': PASS');
 }
 const comparisonResult=await comparison.compare({settings:{},fetcher,origin,uuid:()=>crypto.randomUUID()});
 assert.deepEqual(comparisonResult.arms.map(a=>a.outcome),['ready-for-review','ready-for-review']);assert.equal(comparisonResult.processedMessageDifference,1);assert.deepEqual(comparisonResult.arms[0].policies,comparisonResult.arms[1].policies);console.log('Clearer brief: one fewer message with identical permissions: PASS');
 const limited=await comparison.compare({settings:{maxTaskMinutes:30},fetcher,origin,uuid:()=>crypto.randomUUID()});assert.ok(limited.arms.every(a=>a.reason==='scope_limit'));assert.equal(limited.processedMessageDifference,null);console.log('Both brief variants respect task-time boundary: PASS');
 const page=await fetcher(origin+'/orchestrator.html',{redirect:'error'});assert.equal(page.status,200);const html=await page.text();assert.ok(html.includes('id="missionPlanSummary"')&&html.includes('id="missionRecover"')&&html.includes('id="mission-task"'));console.log('Hosted task → plan → recovery markup: PASS');
 for(const name of ['orchestrator.js','orchestrator-kit.js','agent-network.js','collaboration-core.js','shared-collaboration-client.js','shared-workspace-demo.js']){const r=await fetcher(origin+'/'+name,{redirect:'error'});assert.equal(r.status,200);assert.equal(await r.text(),require('node:fs').readFileSync(new URL('../'+name,import.meta.url),'utf8'));}console.log('Hosted journey/controller assets match tested source: PASS');
 const directory=await fetcher(origin+'/agent-tasks.json',{redirect:'error'});assert.equal(directory.status,200);assert.deepEqual(await directory.json(),require('../agent-network-kit.js').directory());console.log('Hosted discovery scope matches journey source: PASS');
 const sharedPage=await fetcher(origin+'/shared-workspace.html');assert.equal(sharedPage.status,200);assert.ok((await sharedPage.text()).includes('Fictional walkthrough'));
 for(const route of ['/server/shared-service.mjs','/api/collaboration','/api/demo-session']){const response=await fetcher(origin+route);assert.equal(response.status,404);}
 console.log('Public shared preview excludes private service and test identity endpoints: PASS');
 console.log('Verified '+count+' real HTTPS requests; no private data, external messages or terms accepted.');
}catch{console.error('Hosted sandbox verification failed. No credentials or response bodies printed.');process.exitCode=1;}
