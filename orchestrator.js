(function(){
  'use strict';
  const get=id=>document.getElementById(id),kit=window.FBOrchestratorKit;
  const controls=['missionMode','missionClarification','missionDraft','missionMessages','missionMinutes','founderClarification','founderDraft'];
  let runs=[],active=null,client=null,aborter=null,epoch=0;
  const settings=()=>kit.normalize({mode:get('missionMode').value,allowClarification:get('missionClarification').checked,allowDraft:get('missionDraft').checked,maxMessages:get('missionMessages').value,maxTaskMinutes:get('missionMinutes').value,founderClarification:get('founderClarification').checked,founderDraft:get('founderDraft').checked});
  function renderReport(){
    const r=kit.report(runs);get('missionMetrics').textContent=r.runs+' runs · '+r.drafts+' drafts · '+r.blocked+' policy blocks · '+r.failed+' failures · '+r.waiting+' awaiting review';
    get('missionReport').textContent=JSON.stringify(r,null,2);get('missionCopyReport').disabled=!runs.length;
    get('founderAdvice').textContent=r.feedback.founder.join(' ');get('builderAdvice').textContent=r.feedback.builder.join(' ');get('ownerAdvice').textContent=r.ownerRecommendations.join(' ');
    for(const [mode,prefix] of [['review-first','review'],['delegated','delegated']]){const values=r.byMode[mode];get(prefix+'Runs').textContent=String(values.runs);get(prefix+'Drafts').textContent=String(values.drafts);get(prefix+'Blocks').textContent=String(values.blocked);}
  }
  function stop(message){
    epoch++;aborter?.abort();
    if(active&&['running','waiting'].includes(active.outcome)){active.outcome='cleared';active.endedAt=Date.now();}
    active=null;client=null;get('missionStart').disabled=false;get('missionDecision').hidden=true;get('missionResult').textContent='';
    if(message)get('missionStatus').textContent=message;renderReport();
  }
  function event(e,ticket,run){
    if(ticket!==epoch)return;kit.record(run,e,Date.now());
    const item=document.createElement('li');item.className='contribution-panel';
    const add=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;item.append(n);};
    if(e.kind==='discovery')add('p',e.text);
    else if(e.kind==='blocked')add('p','Orchestrator blocked '+e.action+': '+e.reason+'. Permissions were not expanded.');
    else{add('h3','Builder agent');add('p',e.builder);add('h3','Founder agent');add('p',e.founder);add('p','Logged '+e.action+' · '+e.state+' · '+Math.round(e.elapsedMs||0)+' ms');}
    get('missionTrace').append(item);renderReport();
  }
  async function decision(approve,ticket=epoch){
    if(!client||!active||ticket!==epoch)return;const run=active,currentClient=client,currentAborter=aborter;
    get('missionApprove').disabled=true;get('missionDecline').disabled=true;get('missionStatus').textContent='Checking both sides’ permissions before the next step…';
    const timer=setTimeout(()=>currentAborter.abort(),15000);
    try{const result=await currentClient.decide(approve);if(ticket!==epoch)return;run.outcome=result.phase;run.endedAt=Date.now();get('missionResult').textContent=result.artifact;get('missionDecision').hidden=true;get('missionStart').disabled=false;get('missionStatus').textContent=approve?'Fictional draft prepared within this run’s settings. No real message, agreement or portfolio permission.':'Exchange stopped. Declining is a valid outcome.';renderReport();}
    catch(error){fail(error,ticket,run);}finally{clearTimeout(timer);}
  }
  function fail(error,ticket,run){
    if(ticket!==epoch)return;run.outcome=error.sandboxReason?'blocked':'failed';run.endedAt=Date.now();get('missionDecision').hidden=true;get('missionStart').disabled=false;
    get('missionStatus').textContent=error.name==='AbortError'?'Request timed out. Start a new run; the trace is incomplete.':error.message;renderReport();
  }
  async function start(){
    stop();if(runs.length>=50){get('missionStatus').textContent='The session has 50 runs. Copy the report, then clear session history to continue.';return;}
    const ticket=epoch,policy=settings(),run=kit.begin(window.crypto.randomUUID(),policy,Date.now());runs.push(run);active=run;aborter=new AbortController();const currentAborter=aborter;
    get('missionTrace').replaceChildren();get('missionStart').disabled=true;get('missionApprove').disabled=false;get('missionDecline').disabled=false;get('missionStatus').textContent='Applying your settings and starting the fictional mission…';renderReport();
    client=window.FBA2ASandboxClient.create({fetcher:window.fetch.bind(window),origin:window.location.origin,uuid:()=>window.crypto.randomUUID(),policies:policy,signal:aborter.signal,onEvent:e=>event(e,ticket,run)});
    const timer=setTimeout(()=>currentAborter.abort(),15000);
    try{
      await client.start();if(ticket!==epoch)return;
      if(policy.builder.mode==='delegated'){get('missionStatus').textContent='Standing permission selected. The orchestrator will check the draft against both sides’ limits.';await decision(true,ticket);}
      else{run.outcome='waiting';get('missionDecision').hidden=false;get('missionStatus').textContent='Waiting for your review. No further message until you choose.';get('missionApprove').focus();renderReport();}
    }catch(error){fail(error,ticket,run);}finally{clearTimeout(timer);}
  }
  controls.forEach(id=>get(id).addEventListener('change',()=>stop('Settings changed. Any pending run was stopped. Start a new run to apply these permissions.')));
  get('missionStart').addEventListener('click',start);get('missionStop').addEventListener('click',()=>stop('Run stopped locally. Previously signed fictional snapshots expire separately.'));
  get('missionApprove').addEventListener('click',()=>decision(true));get('missionDecline').addEventListener('click',()=>decision(false));
  get('missionClear').addEventListener('click',()=>{stop();runs=[];get('missionTrace').replaceChildren();get('missionStatus').textContent='Session history cleared from this page. Nothing is stored in a database.';renderReport();});
  get('missionCopyReport').addEventListener('click',async()=>{const ticket=epoch;try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable. Select the report text to copy it.');await navigator.clipboard.writeText(kit.exportReport(runs));if(ticket===epoch)get('missionReportStatus').textContent='Aggregate report copied. It excludes message bodies, names, task IDs, continuation tokens and secrets.';}catch(error){if(ticket===epoch)get('missionReportStatus').textContent=error.message;}});
  window.addEventListener('pagehide',()=>{epoch++;aborter?.abort();});renderReport();
})();
