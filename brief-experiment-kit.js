/* Controlled fictional comparison: change brief completeness, never permissions. */
(function(root){
  'use strict';
  const local=typeof module==='object'&&module.exports;
  const agents=local?require('./a2a-sandbox-client.js'):root.FBA2ASandboxClient;
  const policies=local?require('./orchestrator-kit.js'):root.FBOrchestratorKit;
  async function compare({settings,fetcher,origin,uuid,signal,onEvent=()=>{}}){
    const selected=policies.normalize(settings),arms=[];
    for(const brief of ['needs-clarification','clear']){
      if(signal?.aborted)throw Object.assign(Error('Comparison stopped.'),{name:'AbortError'});
      const arm={brief,outcome:'running',processedMessages:0,clarifications:0,blockedAttempts:0,httpAttempts:0,reason:null,policies:JSON.parse(JSON.stringify(selected))};
      const client=agents.create({origin,uuid,signal,brief,policies:JSON.parse(JSON.stringify(selected)),fetcher:async(url,options)=>{arm.httpAttempts++;return fetcher(url,options);},onEvent:e=>{
        if(signal?.aborted)return;
        if(e.kind==='exchange'){arm.processedMessages++;if(e.action==='clarify')arm.clarifications++;}
        if(e.kind==='blocked'){arm.blockedAttempts++;arm.reason=['message_limit','scope_limit','clarification_permission','draft_permission','policy_change','old_run','invalid_policy','protocol_rejected'].includes(e.reason)?e.reason:'protocol_rejected';}
        onEvent({brief,...e});
      }});
      try{await client.start();arm.outcome='ready-for-review';}
      catch(error){if(signal?.aborted||error.name==='AbortError')throw Object.assign(Error('Comparison stopped.'),{name:'AbortError'});arm.outcome=error.sandboxReason?'policy-stopped':'request-failed';if(!arm.reason)arm.reason=error.sandboxReason?'protocol_rejected':'request-failed';}
      arms.push(arm);
    }
    const [before,after]=arms,bothReady=arms.every(a=>a.outcome==='ready-for-review');
    return {format:'fb-brief-comparison-v1',scope:'Two deterministic fictional runs in this comparison only. Same permissions; only brief completeness changes. No real outcomes or causal ecosystem impact inferred.',arms,processedMessageDifference:bothReady?before.processedMessages-after.processedMessages:null,clarificationDifference:bothReady?before.clarifications-after.clarifications:null,conclusion:bothReady?'The clearer fictional brief reached review with '+after.processedMessages+' processed message(s), compared with '+before.processedMessages+'. This scripted example shows a shorter clarification path, not verified collaboration success.':'At least one run stopped or failed. Inspect each reason; keep the same boundaries and do not treat a policy stop as agent failure.',authority:{introductionsPrepared:false,messagesToRealPeople:false,termsAccepted:false,permissionsExpanded:false}};
  }
  const api={compare};if(local)module.exports=api;else root.FBBriefExperimentKit=api;
})(typeof window==='undefined'?{}:window);
