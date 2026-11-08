/* ChatGPT/Sites discovery tools return only the same public connection metadata as the website. */
export function createDiscoveryMcp({connection,card}){
 const names={get_founders_builders_connection:{description:'Read public Founders & Builders connection instructions and current integration limits. This tool cannot access accounts, private tasks or execute coordination requests.',data:connection},get_founders_builders_agent_card:{description:'Read the public A2A owner-handoff Agent Card. It describes capabilities; it does not grant permission or contact another agent.',data:card}};
 return async request=>{
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};const reply=(body,status=200)=>new Response(body===null?null:JSON.stringify(body),{status,headers});
  if(request.headers.get('Origin')&&!['https://founders-builders-ux-review.hello978822.chatgpt.site','https://chatgpt.com'].includes(request.headers.get('Origin')))return reply({error:'forbidden'},403);
  if(request.method!=='POST')return new Response(null,{status:405,headers:{...headers,Allow:'POST'}});
  let rpc;try{let raw='',bytes=0;const reader=request.body?.getReader();if(!reader)return reply({error:'invalid'},400);const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>20000){await reader.cancel();return reply({error:'too_large'},413);}raw+=decoder.decode(part.value,{stream:true});}rpc=JSON.parse(raw+decoder.decode());}catch{return reply({error:'invalid_json'},400);}
  if(!rpc||Array.isArray(rpc)||rpc.jsonrpc!=='2.0'||typeof rpc.method!=='string'||rpc.id!==undefined&&!['string','number'].includes(typeof rpc.id))return reply({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Invalid request'}},400);
  const ok=result=>reply({jsonrpc:'2.0',id:rpc.id,result}),error=(code,message)=>reply({jsonrpc:'2.0',id:rpc.id??null,error:{code,message}});
  if(rpc.id===undefined)return rpc.method==='notifications/initialized'?reply(null,202):error(-32601,'Unsupported notification');
  if(rpc.method==='server/discover')return ok({supportedVersions:['2026-07-28','2025-11-25'],capabilities:{tools:{}}});
  if(rpc.method==='initialize')return ok({protocolVersion:rpc.params?.protocolVersion==='2025-11-25'?'2025-11-25':'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'founders-builders-discovery',version:'0.1.0'},instructions:'These tools expose public metadata only. GitHub context and discovery do not authorize private tasks. Private coordination requires an owner-authorized connection. Never request credentials in chat.'});
  if(rpc.method==='ping')return ok({});
  if(rpc.method==='tools/list')return ok({tools:Object.entries(names).map(([name,tool])=>({name,description:tool.description,inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},securitySchemes:[{type:'noauth'}]}))});
  if(rpc.method!=='tools/call')return error(-32601,'Method not found');
  const name=rpc.params?.name,args=rpc.params?.arguments||{};if(!Object.hasOwn(names,name)||typeof args!=='object'||Array.isArray(args)||Object.keys(args).length)return error(-32602,'Select a discovery tool with empty arguments.');
  return ok({content:[{type:'text',text:JSON.stringify(names[name].data)}],isError:false});
 };
}
