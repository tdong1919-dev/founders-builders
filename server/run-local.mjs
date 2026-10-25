/* Explicitly local, fictional identities only. Never bind this development runner publicly. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {openStore,createSharedService} from './shared-service.mjs';
const require=createRequire(import.meta.url),core=require('../collaboration-core.js'),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.FB_LOCAL_PORT||8773);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Choose a local development port.');
const directory=process.env.FB_LOCAL_DATA||path.join(os.tmpdir(),'founders-builders-local-shared');fs.mkdirSync(directory,{recursive:true,mode:0o700});
const store=openStore(path.join(directory,'shared.sqlite')),origin='http://127.0.0.1:'+port;
const sessions={founder:randomBytes(32).toString('base64url'),builder:randomBytes(32).toString('base64url')};
const service=createSharedService({store,origin,verifySession:async token=>{const account=Object.keys(sessions).find(k=>sessions[k]===token);return account?{id:'sample-'+account,emailVerified:true}:null;}});
store.transact(state=>{if(!Object.keys(state.tasks).length)core.create({state,principal:{userId:'sample-founder'},id:randomUUID}).run('createTask',{title:'Review one sample onboarding screen',visibility:'public',brief:{deliverable:'Three observations on one sample onboarding screen',acceptance:'Three clear observations and suggested improvements',outside:'No private data or production code',minutes:45,support:'15 minute founder check-in',compensation:'unpaid',compensationDetails:'Fictional voluntary exercise; no payment promised',ownership:'Contributor retains notes; founder may use agreed feedback',feedbackTiming:'Within three days',credit:'Only exact approved credit text may be exported'}});});
const allowed=new Set(['shared-workspace.html','styles.css','brand-system.css','agent-network.css','mission-control.css','collaboration-core.js','shared-collaboration-client.js','shared-workspace-demo.js','navigation.js']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);let response;
 if(url.pathname==='/api/demo-session'){
  if(req.method!=='POST'||(req.headers.origin&&req.headers.origin!==origin)||req.headers['content-type']!=='application/json'){res.writeHead(403);return res.end();}
  let raw='';for await(const chunk of req){raw+=chunk.toString();if(raw.length>200){res.writeHead(413);return res.end();}}let input;try{input=JSON.parse(raw);}catch{res.writeHead(400);return res.end();}
  if(!Object.hasOwn(sessions,input.account)){res.writeHead(400);return res.end();}response=new Response(JSON.stringify({token:sessions[input.account]}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }else if(url.pathname==='/api/collaboration'){
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(typeof value==='string')headers.set(key,value);
  response=await service.fetch(new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})}));
 }else{
  const name=url.pathname==='/'?'shared-workspace.html':url.pathname.slice(1);if(!allowed.has(name)||!['GET','HEAD'].includes(req.method)){res.writeHead(404);return res.end('Not found');}
  response=new Response(req.method==='HEAD'?null:fs.readFileSync(path.join(root,name)),{headers:{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503);res.end('Local test service unavailable');}});
server.listen(port,'127.0.0.1',()=>console.log('FICTIONAL ACCOUNTS ONLY. Persistent local test: '+origin+'/shared-workspace.html?transport=local'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.close();process.exit(0);}));
