/* Short, accessible steps. Values stay in the existing form; no storage or automatic writes. */
(function(root){'use strict';
 function enhance(form,{document= root.document,size=2}={}){
  if(!form?.querySelectorAll||form.dataset?.guided)return null;
  form.dataset.guided='true';form.noValidate=true;form.classList.add('guided-form');let page=0;
  const labels=[...form.querySelectorAll('label')].filter(l=>l.querySelector('input,select,textarea'));
  const finals=[...form.querySelectorAll('button')];const nav=document.createElement('div');nav.className='guided-navigation';
  const back=document.createElement('button'),next=document.createElement('button'),status=document.createElement('p');
  back.type=next.type='button';back.textContent='Back';next.textContent='Continue';back.className='btn btn--secondary';next.className='btn';status.setAttribute('role','status');status.tabIndex=-1;nav.append(status,back,next);form.prepend(nav);
  const eligible=label=>{for(let p=label.parentElement;p&&p!==form;p=p.parentElement)if(p.hidden)return false;return !label.querySelector('input[type="hidden"]');};
  let visible=[];
  function draw(focus=false){const active=labels.filter(eligible),pages=Math.max(1,Math.ceil(active.length/size));page=Math.min(page,pages-1);visible=active.slice(page*size,(page+1)*size);for(const l of labels){l.classList.toggle('guided-visible',visible.includes(l));if(visible.includes(l))for(let p=l.parentElement;p&&p!==form;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
   form.classList.toggle('guided-last',page===pages-1);for(const b of finals)b.hidden=page!==pages-1;back.hidden=page===0;next.hidden=page===pages-1;status.textContent='Step '+(page+1)+' of '+pages; if(focus)visible[0]?.querySelector('input,select,textarea')?.focus();
  }
  function advance(){for(const l of visible){const input=l.querySelector('input,select,textarea');if(input?.checkValidity&&!input.checkValidity()){input.reportValidity();return;}}page++;draw(true);}
  back.addEventListener('click',()=>{page=Math.max(0,page-1);draw(true);});next.addEventListener('click',advance);
  form.addEventListener('change',()=>draw());form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON'&&!next.hidden){e.preventDefault();advance();}});
  form.addEventListener('submit',e=>{if(!next.hidden){e.preventDefault();e.stopImmediatePropagation();advance();}else{const active=labels.filter(eligible),bad=active.find(l=>{const i=l.querySelector('input,select,textarea');return i?.checkValidity&&!i.checkValidity();});if(bad){e.preventDefault();e.stopImmediatePropagation();page=Math.floor(active.indexOf(bad)/size);draw(true);bad.querySelector('input,select,textarea').reportValidity();}}},true);draw();return {refresh:draw};
 }
 function tabs(host,entries,{document=root.document,label='Workspace sections',initial=0}={}){
  if(!host?.prepend)return;const nav=document.createElement('div');nav.className='workspace-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',label);const buttons=[];
  function show(index,focus=false){entries.forEach((e,i)=>{e.panel.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});if(focus)buttons[index].focus();}
  entries.forEach((e,i)=>{const b=document.createElement('button');b.type='button';b.textContent=e.label;b.setAttribute('role','tab');b.className='workspace-tab';const id=e.panel.id||('workspace-panel-'+Math.random().toString(36).slice(2));e.panel.id=id;b.id=id+'-tab';b.setAttribute('aria-controls',id);e.panel.setAttribute('role','tabpanel');e.panel.setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>show(i));b.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();show(event.key==='Home'?0:event.key==='End'?entries.length-1:(i+(event.key==='ArrowRight'?1:-1)+entries.length)%entries.length,true);}});buttons.push(b);nav.append(b);});host.prepend(nav);show(initial);return {show};
 }
 const api={enhance,tabs};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBGuidedForms=api;
})(typeof window==='undefined'?{}:window);
