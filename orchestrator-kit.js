/* Session-only orchestration evidence. No personal messages, credentials or storage. */
(function(root){
  'use strict';
  const reasons=['message_limit','scope_limit','clarification_permission','draft_permission','policy_change','old_run','invalid_policy','protocol_rejected'];
  function normalize(input={}){
    return {builder:{mode:input.mode==='delegated'?'delegated':'review-first',allowClarification:input.allowClarification!==false,allowDraft:input.allowDraft!==false,maxMessages:[1,2,3].includes(Number(input.maxMessages))?Number(input.maxMessages):3,maxTaskMinutes:[30,45,60].includes(Number(input.maxTaskMinutes))?Number(input.maxTaskMinutes):45},founder:{allowClarification:input.founderClarification!==false,allowDraft:input.founderDraft!==false}};
  }
  function begin(id,policies,at){return {id,policies:normalize({mode:policies.builder.mode,allowClarification:policies.builder.allowClarification,allowDraft:policies.builder.allowDraft,maxMessages:policies.builder.maxMessages,maxTaskMinutes:policies.builder.maxTaskMinutes,founderClarification:policies.founder.allowClarification,founderDraft:policies.founder.allowDraft}),startedAt:at,endedAt:null,outcome:'running',events:[]};}
  function record(run,event,at){
    if(!['running','waiting'].includes(run.outcome)||run.events.length>=20)return;
    if(event.kind==='discovery')run.events.push({type:'discovery',at});
    else if(event.kind==='exchange'&&['inquire','clarify','approve','decline'].includes(event.action))run.events.push({type:'exchange',action:event.action,at,state:['TASK_STATE_INPUT_REQUIRED','TASK_STATE_COMPLETED','TASK_STATE_CANCELED'].includes(event.state)?event.state:'unknown',elapsedMs:Number.isFinite(event.elapsedMs)?Math.max(0,Math.min(120000,Math.round(event.elapsedMs))):null});
    else if(event.kind==='blocked')run.events.push({type:'blocked',action:['inquire','clarify','approve','decline'].includes(event.action)?event.action:'unknown',reason:reasons.includes(event.reason)?event.reason:'protocol_rejected',at});
  }
  function report(runs){
    const result={format:'fb-orchestrator-session-report-v1',scope:'Fictional runs in this page session only; not ecosystem analytics or verified collaboration success.',runs:runs.length,drafts:0,declined:0,blocked:0,failed:0,cleared:0,waiting:0,running:0,byMode:{'review-first':{runs:0,drafts:0,blocked:0},delegated:{runs:0,drafts:0,blocked:0}},exchanges:0,measuredRequests:0,meanMessageResponseMs:null,friction:{},feedback:{founder:[],builder:[]}};
    let duration=0;
    for(const run of runs){
      const mode=result.byMode[run.policies.builder.mode];mode.runs++;if(run.outcome==='prepared')mode.drafts++;if(run.outcome==='blocked')mode.blocked++;if(run.outcome==='running')result.running++;
      if(run.outcome==='prepared')result.drafts++;if(run.outcome==='declined')result.declined++;if(run.outcome==='blocked')result.blocked++;if(run.outcome==='failed')result.failed++;if(run.outcome==='cleared')result.cleared++;if(run.outcome==='waiting')result.waiting++;
      for(const e of run.events){if(e.type==='exchange'){result.exchanges++;if(e.elapsedMs!==null){duration+=e.elapsedMs;result.measuredRequests++;}}if(e.type==='blocked')result.friction[e.reason]=(result.friction[e.reason]||0)+1;}
    }
    if(result.measuredRequests)result.meanMessageResponseMs=Math.round(duration/result.measuredRequests);
    result.feedback.founder.push('State scope, time, support, compensation and credit up front; the fictional task still has unresolved terms.');
    result.feedback.builder.push('Keep the mission specific and ask about unresolved terms before committing. A prepared draft is not a successful collaboration.');
    if(result.friction.scope_limit)result.feedback.builder.push('A task exceeded your time limit. Seek a smaller task or explicitly revise your mission; never expand limits automatically.');
    if(result.friction.message_limit){result.feedback.builder.push('The message budget was reached. Combine related scope questions or explicitly change the budget for a new run.');result.feedback.founder.push('A complete task brief can reduce clarification exchanges.');}
    if(result.friction.clarification_permission||result.friction.draft_permission){result.feedback.builder.push('Respect the other side’s contact and drafting preferences. A refusal is not agent failure.');result.feedback.founder.push('Make your allowed contact and introduction preferences visible in discovery.');}
    result.ownerRecommendations=[];
    if(result.blocked)result.ownerRecommendations.push('Review the recorded policy-block reasons before changing the flow. Permission blocks may be the intended outcome.');
    if(result.failed)result.ownerRecommendations.push('Investigate request failures and sign-in/availability before interpreting mission outcomes.');
    if(result.waiting)result.ownerRecommendations.push('Some runs await a human decision. Do not treat approval pauses as failures or remove them to increase throughput.');
    result.ownerRecommendations.push('No real collaboration outcomes or cross-ecosystem comparison data are available. Do not infer impact, rank people, or broaden permissions from draft counts.');
    return result;
  }
  function exportReport(runs){return JSON.stringify(report(runs),null,2);}
  const api={normalize,begin,record,report,exportReport};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBOrchestratorKit=api;
})(typeof window==='undefined'?{}:window);
