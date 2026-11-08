/* Build the fictional review Worker, embedding only reviewed public assets. */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),manifest=JSON.parse(fs.readFileSync(path.join(root,'.openai/hosting.json'),'utf8'));
if(!manifest.project_id||manifest.static)throw Error('Worker manifest must preserve project_id and omit static.');
const assets={};const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
for(const name of fs.readdirSync(path.join(root,'public')).sort()){
 const full=path.join(root,'public',name);if(!fs.statSync(full).isFile())continue;
 const type=types[path.extname(name)];if(!type)throw Error('Unsupported review asset: '+name);
 let body=fs.readFileSync(full,'utf8');
 if(path.extname(name)==='.html')body=body.replace(/Private UX review/g,'Public UX sandbox');
 assets['/'+name]={type,body};
}
if(!assets['/index.html']||!assets['/a2a-sandbox.html'])throw Error('Review pages missing.');
if(Object.values(assets).some(a=>a.body.includes('script.google.com/macros/s/')))throw Error('Review must not include a live Sheets endpoint.');
if(!assets['/secure-config.js']?.body.includes('enabled: false'))throw Error('Keep Supabase disabled in review.');
const handler=fs.readFileSync(path.join(root,'sandbox/a2a-handler.mjs'),'utf8').replace('export function createSandbox','function createSandbox');
const source=handler+'\nconst reviewAssets='+JSON.stringify(assets)+';\n'+`
let cachedSecret,cachedSandbox;
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/a2a/founder'||url.pathname==='/.well-known/agent-card.json'){
  if(!cachedSandbox||cachedSecret!==env.FB_A2A_SANDBOX_SECRET){cachedSecret=env.FB_A2A_SANDBOX_SECRET;cachedSandbox=createSandbox({secret:cachedSecret});}
  return cachedSandbox.fetch(request);
 }
 const asset=reviewAssets[url.pathname==='/'?'/index.html':url.pathname==='/.well-known/agent-card.json'?'/a2a-agent-card.json':url.pathname];
 if(!asset)return new Response('Not found',{status:404});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'content-type':asset.type,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin'}});
}};
`;
fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});fs.mkdirSync(path.join(root,'dist/server'),{recursive:true});fs.mkdirSync(path.join(root,'dist/.openai'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/server/index.js'),source);fs.writeFileSync(path.join(root,'dist/.openai/hosting.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built review Worker with '+Object.keys(assets).length+' static assets; no database bindings.');
