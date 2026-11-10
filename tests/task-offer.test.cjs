const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const kit=require('../task-offer-kit.js');
const ready={title:'Review a screen',project:'Fictional practice project',outcome:'Make one page clearer',deliverable:'Three notes',acceptance:'Reproducible observations reviewed together',outside:'No code changes',skill:'Testing',experience:'No professional experience required; basic web navigation',minutes:60,support:'A sample screen and a check-in',reviewer:'Project owner',feedbackTiming:'Within three days',compensation:'Paid',terms:'Agree a fixed fee before starting',creditPolicy:'Agree chosen credit name and portfolio permission'};
test('a task offer requires clear scope, support, feedback and credit, but no completed work',()=>{
 assert.equal(kit.validate(ready),'');const text=kit.brief(ready);assert.match(text,/Outside this task: No code changes/);assert.match(text,/Feedback: Within three days/);assert.match(text,/Compensation: Paid/);
 for(const k of ['acceptance','outside','experience','support','feedbackTiming','terms','creditPolicy'])assert.ok(kit.validate({...ready,[k]:''}),k);
 for(const minutes of [0,600,NaN])assert.ok(kit.validate({...ready,minutes}));
});
test('public handoff requires explicit permission and contains only task details, never feedback',()=>{
 assert.throws(()=>kit.publicDraft(ready),/permission/);const r=kit.publicDraft({...ready,publicReady:true,observed:'PRIVATE FEEDBACK',contributor:'PRIVATE NAME'});assert.equal(r.format,'fb-small-task-v1');assert.doesNotMatch(r.description,/PRIVATE/);assert.deepEqual(Object.keys(r),['format','title','description']);
});
test('feedback credit requires reviewed work and contributor agreement without invented results',()=>{
 const r={...ready,contributor:'Chosen name',observed:'Three reproduction notes',strengths:'Clear steps',nextStep:'Add expected behavior',reviewed:true,creditAgreed:true};
 for(const patch of [{reviewed:false},{creditAgreed:false},{observed:''},{nextStep:''}])assert.throws(()=>kit.feedback({...r,...patch}));
 assert.match(kit.feedback(r),/not independently verified/);assert.match(kit.feedback(r),/Three reproduction notes/);
});
function handoff({payload,existing='',query='?task-draft=1'}={}){
 const fields={title:{value:existing},description:{value:''},category:{value:''}},notice={textContent:''};let removed=false;const form={elements:{namedItem:k=>fields[k]}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../task-listing-draft.js'),'utf8'),{URLSearchParams,window:{location:{search:query}},document:{getElementById:id=>id==='collabForm'?form:notice},sessionStorage:{getItem:()=>payload,removeItem:()=>removed=true}});
 return {fields,notice,removed};
}
test('public form handoff is one-time, uses text values, preserves existing edits, and never submits',()=>{
 const r=handoff({payload:JSON.stringify({format:'fb-small-task-v1',title:'<img onerror=alert(1)>',description:'A draft'})});assert.equal(r.fields.title.value,'<img onerror=alert(1)>');assert.equal(r.fields.category.value,'Project');assert.equal(r.removed,true);assert.match(r.notice.textContent,/Nothing has been submitted/);
 const kept=handoff({payload:JSON.stringify({format:'fb-small-task-v1',title:'New',description:'Draft'}),existing:'My edit'});assert.equal(kept.fields.title.value,'My edit');assert.equal(kept.removed,false);
});
test('malformed, missing or oversized handoff data never fills public fields',()=>{
 for(const payload of [null,'bad json',JSON.stringify({format:'other',title:'X',description:'Y'}),JSON.stringify({format:'fb-small-task-v1',title:'x'.repeat(1000),description:'Y'})])assert.equal(handoff({payload}).fields.title.value,'');
 assert.equal(handoff({query:'',payload:JSON.stringify({format:'fb-small-task-v1',title:'X',description:'Y'})}).fields.title.value,'');
});
function controller({failSave=false,failHandoff=false}={}){
 const nodes={},fields={},writes=[];let handoffData,stored=null,unsaved=()=>false;const location={href:''};
 const node=()=>({value:'',checked:false,textContent:'',hidden:false,listeners:{},addEventListener(k,f){this.listeners[k]=f;},focus(){}});const get=id=>nodes[id]||(nodes[id]=node());
 [...Object.keys(ready),'contributor','observed','strengths','nextStep','publicReady','reviewed','creditAgreed'].forEach(k=>{fields[k]=node();fields[k].name=k;fields[k].value=ready[k]||'';if(['publicReady','reviewed','creditAgreed'].includes(k))fields[k].type='checkbox';});const form=get('taskOfferForm');form.elements={namedItem:k=>fields[k]};
 class FormData{forEach(fn){Object.entries(fields).forEach(([k,n])=>fn(n.value,k));}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../task-offer.js'),'utf8'),{window:{FBLocalWorkStore:require('../local-work-store.js'),FBTaskOfferKit:kit,location,FBDraftGuard:{install:fn=>unsaved=fn}},document:{getElementById:get},FormData,navigator:{},localStorage:{getItem:()=>stored,setItem:(k,v)=>{if(failSave)throw Error();writes.push(v);stored=v;},removeItem(){stored=null;}},sessionStorage:{setItem:(k,v)=>{if(failHandoff)throw Error();handoffData=v;}}});return {get,fields,writes,location,external:value=>stored=value,stored:()=>stored,unsaved:()=>unsaved(),handoffData:()=>handoffData};
}
test('outline preserves founder edits and clears any earlier sharing/review confirmations',()=>{
 const s=controller();s.fields.project.value='My existing project';s.fields.deliverable.value='';s.fields.publicReady.checked=true;s.get('useTaskOutline').listeners.click();assert.equal(s.fields.project.value,'My existing project');assert.match(s.fields.deliverable.value,/Three annotated/);assert.equal(s.fields.publicReady.checked,false);
});
test('draft storage failure is honest and preserves the founder form',()=>{
 const s=controller({failSave:true});s.get('taskOfferForm').listeners.submit({preventDefault(){}});assert.match(s.get('taskOfferStatus').textContent,/Unable to save/);assert.equal(s.fields.title.value,ready.title);
});
test('public review navigation requires consent and successfully stored handoff data',()=>{
 const s=controller();s.get('reviewTaskListing').listeners.click();assert.equal(s.location.href,'');assert.equal(s.handoffData(),undefined);s.fields.publicReady.checked=true;s.get('reviewTaskListing').listeners.click();assert.equal(s.location.href,'add-collab.html?task-draft=1');assert.equal(JSON.parse(s.handoffData()).format,'fb-small-task-v1');
 const blocked=controller({failHandoff:true});blocked.fields.publicReady.checked=true;blocked.get('reviewTaskListing').listeners.click();assert.equal(blocked.location.href,'');assert.match(blocked.get('taskOfferStatus').textContent,/Copy the brief instead/);
});
test('editing a founder draft removes stale generated text and sharing permissions',()=>{
 const s=controller();s.fields.publicReady.checked=true;s.fields.reviewed.checked=true;s.fields.creditAgreed.checked=true;s.get('taskOfferOutput').textContent='Old note';s.get('taskOfferForm').listeners.input({target:s.fields.title});assert.equal(s.fields.publicReady.checked,false);assert.equal(s.fields.reviewed.checked,false);assert.equal(s.fields.creditAgreed.checked,false);assert.equal(s.get('taskOfferOutput').textContent,'');
});
test('brief readiness includes every required scope field and incomplete details open for repair',()=>{
 assert.deepEqual(kit.missingFields(ready),[]);assert.deepEqual(kit.missingFields({...ready,outcome:'',minutes:600}),['minutes','outcome']);
 const s=controller();s.fields.outcome.value='';const details={tagName:'DETAILS',open:false,parentElement:null};s.fields.outcome.parentElement=details;let focused=false;s.fields.outcome.focus=()=>focused=true;
 s.get('previewTask').listeners.click();assert.equal(details.open,true);assert.equal(focused,true);assert.equal(s.get('taskOfferOutput').textContent,'');assert.equal(s.writes.length,0);assert.equal(s.fields.outcome.value,'');
 s.get('taskOfferForm').listeners.input({target:s.fields.outcome});assert.match(s.get('taskBriefReadiness').textContent,/1 required detail remains/);
});
test('feedback validation does not redirect the founder into unrelated unfinished offer fields',()=>{
 const s=controller();s.fields.project.value='';let focused=false;s.fields.project.focus=()=>focused=true;s.get('previewFeedback').listeners.click();assert.equal(focused,false);assert.match(s.get('taskOfferStatus').textContent,/work you reviewed/);
});

test('founder task warns after edits and outlines, clearing only after successful save',()=>{
 const s=controller();assert.equal(s.unsaved(),false);
 s.get('taskOfferForm').listeners.input({target:s.fields.title});assert.equal(s.unsaved(),true);
 s.get('taskOfferForm').listeners.submit({preventDefault(){}});assert.equal(s.unsaved(),false);
 s.get('useTaskOutline').listeners.click();assert.equal(s.unsaved(),true);
 const failed=controller({failSave:true});failed.get('taskOfferForm').listeners.input({target:failed.fields.title});
 failed.get('taskOfferForm').listeners.submit({preventDefault(){}});assert.equal(failed.unsaved(),true);
});

test('stale founder task drafts cannot replace or delete a newer saved draft',()=>{
 const s=controller();s.get('taskOfferForm').listeners.submit({preventDefault(){}});assert.equal(s.writes.length,1);
 const newer=JSON.stringify({...ready,title:'Newer task from another tab'});s.external(newer);s.fields.title.value='My open draft';
 s.get('taskOfferForm').listeners.submit({preventDefault(){}});s.get('removeTaskDraft').listeners.click();assert.equal(s.stored(),newer);assert.equal(s.writes.length,1);assert.equal(s.fields.title.value,'My open draft');assert.match(s.get('taskOfferStorageNotice').textContent,/another tab/);
 const undo=controller();undo.get('taskOfferForm').listeners.submit({preventDefault(){}});undo.get('removeTaskDraft').listeners.click();undo.external(newer);undo.get('undoTaskDraft').listeners.click();assert.equal(undo.stored(),newer);assert.equal(undo.writes.length,1);
});
