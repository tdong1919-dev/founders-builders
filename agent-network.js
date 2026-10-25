(function(){
  'use strict';
  const get=id=>document.getElementById(id),kit=window.FBAgentNetworkKit;
  let selected='',revision=0;
  const input=()=>({taskId:selected,name:get('agentName').value,goal:get('agentGoal').value,availability:get('agentAvailability').value});
  function invalidate(){revision++;get('agentConsent').checked=false;get('agentOutput').textContent='';get('agentStatus').textContent='';get('agentCopy').disabled=true;}
  function render(){
    const list=kit.search(get('agentSkill').value,get('agentTime').value),box=get('agentTasks');box.replaceChildren();
    get('agentCount').textContent=list.length+' fictional '+(list.length===1?'task':'tasks')+' match. No live offers or agents are connected.';
    get('agentEmpty').hidden=!!list.length;
    if(selected&&!list.some(t=>t.id===selected)){selected='';get('agentComposer').hidden=true;invalidate();}
    for(const task of list){
      const card=document.createElement('article');card.className='contribution-panel';
      function add(tag,text){const el=document.createElement(tag);el.textContent=text;card.append(el);}
      add('p','Fictional task · '+task.skill+' · '+task.minutes+' minutes');add('h3',task.title);add('p',task.project);add('p','Deliver: '+task.deliverable);add('p','Support: '+task.support);add('p','Compensation: '+task.compensation);add('p','Credit: '+task.credit);
      add('p','Why this fits: '+task.skill+' practice within your '+get('agentTime').value+'-minute limit. This is a filter match, not a suitability guarantee.');
      const button=document.createElement('button');button.type='button';button.className='btn btn--secondary';button.textContent='Preview an introduction →';button.setAttribute('aria-label','Preview an introduction for '+task.title);
      button.addEventListener('click',()=>{selected=task.id;invalidate();get('agentComposer').hidden=false;get('agentSelected').textContent=task.title+' · '+task.project;get('agentName').focus();});card.append(button);box.append(card);
    }
  }
  get('agentSkill').addEventListener('change',render);get('agentTime').addEventListener('change',render);
  get('agentReset').addEventListener('click',()=>{get('agentSkill').value='';get('agentTime').value='120';render();get('agentSkill').focus();});
  ['agentName','agentGoal','agentAvailability'].forEach(id=>get(id).addEventListener('input',invalidate));
  get('agentConsent').addEventListener('change',()=>{revision++;get('agentCopy').disabled=!get('agentConsent').checked||!get('agentOutput').textContent;get('agentStatus').textContent='';});
  get('agentPreview').addEventListener('click',()=>{invalidate();try{get('agentOutput').textContent=JSON.stringify(kit.introduction(input()),null,2);get('agentStatus').textContent='Review every included detail, then confirm below. Nothing has been sent or saved.';}catch(error){get('agentStatus').textContent=error.message;}});
  get('agentCopy').addEventListener('click',async()=>{
    const ticket=revision;
    try{const raw=kit.reviewed(input(),get('agentConsent').checked);if(raw!==get('agentOutput').textContent)throw Error('Details changed. Preview and review this introduction again.');
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable. Select and copy the reviewed preview yourself.');
      await navigator.clipboard.writeText(raw);if(ticket===revision)get('agentStatus').textContent='Draft copied. Nothing sent, accepted or published. This fictional preview has no recipient.';
    }catch(error){if(ticket===revision)get('agentStatus').textContent=error.message;}
  });
  render();
})();
