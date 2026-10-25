/* Credentials stay in stdin memory; output contains only test results. */
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{create}=require('../a2a-sandbox-client.js');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for private sandbox verification JSON on stdin (input is hidden).\n');
const args=await new Promise((resolve,reject)=>{let text='';function read(chunk){text+=chunk.toString();if(text.length>20000){reject(Error('Input too large'));return;}if(text.includes('\n')){process.stdin.off('data',read);process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);try{resolve(JSON.parse(text.trim()));}catch{reject(Error('Invalid verification input'));}}}process.stdin.on('data',read);process.stdin.resume();});
try{
 const origin=new URL(args.url).origin;
 if(origin!=='https://founders-builders-ux-review.hello978822.chatgpt.site')throw Error('Unexpected review origin');
 let count=0;
 const fetcher=async(url,options)=>{count++;const headers=new Headers(options?.headers);headers.set('OAI-Sites-Authorization','Bearer '+args.bearer);return fetch(url,{...options,headers,signal:AbortSignal.timeout(15000)});};
 for(const decision of [true,false]){
  const events=[],client=create({fetcher,origin,uuid:()=>crypto.randomUUID(),onEvent:e=>events.push(e)});
  await client.start();assert.equal(events.at(-1).state,'TASK_STATE_INPUT_REQUIRED');assert.equal(events.length,3);
  const result=await client.decide(decision);assert.equal(result.phase,decision?'prepared':'declined');
  console.log(decision?'Hosted inquiry → clarification → human decision → draft: PASS':'Hosted inquiry → clarification → decline: PASS');
 }
 console.log('Verified '+count+' real HTTPS requests; no private data, external messages or terms accepted.');
}catch{console.error('Hosted sandbox verification failed. No credentials or response bodies printed.');process.exitCode=1;}
