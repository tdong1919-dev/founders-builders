/* A2A 1.0 SendMessage subset. Fixed fictional scenario, no LLM or outbound calls. */
export function createSandbox({secret,cryptoApi=globalThis.crypto,now=Date.now}={}){
  const enc=new TextEncoder(),dec=new TextDecoder();
  const key=typeof secret==='string'&&secret.length>=32?cryptoApi.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']):null;
  const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  async function seal(state){const body=encode(enc.encode(JSON.stringify(state)));return body+'.'+encode(new Uint8Array(await cryptoApi.subtle.sign('HMAC',await key,enc.encode(body))));}
  async function open(token){
    if(typeof token!=='string'||token.length>2000)throw Error('Run expired or invalid. Start a new fictional exchange.');
    const bits=token.split('.');
    if(bits.length!==2||!await cryptoApi.subtle.verify('HMAC',await key,decode(bits[1]),enc.encode(bits[0])))throw Error('Run expired or invalid. Start a new fictional exchange.');
    const state=JSON.parse(dec.decode(decode(bits[0])));
    if(state.exp<=now()||state.aud!=='fb-fictional-a2a-v1')throw Error('Run expired or invalid. Start a new fictional exchange.');
    return state;
  }
  function card(origin){return {name:'Fictional founder agent',description:'Rule-based sandbox for one fictional design task. Implements the A2A 1.0 SendMessage JSON-RPC subset only. No real offers or external messaging. Private review access is enforced by Sites sign-in.',version:'0.1.0',supportedInterfaces:[{url:origin+'/a2a/founder',protocolBinding:'JSONRPC',protocolVersion:'1.0'}],capabilities:{streaming:false,pushNotifications:false},defaultInputModes:['application/json'],defaultOutputModes:['text/plain','application/json'],skills:[{id:'fictional-scope-review',name:'Clarify a fictional task',description:'Ask one scope question, propose a small task, and pause for a human decision.',tags:['sandbox','fictional','human-review']} ]};}
  const phases={question:'TASK_STATE_INPUT_REQUIRED',approval:'TASK_STATE_INPUT_REQUIRED',prepared:'TASK_STATE_COMPLETED',declined:'TASK_STATE_CANCELED'};
  const messages={question:'I can offer a fictional onboarding-screen review. Should the deliverable be three written observations or one annotated screen? Please choose a scope before I propose details.',approval:'Proposed fictional task: three observations on one sample screen, up to 45 minutes, a 15-minute check-in and written feedback within three days. No real compensation offer. Ownership, credit and portfolio permission remain unresolved. Pause: ask your person whether to prepare an introduction draft. This does not accept task terms.',prepared:'Your person chose to prepare a fictional introduction draft. No founder was contacted, no work was agreed, and no compensation or portfolio permission was granted.',declined:'The fictional exchange was stopped. No introduction was prepared or sent.'};
  const userTexts={inquire:'I represent a fictional builder looking for a short design contribution. What scope and support are available?',clarify:'Three written observations on one sample screen would fit. Please clarify time, support, compensation and credit before anything is agreed.',approve:'My person selected Prepare fictional introduction after reviewing the proposal. This is not acceptance of task terms.',decline:'My person selected Stop exchange. Do not prepare an introduction.'};
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','A2A-Version':'1.0'};
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
  const error=(id,code,message,status=200)=>json({jsonrpc:'2.0',id,error:{code,message}},status);
  return {card,async fetch(request){
    const url=new URL(request.url);
    if(url.pathname==='/.well-known/agent-card.json')return request.method==='GET'?json(card(url.origin)):json({error:'Method not allowed'},405);
    if(url.pathname!=='/a2a/founder')return new Response('Not found',{status:404});
    if(request.method!=='POST')return json({error:'Use POST'},405);
    const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Cross-origin requests are not supported'},403);
    if(request.headers.get('A2A-Version')!=='1.0')return error(null,-32009,'This sandbox requires A2A-Version: 1.0.');
    if(!request.headers.get('content-type')?.startsWith('application/json'))return error(null,-32600,'Use application/json.',415);
    if(!key)return error(null,-32603,'Sandbox is not configured. No exchange was started.',503);
    let raw;try{
      const reader=request.body?.getReader();if(!reader)throw Error();let size=0;const chunks=[];
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return error(null,-32600,'Request too large.',413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}raw=dec.decode(bytes);
    }catch{return error(null,-32700,'Request could not be read.');}
    let rpc;try{rpc=JSON.parse(raw);}catch{return error(null,-32700,'Invalid JSON payload.');}
    const id=rpc?.id;
    if(!rpc||Array.isArray(rpc)||rpc.jsonrpc!=='2.0'||!((typeof id==='string'&&id.length<=100)||(typeof id==='number'&&Number.isFinite(id))))return error(null,-32600,'Invalid JSON-RPC request.');
    if(rpc.method!=='SendMessage')return error(id,-32601,'Only SendMessage is implemented in this sandbox subset.');
    const msg=rpc.params?.message,data=msg?.parts?.[0]?.data,action=data?.action;
    if(msg?.role!=='ROLE_USER'||typeof msg.messageId!=='string'||!msg.messageId||msg.messageId.length>100||!Array.isArray(msg.parts)||msg.parts.length!==1||!msg.parts[0]||typeof msg.parts[0]!=='object'||Array.isArray(msg.parts[0])||Object.keys(msg.parts[0]).join()!=='data'||!['inquire','clarify','approve','decline'].includes(action)||Object.keys(data).some(k=>k!=='action'))return error(id,-32602,'Use one structured fictional action: inquire, clarify, approve or decline.');
    let state;
    try{
      if(action==='inquire'){
        if(msg.taskId||msg.contextId||rpc.params.metadata?.resumeToken)return error(id,-32602,'Start a new exchange without a task or resume token.');
        state={aud:'fb-fictional-a2a-v1',id:cryptoApi.randomUUID(),contextId:cryptoApi.randomUUID(),phase:'question',exp:now()+600000};
      }else{
        state=await open(rpc.params.metadata?.resumeToken);
        if(msg.taskId!==state.id||(msg.contextId&&msg.contextId!==state.contextId))return error(id,-32602,'Task and context do not match this run.');
        if((action==='clarify'&&state.phase!=='question')||(['approve','decline'].includes(action)&&state.phase!=='approval'))return error(id,-32602,'This action is not available at this stage. Start a new run if already finished.');
        state={...state,phase:action==='clarify'?'approval':action==='approve'?'prepared':'declined'};
      }
      const serverMessage={messageId:cryptoApi.randomUUID(),taskId:state.id,contextId:state.contextId,role:'ROLE_AGENT',parts:[{text:messages[state.phase]}]};
      const task={id:state.id,contextId:state.contextId,status:{state:phases[state.phase],timestamp:new Date(now()).toISOString(),message:serverMessage},history:[{messageId:msg.messageId,taskId:state.id,contextId:state.contextId,role:'ROLE_USER',parts:[{text:userTexts[action]}]},serverMessage],metadata:{fictional:true,phase:state.phase,resumeToken:await seal(state),expiresAt:new Date(state.exp).toISOString(),scope:'Signed fictional snapshots; no durable task store, polling, one-time replay prevention or identity verification.',authority:{realMessageSent:false,termsAccepted:false,portfolioPermission:false}}};
      if(state.phase==='prepared')task.artifacts=[{artifactId:'fictional-introduction',name:'Fictional introduction draft',parts:[{text:'A fictional builder would like to discuss reviewing one sample onboarding screen. Proposed output: three observations in up to 45 minutes. Confirm support, compensation, ownership, credit and sharing permission directly before starting. This draft is unverified and has not been sent.'}]}];
      return json({jsonrpc:'2.0',id,result:{task}});
    }catch{return error(id,-32602,'Run expired or invalid. Start a new fictional exchange.');}
  }};
}
