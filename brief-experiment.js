(function(){
  'use strict';
  const get=id=>document.getElementById(id);let controller=null,epoch=0,result=null;
  const fields=['compareMessages','compareMinutes','compareBuilderQuestions','compareFounderQuestions'];
  function reset(message){epoch++;controller?.abort();result=null;get('compareStart').disabled=false;get('compareCopy').disabled=true;get('compareResults').hidden=true;get('compareTrace').replaceChildren();get('compareStatus').textContent=message||'Ready to compare the two fictional briefs.';get('compareCopyStatus').textContent='';}
  async function start(){
    reset();const ticket=epoch;controller=new AbortController();const activeController=controller,timer=setTimeout(()=>activeController.abort(),20000);get('compareStart').disabled=true;get('compareStatus').textContent='Running both fictional briefs with the same permissions…';
    const settings={mode:'review-first',maxMessages:get('compareMessages').value,maxTaskMinutes:get('compareMinutes').value,allowClarification:get('compareBuilderQuestions').checked,founderClarification:get('compareFounderQuestions').checked};
    try{
      const data=await window.FBBriefExperimentKit.compare({settings,fetcher:window.fetch.bind(window),origin:window.location.origin,uuid:()=>window.crypto.randomUUID(),signal:controller.signal,onEvent:e=>{
        if(ticket!==epoch)return;const item=document.createElement('li');item.className='contribution-panel';
        const text=e.kind==='exchange'?'Builder: '+e.builder+'\nFounder: '+e.founder:e.kind==='blocked'?'Policy stopped '+e.action+': '+e.reason:e.text;
        item.textContent=(e.brief==='clear'?'Clearer brief':'Incomplete brief')+' · '+text;get('compareTrace').append(item);
      }});
      if(ticket!==epoch)return;result=data;
      data.arms.forEach((arm,i)=>{const prefix=i?'clear':'incomplete';get(prefix+'Outcome').textContent={'ready-for-review':'Ready for review','policy-stopped':'Stopped by a boundary','request-failed':'Request failed'}[arm.outcome];get(prefix+'Messages').textContent=String(arm.processedMessages);get(prefix+'Questions').textContent=String(arm.clarifications);get(prefix+'Reason').textContent={scope_limit:'Task exceeds time limit',message_limit:'Message budget reached',clarification_permission:'Clarification not permitted','request-failed':'Connection or response error'}[arm.reason]||(arm.reason?'Request not allowed':'No policy stop');});
      get('compareConclusion').textContent=data.conclusion;get('compareResults').hidden=false;get('compareCopy').disabled=false;get('compareStatus').textContent='Comparison finished. No draft prepared, terms accepted or permissions expanded.';
    }catch(error){if(ticket===epoch)get('compareStatus').textContent=error.name==='AbortError'?'Comparison stopped or timed out. No partial result is presented as a completed comparison.':error.message;}
    finally{clearTimeout(timer);if(ticket===epoch)get('compareStart').disabled=false;}
  }
  fields.forEach(id=>get(id).addEventListener('change',()=>reset('Settings changed. Start a new comparison so both runs use the same limits.')));
  get('compareStart').addEventListener('click',start);get('compareStop').addEventListener('click',()=>reset('Comparison stopped. Any in-flight fictional request may have reached the server; no real action was taken.'));
  get('compareCopy').addEventListener('click',async()=>{if(!result)return;const ticket=epoch;try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable. Read the comparison above.');await navigator.clipboard.writeText(JSON.stringify(result,null,2));if(ticket===epoch)get('compareCopyStatus').textContent='Comparison copied. It contains fictional metrics and permissions, without message bodies, identities, task IDs or tokens.';}catch(error){if(ticket===epoch)get('compareCopyStatus').textContent=error.message;}});
  window.addEventListener('pagehide',()=>{epoch++;controller?.abort();});
})();
