(function(){
  'use strict';
  const get=id=>document.getElementById(id);let client=null,controller=null,epoch=0;
  function showEvent(event){
    const item=document.createElement('li');item.className='contribution-panel';
    const add=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;item.append(e);};
    if(event.kind==='discovery')add('p',event.text);
    else{add('h3','Builder agent');add('p',event.builder);add('h3','Founder agent');add('p',event.founder);add('p',event.method+' · '+event.endpoint+' · '+event.state);}
    get('a2aTranscript').append(item);
  }
  function reset(){epoch++;controller?.abort();client=null;get('a2aStart').disabled=false;get('a2aApproval').hidden=true;get('a2aApprove').disabled=false;get('a2aDecline').disabled=false;get('a2aArtifact').textContent='';get('a2aTranscript').replaceChildren();get('a2aStatus').textContent='Ready for a new fictional exchange.';}
  async function run(){
    reset();const ticket=epoch;controller=new AbortController();const activeController=controller;const timer=setTimeout(()=>activeController.abort(),15000);get('a2aStart').disabled=true;get('a2aStatus').textContent='Discovering the founder agent and exchanging scope questions…';
    client=window.FBA2ASandboxClient.create({fetcher:window.fetch.bind(window),origin:window.location.origin,uuid:()=>window.crypto.randomUUID(),signal:controller.signal,onEvent:event=>{if(ticket===epoch)showEvent(event);}});
    try{await client.start();if(ticket!==epoch)return;get('a2aApproval').hidden=false;get('a2aStatus').textContent='Paused for you. The agents will send no further message until you choose below.';get('a2aApprove').focus();}
    catch(error){if(ticket===epoch){get('a2aStatus').textContent=error.name==='AbortError'?'The exchange timed out. Start again; no real message or agreement was created.':error.message;get('a2aStart').disabled=false;}}
    finally{clearTimeout(timer);}
  }
  async function decide(approved){
    if(!client)return;const ticket=epoch;get('a2aApprove').disabled=true;get('a2aDecline').disabled=true;get('a2aStatus').textContent='Sending your fictional decision to the founder agent…';
    const activeController=controller;const timer=setTimeout(()=>activeController.abort(),15000);
    try{const result=await client.decide(approved);if(ticket!==epoch)return;get('a2aApproval').hidden=true;get('a2aArtifact').textContent=result.artifact;get('a2aStatus').textContent=approved?'Fictional draft prepared. Nothing sent outside this sandbox; no terms accepted or portfolio permission granted.':'Exchange stopped. No introduction prepared or sent.';get('a2aStart').disabled=false;}
    catch(error){if(ticket===epoch){get('a2aApproval').hidden=true;get('a2aStart').disabled=false;get('a2aStatus').textContent=error.name==='AbortError'?'The decision timed out. Start a new fictional exchange.':error.message;}}
    finally{clearTimeout(timer);}
  }
  get('a2aStart').addEventListener('click',run);get('a2aReset').addEventListener('click',reset);get('a2aApprove').addEventListener('click',()=>decide(true));get('a2aDecline').addEventListener('click',()=>decide(false));
  window.addEventListener('pagehide',()=>{epoch++;controller?.abort();});
})();
