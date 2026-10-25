/* A rule-based builder agent: actual HTTP client, no model or private storage. */
(function(root){
  'use strict';
  function create({fetcher,origin,uuid,onEvent=()=>{},signal,policies,clock=Date.now}){
    let task=null,phase='new',busy=false;
    const fixedOrigin=new URL(origin).origin;
    async function read(path,options){
      const response=await fetcher(fixedOrigin+path,{...options,signal,redirect:'error',cache:'no-store',credentials:'same-origin'});
      if(!response.ok)throw Error('Sandbox request failed ('+response.status+'). Sign in if needed, then start a new run.');
      const text=await response.text();if(text.length>30000)throw Error('Unexpected sandbox response.');
      let value;try{value=JSON.parse(text);}catch{throw Error('Sandbox is unavailable or sign-in is required. Start a new run after signing in.');}return value;
    }
    async function send(action){
      const started=clock();
      const message={messageId:uuid(),role:'ROLE_USER',parts:[{data:{action}}]};
      const params={message};if(!task&&policies!==undefined)params.metadata={policies};if(task){message.taskId=task.id;message.contextId=task.contextId;params.metadata={resumeToken:task.metadata.resumeToken};}
      const id=uuid(),reply=await read('/a2a/founder',{method:'POST',headers:{'content-type':'application/json','A2A-Version':'1.0'},body:JSON.stringify({jsonrpc:'2.0',id,method:'SendMessage',params})});
      if(reply.error){
        const reasons=['message_limit','scope_limit','clarification_permission','draft_permission','policy_change','old_run','invalid_policy'];
        const reason=reasons.includes(reply.error.data?.sandboxReason)?reply.error.data.sandboxReason:'protocol_rejected';
        onEvent({kind:'blocked',action,reason,elapsedMs:Math.max(0,clock()-started)});
        const error=Error(reply.error.message||'The sandbox rejected this step.');error.sandboxReason=reason;throw error;
      }
      const next=reply.result?.task,expected={inquire:['question','TASK_STATE_INPUT_REQUIRED'],clarify:['approval','TASK_STATE_INPUT_REQUIRED'],approve:['prepared','TASK_STATE_COMPLETED'],decline:['declined','TASK_STATE_CANCELED']}[action];
      if(reply.jsonrpc!=='2.0'||reply.id!==id||!next?.id||!next.contextId||next.metadata?.fictional!==true||next.metadata.phase!==expected[0]||next.status?.state!==expected[1]||typeof next.metadata.resumeToken!=='string'||next.metadata.resumeToken.length>2000||typeof next.status.message?.parts?.[0]?.text!=='string'||next.status.message.parts[0].text.length>4000||next.metadata.authority?.realMessageSent!==false||next.metadata.authority?.termsAccepted!==false||next.metadata.authority?.portfolioPermission!==false||(task&&(next.id!==task.id||next.contextId!==task.contextId)))throw Error('Unexpected task response. Nothing further was sent.');
      task=next;phase=expected[0];
      onEvent({kind:'exchange',action,method:'SendMessage',endpoint:'/a2a/founder',taskId:task.id,state:task.status.state,elapsedMs:Math.max(0,clock()-started),sequence:task.metadata.orchestrator?.processedMessages,decisionBasis:task.metadata.orchestrator?.decisionBasis,builder:task.history?.[0]?.parts?.[0]?.text||'Fictional '+action,founder:task.status.message.parts[0].text});
      return task;
    }
    async function start(){
      if(busy||phase!=='new')throw Error('Start a new run before another exchange.');busy=true;
      try{
        const card=await read('/.well-known/agent-card.json',{headers:{'A2A-Version':'1.0'}});
        if(!card.supportedInterfaces?.some(i=>i.protocolBinding==='JSONRPC'&&i.protocolVersion==='1.0'&&i.url===fixedOrigin+'/a2a/founder'))throw Error('The agent card does not advertise this sandbox endpoint.');
        onEvent({kind:'discovery',text:'Builder agent discovered the fictional founder agent’s A2A 1.0 JSON-RPC interface.'});
        await send('inquire');await send('clarify');return {phase};
      }catch(error){phase='failed';throw error;}finally{busy=false;}
    }
    async function decide(approved){
      if(busy||phase!=='approval'||typeof approved!=='boolean')throw Error('Wait for the proposal and choose a human decision.');busy=true;
      try{const result=await send(approved?'approve':'decline');return {phase,artifact:result.artifacts?.[0]?.parts?.[0]?.text||''};}
      catch(error){phase='failed';throw error;}finally{busy=false;}
    }
    return {start,decide};
  }
  const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBA2ASandboxClient=api;
})(typeof window==='undefined'?{}:window);
