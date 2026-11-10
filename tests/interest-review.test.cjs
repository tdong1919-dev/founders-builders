const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const kit=require('../interest-review-kit.js');
const interest={title:'Review a screen',project:'A fictional project',deliverable:'Three notes',scope:'An unverified scope snapshot',interestName:'Chosen student name',interestNote:'I can test and want to learn',availability:'One hour next week',questions:'What should I test?'};
const terms={deliverable:'Three notes',acceptance:'Clear reproduction steps',exclusions:'No production changes',minutes:'60',compensation:'Paid',terms:'Agree a fixed fee before starting',support:'A check-in',reviewer:'Project owner',feedbackTiming:'Within three days',creditTerms:'Credit by chosen name with permission',ownership:'Agree ownership and portfolio license directly'};
test('student review packet requires sharing permission and excludes private notebook history and results',()=>{
 assert.throws(()=>kit.interestPacket(interest,false));const raw=JSON.stringify(kit.interestPacket({...interest,result:'PRIVATE RESULT',feedback:'PRIVATE FEEDBACK',evidence:'https://example.com/private',permission:true,confirmed:true},true));assert.doesNotMatch(raw,/PRIVATE|example.com|confirmed|permission/);assert.deepEqual(kit.parseInterest(raw),interest);
});
test('missing, oversized, malformed, wrong-version and wrongly typed interest notes fail closed',()=>{
 for(const raw of ['bad JSON','{}','x'.repeat(22001),JSON.stringify({format:'other',interest}),JSON.stringify({format:'fb-student-interest-v1',interest:{...interest,interestName:{bad:true}}})])assert.throws(()=>kit.parseInterest(raw));
 assert.throws(()=>kit.interestPacket({...interest,availability:''},true));
});
test('task agreements distinguish proposals from founder-reported direct confirmation',()=>{
 assert.match(kit.agreement(interest,terms),/awaiting direct confirmation/);assert.match(kit.agreement(interest,{...terms,confirmed:true}),/founder-recorded, not verified/);
 assert.throws(()=>kit.agreement(interest,{...terms,ownership:''}));assert.throws(()=>kit.agreement(interest,{...terms,minutes:'600'}));assert.throws(()=>kit.agreement(interest,{...terms,compensation:'Discuss before starting',confirmed:true}));
});
test('feedback credit requires actual reviewed work and agreed sharing without granting a credential',()=>{
 const r={observed:'Three test notes',strengths:'Clear steps',nextStep:'Include expected behavior',creditName:'Chosen name',portfolioUse:'May show anonymized notes',reviewed:true,creditAgreed:true};
 for(const patch of [{observed:''},{reviewed:false},{creditAgreed:false},{portfolioUse:''}])assert.throws(()=>kit.feedback(interest,{...r,...patch}));
 assert.match(kit.feedback(interest,r),/not independently verified/);assert.match(kit.feedback(interest,r),/anonymized notes/);
});
test('replies require a specific response and do not automatically confirm a place',()=>{
 assert.throws(()=>kit.response(interest,{}));assert.match(kit.response(interest,{response:'Could you test this sample on Tuesday?'}),/not confirmed/);
});
function controller({fail=false,saved='[]',resume=null}={}){
 class E{constructor(){this.listeners={};this.children=[];this.value='';this.checked=false;this.textContent='';}addEventListener(k,fn){this.listeners[k]=fn;}append(...xs){this.children.push(...xs);}replaceChildren(){this.children=[];}setAttribute(){}focus(){this.focused=true;}}
 const nodes={},fields={},writes=[],get=id=>nodes[id]||(nodes[id]=new E());const defaults=kit.normalize({});Object.keys(defaults).forEach(k=>{fields[k]=new E();fields[k].name=k;fields[k].value=typeof defaults[k]==='string'?defaults[k]:'';if(typeof defaults[k]==='boolean')fields[k].type='checkbox';});const form=get('interestReviewForm');form.elements={namedItem:k=>fields[k]};form.reset=()=>Object.values(fields).forEach(f=>{f.value='';f.checked=false;});
 class FormData{forEach(fn){Object.entries(fields).forEach(([k,f])=>fn(f.value,k));}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../interest-review.js'),'utf8'),{URLSearchParams,sessionStorage:{getItem:()=>resume,removeItem(){}},window:{location:{search:resume?'?next-step=1':''},FBLocalWorkStore:require('../local-work-store.js'),FBNextStepKit:require('../next-step-kit.js'),FBReviewBackupKit:require('../review-backup-kit.js'),FBInterestReviewKit:kit,confirm:()=>false},document:{getElementById:get,createElement:()=>new E()},localStorage:{getItem:()=>saved,setItem:(k,v)=>{if(fail)throw Error('Full');writes.push(v);saved=v;}},FormData,navigator:{},Date,Math});return {get,fields,writes,form,external:value=>saved=value,stored:()=>saved};
}
test('opening an interest renders hostile strings literally and never saves automatically',()=>{
 const s=controller();s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket({...interest,interestName:'<img src=x onerror=alert(1)>'},true));s.get('loadInterestPacket').listeners.click();assert.equal(s.writes.length,0);assert.match(s.get('interestReviewContext').textContent,/<img src=x/);assert.equal(s.get('interestReviewContext').children.length,0);assert.equal(s.fields.deliverable.value,interest.deliverable);
});
test('saving is explicit and storage failures preserve review notes without claiming success',()=>{
 const s=controller({fail:true});s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();s.fields.response.value='My unsaved response';s.form.listeners.submit({preventDefault(){}});assert.match(s.get('interestReviewStatus').textContent,/Unable to save/);assert.equal(s.fields.response.value,'My unsaved response');
});
test('editing review notes revokes stale confirmations and clears generated output',()=>{
 const s=controller();s.fields.confirmed.checked=s.fields.reviewed.checked=s.fields.creditAgreed.checked=true;s.get('interestReviewOutput').textContent='Old note';s.form.listeners.input({target:s.fields.deliverable});assert.equal(s.fields.confirmed.checked,false);assert.equal(s.fields.reviewed.checked,false);assert.equal(s.fields.creditAgreed.checked,false);assert.equal(s.get('interestReviewOutput').textContent,'');
});
test('local review removal supports undo and never sends a student notification',()=>{
 const s=controller();s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();s.form.listeners.submit({preventDefault(){}});assert.equal(JSON.parse(s.writes.at(-1)).length,1);assert.match(s.get('interestReviewStatus').textContent,/No contributor has been notified/);s.get('removeInterestReview').listeners.click();assert.equal(JSON.parse(s.writes.at(-1)).length,0);s.get('undoInterestReview').listeners.click();assert.equal(JSON.parse(s.writes.at(-1)).length,1);
});
test('review desk blocks outbound connections and form navigation',()=>{
 const page=fs.readFileSync(require.resolve('../review-interest.html'),'utf8');assert.match(page,/connect-src 'none'/);assert.match(page,/form-action 'none'/);
});
test('scope reuse requires matching task and project and leaves ownership for explicit agreement',()=>{
 const offers=require('../task-offer-kit.js');const task={title:interest.title,project:interest.project,outcome:'Clarify a screen',deliverable:interest.deliverable,acceptance:'Reviewed observations',outside:'No code changes',skill:'Testing',experience:'Basic web use',minutes:60,compensation:'Paid',terms:'Agree fixed fee',support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',creditPolicy:'Agree credit and portfolio use'};
 const context={...interest,scope:'Unverified public snapshot\n\n'+offers.brief(task)};const draft=kit.scopeTemplate(context);assert.equal(draft.minutes,'60');assert.equal(draft.ownership,undefined);assert.equal(draft.confirmed,undefined);
 assert.throws(()=>kit.scopeTemplate({...context,project:'Another project'}));assert.throws(()=>kit.scopeTemplate({...context,title:'Another task'}));
});
test('founder next-action guidance follows local stage without inferring acceptance or reviewed work',()=>{
 for(const [phase,target] of [['reviewing','reviewReply'],['clarification','reviewAgreement'],['agreement','reviewAgreement'],['working','reviewFeedback'],['feedback','reviewFeedback'],['closed','reviewReply']])assert.equal(kit.nextAction({phase}).target,target);
 const s=controller();s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();s.fields.phase.value='working';s.form.listeners.input({target:s.fields.phase});assert.match(s.get('reviewNextTitle').textContent,/work is ready/);
 let focused=false;s.fields.observed.focus=()=>focused=true;s.get('reviewNextAction').listeners.click();assert.equal(s.get('reviewFeedback').open,true);assert.equal(focused,true);assert.equal(s.fields.phase.value,'working');assert.equal(s.fields.reviewed.checked,false);assert.equal(s.fields.creditAgreed.checked,false);assert.equal(s.writes.length,0);assert.equal(s.get('interestReviewOutput').textContent,'');
 s.get('goReviewAgreement').listeners.click();assert.equal(s.get('reviewAgreement').open,true);assert.equal(s.fields.phase.value,'working');
});
test('saved review filters find names, tasks and projects while separating closed local stages',()=>{
 const records=[{id:'1',interest:{...interest,interestName:'Alex',project:'Atlas'},review:{phase:'working'}},{id:'2',interest:{...interest,interestName:'Sam',title:'Draft a page'},review:{phase:'closed'}}];
 assert.deepEqual(kit.filterReviews(records,'ATLAS','all').map(r=>r.id),['1']);assert.equal(kit.filterReviews(records,'sam','open').length,0);assert.equal(kit.filterReviews(records,' draft ','closed')[0].id,'2');assert.equal(kit.filterReviews(records,'alex','feedback').length,0);assert.equal(kit.phaseLabel('agreement'),'Terms drafted');
});
test('filtering saved reviews preserves unsaved form work, confirmations and storage',()=>{
 const saved=JSON.stringify([{id:'one',interest,review:{phase:'working'}},{id:'two',interest:{...interest,interestName:'Another contributor'},review:{phase:'closed'}}]);const s=controller({saved});
 s.get('savedInterestReviews').children[0].listeners.click();s.fields.response.value='My unsaved reply';s.fields.confirmed.checked=true;s.form.listeners.input({target:s.fields.confirmed});
 s.get('reviewStageFilter').value='closed';s.get('reviewStageFilter').listeners.change();assert.equal(s.get('savedInterestReviews').children.length,1);assert.match(s.get('reviewFilterNotice').textContent,/notes stay open/);assert.equal(s.fields.response.value,'My unsaved reply');assert.equal(s.fields.confirmed.checked,true);assert.equal(s.writes.length,0);
 s.get('reviewSearch').value='<img>';s.get('reviewSearch').listeners.input();assert.match(s.get('savedInterestReviews').children[0].textContent,/No saved reviews match/);s.get('clearReviewFilters').listeners.click();assert.equal(s.get('savedInterestReviews').children.length,2);assert.equal(s.get('reviewFilterNotice').textContent,'');assert.equal(s.fields.response.value,'My unsaved reply');assert.equal(s.writes.length,0);
});
test('an unopened review desk gives a starting point and filters never hide the open workspace',()=>{
 const s=controller();assert.equal(s.get('reviewEmptyState').hidden,false);s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();assert.equal(s.get('reviewEmptyState').hidden,true);assert.equal(s.get('reviewWorkspace').hidden,false);s.get('reviewSearch').value='No match';s.get('reviewSearch').listeners.input();assert.equal(s.get('reviewEmptyState').hidden,true);assert.equal(s.get('reviewWorkspace').hidden,false);
});
test('review backup restore requires preview and acknowledgment, appends fresh IDs and preserves unsaved work',()=>{
 const backup=require('../review-backup-kit.js'),s=controller();s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();s.fields.response.value='Unsaved reply stays here';s.fields.confirmed.checked=true;
 s.get('reviewBackupInput').value=backup.pack([{id:'untrusted-id',interest:{...interest,interestName:'<img src=x onerror=alert(1)>'},review:{phase:'working',response:'Saved founder notes',confirmed:true,reviewed:true,creditAgreed:true}}]);
 s.get('restoreReviewBackup').listeners.click();assert.equal(s.writes.length,0);s.get('previewReviewBackup').listeners.click();assert.equal(s.writes.length,0);assert.match(s.get('reviewBackupPreview').children[0].textContent,/<img src=x/);assert.equal(s.get('reviewBackupPreview').children[0].children.length,0);
 s.get('restoreReviewBackup').listeners.click();assert.equal(s.writes.length,0);s.get('reviewBackupAck').checked=true;s.get('restoreReviewBackup').listeners.click();assert.equal(s.writes.length,1);const restored=JSON.parse(s.writes[0])[0];assert.notEqual(restored.id,'untrusted-id');assert.equal(restored.review.confirmed,false);assert.equal(restored.review.reviewed,false);assert.equal(restored.review.creditAgreed,false);assert.equal(s.fields.response.value,'Unsaved reply stays here');assert.equal(s.fields.confirmed.checked,true);
 s.get('previewReviewBackup').listeners.click();s.get('reviewBackupAck').checked=true;s.get('restoreReviewBackup').listeners.click();assert.equal(s.writes.length,1);assert.match(s.get('reviewBackupStatus').textContent,/already exist/);
});
test('changed review backups revoke acknowledgment and failed writes preserve existing reviews',()=>{
 const backup=require('../review-backup-kit.js'),s=controller({fail:true,saved:JSON.stringify([{id:'keep',interest,review:{phase:'working'}}])});s.get('savedInterestReviews').children[0].listeners.click();s.fields.response.value='Keep my edits';
 s.get('reviewBackupInput').value=backup.pack([{interest:{...interest,interestName:'Other contributor'},review:{phase:'closed'}}]);s.get('previewReviewBackup').listeners.click();s.get('reviewBackupAck').checked=true;s.get('reviewBackupInput').listeners.input();assert.equal(s.get('reviewBackupAck').checked,false);s.get('restoreReviewBackup').listeners.click();assert.equal(s.writes.length,0);
 s.get('previewReviewBackup').listeners.click();s.get('reviewBackupAck').checked=true;s.get('restoreReviewBackup').listeners.click();assert.match(s.get('reviewBackupStatus').textContent,/Unable to restore/);assert.equal(s.writes.length,0);assert.equal(s.get('savedInterestReviews').children.length,1);assert.equal(s.fields.response.value,'Keep my edits');
});
test('review backups include only saved versions, not open edits or filtered subsets',()=>{
 const s=controller({saved:JSON.stringify([{id:'1',interest,review:{phase:'working',response:'Saved notes'}},{id:'2',interest:{...interest,interestName:'Another contributor'},review:{phase:'closed'}}])});s.get('savedInterestReviews').children[0].listeners.click();s.fields.response.value='UNSAVED PRIVATE TEXT';s.get('reviewStageFilter').value='closed';s.get('reviewStageFilter').listeners.change();s.get('prepareReviewBackup').listeners.click();const raw=s.get('reviewBackupOutput').value;assert.equal(JSON.parse(raw).records.length,2);assert.doesNotMatch(raw,/UNSAVED PRIVATE TEXT/);assert.match(raw,/Saved notes/);
});

test('My next step opens the correct founder review and feedback section without changing its stage',()=>{
 const saved=JSON.stringify([{id:'chosen',interest,review:{phase:'working',observed:'Already reviewed notes'}}]);
 const s=controller({saved,resume:JSON.stringify({kind:'review',id:'chosen'})});
 assert.equal(s.fields.phase.value,'working');assert.equal(s.fields.observed.value,'Already reviewed notes');assert.equal(s.fields.observed.focused,true);assert.equal(s.get('reviewFeedback').open,true);
 assert.equal(s.fields.reviewed.checked,false);assert.equal(s.fields.creditAgreed.checked,false);assert.equal(s.writes.length,0);
 const wrong=controller({saved,resume:JSON.stringify({kind:'contribution',id:'chosen'})});assert.equal(wrong.get('reviewIdentity').textContent,'');assert.equal(wrong.writes.length,0);assert.match(wrong.get('interestReviewStatus').textContent,/unavailable/);
});

test('explicit proposed-terms and shared-feedback stages save and reopen without closing or confirming',()=>{
 for(const phase of ['terms_proposed','feedback_shared']){
  const s=controller();s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();
  s.fields.phase.value=phase;s.form.listeners.input({target:s.fields.phase});assert.equal(s.writes.length,0);
  s.form.listeners.submit({preventDefault(){}});assert.equal(JSON.parse(s.writes[0])[0].review.phase,phase);
  const reopened=controller({saved:s.writes[0]});reopened.get('savedInterestReviews').children[0].listeners.click();
  assert.equal(reopened.fields.phase.value,phase);assert.equal(reopened.fields.confirmed.checked,false);assert.equal(reopened.fields.reviewed.checked,false);assert.equal(reopened.fields.creditAgreed.checked,false);
 }
});

test('one malformed saved founder review cannot hide valid work or permit overwriting the damaged store',()=>{
 const saved=JSON.stringify([{id:'bad',interest:{}},{id:'good',interest,review:{phase:'terms_proposed'}}]);
 const s=controller({saved,resume:JSON.stringify({kind:'review',id:'good'})});
 assert.equal(s.fields.phase.value,'terms_proposed');assert.match(s.get('reviewStorageNotice').textContent,/recovery/);
 s.get('prepareReviewBackup').listeners.click();assert.match(s.get('reviewBackupStatus').textContent,/not a complete backup/);assert.equal(JSON.parse(s.get('reviewBackupOutput').value).records.length,1);
 s.fields.response.value='An unsaved follow-up';s.form.listeners.submit({preventDefault(){}});assert.equal(s.writes.length,0);
 s.get('removeInterestReview').listeners.click();assert.equal(s.writes.length,0);
 s.get('reviewBackupInput').value=require('../review-backup-kit.js').pack([{interest:{...interest,interestName:'Another contributor'},review:{phase:'reviewing'}}]);s.get('previewReviewBackup').listeners.click();s.get('reviewBackupAck').checked=true;s.get('restoreReviewBackup').listeners.click();assert.equal(s.writes.length,0);assert.match(s.get('reviewBackupStatus').textContent,/recovery/);
});

test('interest export refuses an encoded snapshot too large for the receiving review desk',()=>{
 assert.throws(()=>kit.interestPacket({...interest,scope:'\\'.repeat(12000)},true),/too large to share/);
});

test('stale founder review tabs cannot save, remove, restore or undo over newer work',()=>{
 const original=[{id:'r',interest,review:{phase:'terms_proposed'}}];
 const newer=JSON.stringify([{...original[0],review:{phase:'feedback_shared'}}]);
 for(const action of ['save','remove','restore']){
  const s=controller({saved:JSON.stringify(original)});s.get('savedInterestReviews').children[0].listeners.click();s.fields.response.value='My open reply';s.external(newer);
  if(action==='save')s.form.listeners.submit({preventDefault(){}});
  if(action==='remove')s.get('removeInterestReview').listeners.click();
  if(action==='restore'){
   s.get('reviewBackupInput').value=require('../review-backup-kit.js').pack([{interest:{...interest,interestName:'Another contributor'},review:{phase:'reviewing'}}]);s.get('previewReviewBackup').listeners.click();s.get('reviewBackupAck').checked=true;s.get('restoreReviewBackup').listeners.click();
  }
  assert.equal(s.stored(),newer);assert.equal(s.writes.length,0);assert.equal(s.fields.response.value,'My open reply');assert.match(s.get('reviewStorageNotice').textContent,/another tab/);
 }
 const s=controller({saved:JSON.stringify(original)});s.get('savedInterestReviews').children[0].listeners.click();s.get('removeInterestReview').listeners.click();s.external(newer);s.get('undoInterestReview').listeners.click();assert.equal(s.stored(),newer);assert.equal(s.writes.length,1);
});

test('closing draft controls require feedback-shared stage and never close or save the review',()=>{
 const s=controller();s.get('interestPacketInput').value=JSON.stringify(kit.interestPacket(interest,true));s.get('loadInterestPacket').listeners.click();assert.equal(s.get('closingReplyActions').hidden,true);
 s.fields.phase.value='feedback_shared';s.form.listeners.input({target:s.fields.phase});assert.equal(s.get('closingReplyActions').hidden,false);
 s.get('previewReviewclosingReply').listeners.click();assert.match(s.get('interestReviewOutput').textContent,/Closing conversation draft/);assert.equal(s.fields.phase.value,'feedback_shared');assert.equal(s.fields.reviewed.checked,false);assert.equal(s.fields.creditAgreed.checked,false);assert.equal(s.writes.length,0);
 s.fields.phase.value='closed';s.form.listeners.input({target:s.fields.phase});assert.equal(s.get('closingReplyActions').hidden,true);s.get('previewReviewclosingReply').listeners.click();assert.equal(s.get('interestReviewOutput').textContent,'');assert.equal(s.writes.length,0);
});
