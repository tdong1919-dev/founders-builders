/* Presentation helpers only. No accounts, network requests, analytics or persistence. */
(function(root){
 'use strict';
 const routes={workspace:'cloud-workspace.html',access:'beta-access.html',earlier:'earlier-tools.html'};
 const prompts={interest:'I can help with [deliverable] using [relevant skill]. I’m available [time]. One question: [question].',invitation:'Your [skill] could help us [outcome]. This contribution takes [time], with [support]. Would you like to explore the scope?',reply:'One question before our next step: [question].',delivery:'Here is [work]. It meets [agreed outcome]. Anything still unresolved: [details].',feedback:'What helped: [specific example]. For next time: [one useful suggestion].'};
 function publicOutcome(connected){return connected?'Submission sent. Publication is not confirmed; check the directory before sharing your listing.':'Preview only. Nothing was published or sent.';}
 function expandParents(el){for(let p=el?.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
 const api={routes,prompts,publicOutcome,expandParents};if(typeof module==='object'&&module.exports){module.exports=api;return;}root.FBSiteExperience=api;
 const d=root.document;if(!d)return;
 // Separate decorative direction glyphs from link labels for a quieter mobile layout.
 d.querySelectorAll('.experience-links a,.experience-card a,.entry-example').forEach(a=>{const last=a.lastChild;if(last&&last.nodeType===3&&/\s*→\s*$/.test(last.textContent)){last.textContent=last.textContent.replace(/\s*→\s*$/,'');const arrow=d.createElement('span');arrow.className='link-direction';arrow.setAttribute('aria-hidden','true');arrow.textContent=' →';a.append(arrow);}});

 d.addEventListener('invalid',e=>expandParents(e.target),true);

 const legacyPages=['create-profile.html','add-business.html','add-listing.html','add-job.html','become-mentor.html','add-help.html','add-raise.html','add-investor.html','add-event.html','add-event-source.html','add-collab.html','add-podcast.html','add-resource.html','report-listing.html','concierge.html'];
 const legacyUnavailable=root.FB_CONFIG?.LEGACY_SUBMISSIONS_ENABLED===false&&legacyPages.includes(root.location.pathname.split('/').pop());
 if(legacyUnavailable){d.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);d.querySelectorAll('form').forEach(form=>{const p=d.createElement('p');p.className='experience-note';p.textContent='Legacy submissions are unavailable while the Google integration is verified. Use your cloud workspace, or contact support@getjidoka.com for help.';form.prepend(p);form.querySelectorAll('[type=submit]').forEach(b=>{b.disabled=true;b.textContent='Submission unavailable';});});}
 const taskForm=d.getElementById('cloudTaskForm');
 if(taskForm){const details=d.createElement('details'),summary=d.createElement('summary');details.className='experience-details';summary.textContent='Scope, support and terms · complete before saving';details.append(summary);const essentials=['task_project','task_title','task_deliverable','task_minutes'];for(const label of [...taskForm.children]){if(label.tagName!=='LABEL')continue;const control=label.querySelector('input,textarea,select');if(control&&!essentials.includes(control.id))details.append(label);}const submit=taskForm.querySelector('[type=submit]');taskForm.insertBefore(details,submit);}
 d.querySelectorAll('[data-simple-form]').forEach(form=>{
  const essentials=(form.dataset.simpleForm||'').split(',');const fields=[...form.querySelectorAll('label')].filter(l=>l.querySelector('input:not([type=hidden]),select,textarea')&&!l.closest('.hp'));
  const extras=fields.filter(l=>{const c=l.querySelector('input,select,textarea');return c&&!essentials.includes(c.name||c.id)&&c.type!=='checkbox';});
  if(extras.length){const details=d.createElement('details'),summary=d.createElement('summary');details.className='experience-details';summary.textContent=extras.some(l=>l.querySelector('input,select,textarea')?.required)?'More details · finish required fields before review':'More details · optional';details.append(summary);for(const label of extras)details.append(label);const submit=form.querySelector('[type=submit]');let anchor=submit;while(anchor&&anchor.parentElement!==form)anchor=anchor.parentElement;form.insertBefore(details,anchor||null);}
  form.querySelectorAll('fieldset').forEach(group=>{if(!group.querySelector('input,textarea,select'))group.hidden=true;});
  const status=d.createElement('p');status.className='experience-note';status.textContent='Review what will be public before submitting. This listing does not create a signed-in account.';form.prepend(status);
  let approved=false,review;
  function invalidateReview(){approved=false;if(review)review.remove();review=null;}
  form.addEventListener('input',invalidateReview);
  form.addEventListener('change',invalidateReview);
  form.addEventListener('submit',e=>{
   if(approved){approved=false;return;}e.preventDefault();e.stopImmediatePropagation();
   if(!form.checkValidity()){form.reportValidity();return;}
   review?.remove();review=d.createElement('section');review.className='experience-review';review.setAttribute('aria-label','Review your listing');
   const h=d.createElement('h2');h.textContent='Review before submitting';review.append(h);
   for(const c of form.querySelectorAll('input,textarea,select')){if(!c.name||c.closest('.hp')||c.type==='hidden'||c.type==='checkbox'&&!c.checked||!c.value.trim())continue;const p=d.createElement('p');const label=c.closest('label')?.querySelector('.field__label')?.textContent||c.name;p.textContent=label.replace('*','').trim()+': '+c.value;review.append(p);}
   const note=d.createElement('p');note.textContent='Only include details you have permission to publish. Contact information in public community listings may be visible to visitors. Submission does not guarantee publication.';review.append(note);
   const confirm=d.createElement('button');confirm.type='button';confirm.className='btn';confirm.textContent='Submit this reviewed listing';confirm.addEventListener('click',()=>{if(!review||!form.contains(review)||confirm.disabled)return;if(!form.checkValidity()){form.reportValidity();return;}confirm.disabled=true;approved=true;form.requestSubmit();});review.append(confirm);form.append(review);review.scrollIntoView({block:'start',behavior:'auto'});confirm.focus();
  },true);
  const readySubmit=form.querySelector('[type=submit]');if(readySubmit&&!legacyUnavailable)readySubmit.disabled=false;
 });
 d.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>{const target=d.getElementById(button.dataset.target);if(!target||target.value.trim())return;target.value=prompts[button.dataset.prompt]||'';target.dispatchEvent(new Event('input',{bubbles:true}));expandParents(target);target.focus();}));
 // Required steps stay available while completed optional explanations remain secondary.
 d.querySelectorAll('a[href="workspace.html"]').forEach(a=>a.setAttribute('href',routes.workspace));
 const path=root.location.pathname.split('/').pop()||'index.html';
 if(path==='create-profile.html'){const form=d.getElementById('profileForm');if(form){const details=d.createElement('details'),summary=d.createElement('summary');details.className='experience-details';summary.textContent='Publish a separate public community listing';form.before(details);details.append(summary,form);}}
})(typeof window==='object'?window:globalThis);
