const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const kit=require('../contribution-kit.js');
function setup({fail=false,saved='[]',incoming=null,resume=null}={}){
 const elements={},writes=[];class E{constructor(){this.listeners={};this.children=[];this.value='';this.checked=false;this.type='text';this.textContent='';}addEventListener(k,f){this.listeners[k]=f;}append(...xs){this.children.push(...xs);}replaceChildren(){this.children=[];}setAttribute(){}focus(){this.focused=true;}}
 const get=id=>elements[id]||(elements[id]=new E());const form=get('contributionForm');form.reportValidity=()=>true;
 const fields={};['title','project','skill','deliverable','collaborator','nextStep','result','evidence','credit','scope','feedback','creditAgreement','interestName','interestNote','availability','questions','agreementSnapshot','feedbackSnapshot','agreementQuestions','status','permission'].forEach(k=>fields[k]=new E());fields.permission=get('contributionPermission');fields.permission.type='checkbox';form.elements={namedItem:k=>fields[k]};form.reset=()=>Object.values(fields).forEach(f=>{f.value='';f.checked=false;});get('starterTime').value='60';
 class FormData{forEach(fn){Object.entries(fields).forEach(([k,e])=>fn(e.value,k));}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../contribution-notebook.js'),'utf8'),{URLSearchParams,window:{FBLocalWorkStore:require('../local-work-store.js'),FBNextStepKit:require('../next-step-kit.js'),FBContributionBackupKit:require('../contribution-backup-kit.js'),FBContributionKit:kit,FBFounderReturnKit:require('../founder-return-kit.js'),FBTaskJourneyKit:require('../task-journey-kit.js'),location:{search:resume?'?next-step=1':incoming?'?founder-task=1':''},confirm:()=>false},document:{getElementById:get,createElement:()=>new E()},sessionStorage:{getItem:()=>resume||incoming,removeItem(){}},localStorage:{getItem:()=>saved,setItem:(k,v)=>{if(fail)throw Error('full');writes.push(v);saved=v;}},FormData,navigator:{},Date,Math});
 return {get,fields,writes,external:value=>saved=value,stored:()=>saved,submit:()=>form.listeners.submit({preventDefault(){}})};
}
test('saving is explicit and storage failure never claims to have saved a record',()=>{
 const a=setup();assert.equal(a.writes.length,0);a.fields.title.value='A task';a.fields.deliverable.value='A short summary';a.submit();assert.equal(a.writes.length,1);assert.match(a.get('contributionStatus').textContent,/Saved on this device only/);
 const b=setup({fail:true});b.fields.title.value='A task';b.fields.deliverable.value='A summary';b.submit();assert.match(b.get('contributionStatus').textContent,/Unable to save/);assert.equal(b.get('savedContributions').children[0].textContent,'No contributions saved on this device yet.');assert.equal(b.fields.title.value,'A task');
});
test('stored text renders as literal text and editing revokes prior sharing permission',()=>{
 const s=setup({saved:JSON.stringify([{id:'c1',title:'<img src=x onerror=alert(1)>',deliverable:'Notes',permission:true}])});const button=s.get('savedContributions').children[0];assert.match(button.textContent,/<img src=x/);assert.equal(button.children.length,0);button.listeners.click();assert.equal(s.fields.permission.checked,true);
 s.get('contributionForm').listeners.input({target:s.fields.title});assert.equal(s.fields.permission.checked,false);
});
test('corrupt saved records leave a working unsaved planner and a clear status',()=>{
 const s=setup({saved:'invalid json'});assert.match(s.get('contributionStatus').textContent,/could not be read/);assert.equal(s.get('starterTasks').children.length,4);
});
test('notebook page blocks network connections and uses separate self-hosted scripts',()=>{
 const page=fs.readFileSync(require.resolve('../learn-by-building.html'),'utf8');assert.match(page,/connect-src 'none'/);assert.match(page,/form-action 'none'/);assert.match(page,/src="contribution-kit.js(?:\?[^"]*)?"/);assert.match(page,/src="contribution-notebook.js(?:\?[^"]*)?"/);
});
test('removing a local contribution offers an undo without touching the current form',()=>{
 const s=setup({saved:JSON.stringify([{id:'c1',title:'A completed task',deliverable:'Notes'}])});s.get('savedContributions').children[0].listeners.click();s.get('removeContribution').listeners.click();assert.equal(JSON.parse(s.writes.at(-1)).length,0);assert.equal(s.get('undoContribution').hidden,false);
 s.get('undoContribution').listeners.click();assert.equal(JSON.parse(s.writes.at(-1))[0].id,'c1');assert.equal(s.get('undoContribution').hidden,true);
});
test('invalid incoming task draft cannot overwrite or claim to save notebook records',()=>{
 const s=setup({incoming:'{"format":"untrusted"}'});assert.match(s.get('taskInterestNotice').textContent,/unavailable or invalid/);assert.equal(s.writes.length,0);assert.equal(s.fields.title.value,'');
});
test('valid founder task import preserves scope but does not save, send, or claim completion',()=>{
 const journey=require('../task-journey-kit.js');const task={title:'A founder task',project:'A project',outcome:'Clarify a page',deliverable:'Three notes',acceptance:'Reviewed notes',outside:'No production changes',skill:'Testing',experience:'Basic web use',minutes:60,support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',compensation:'Paid',terms:'Agree fee first',creditPolicy:'Agree portfolio use'};
 const s=setup({incoming:JSON.stringify(journey.pack(task,'public'))});assert.equal(s.fields.title.value,task.title);assert.equal(s.fields.status.value,'interest');assert.equal(s.fields.permission.checked,false);assert.match(s.fields.scope.value,/public listing · unverified/);assert.equal(s.writes.length,0);assert.match(s.get('taskInterestNotice').textContent,/has not been sent/);
});
function founderPacket(){return require('../founder-return-kit.js').agreementPacket({title:'Review a task',project:'Fictional project',interestName:'Student'},{deliverable:'Three reviewed notes',acceptance:'Clear steps',exclusions:'No code changes',minutes:'60',compensation:'Paid',terms:'Agree fixed fee',support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',creditTerms:'Agree credit',ownership:'Agree ownership'});}
test('received proposal preview and application require matching identity and explicit acknowledgment without saving',()=>{
 const s=setup();s.fields.title.value='Review a task';s.fields.project.value='Fictional project';s.fields.interestName.value='Student';s.fields.deliverable.value='Notes';s.fields.status.value='interest';s.fields.permission.checked=true;s.get('founderReturnInput').value=JSON.stringify(founderPacket());s.get('previewFounderReturn').listeners.click();assert.match(s.get('founderReturnPreview').textContent,/sender and terms unverified/);s.get('applyFounderReturn').listeners.click();assert.equal(s.fields.deliverable.value,'Notes');s.get('founderReturnAck').checked=true;s.get('applyFounderReturn').listeners.click();assert.equal(s.fields.deliverable.value,'Three reviewed notes');assert.equal(s.fields.status.value,'planning');assert.equal(s.fields.permission.checked,false);assert.equal(s.writes.length,0);
});
test('wrong-recipient returns cannot stage changes and editing invalidates student review and application acknowledgment',()=>{
 const s=setup();s.fields.title.value='Review a task';s.fields.project.value='Fictional project';s.fields.interestName.value='Another student';s.get('founderReturnInput').value=JSON.stringify(founderPacket());s.get('previewFounderReturn').listeners.click();assert.equal(s.get('founderReturnPreview').textContent,'');s.get('founderReturnAck').checked=true;s.get('studentTermsReviewed').checked=true;s.get('contributionForm').listeners.input({target:s.fields.title});assert.equal(s.get('founderReturnAck').checked,false);assert.equal(s.get('studentTermsReviewed').checked,false);
});
test('next-step guidance follows local progress without saving or advancing it',()=>{
 const s=setup();assert.equal(s.get('contributionNextTitle').textContent,'Choose one useful contribution');
 s.fields.title.value='Review a flow';s.fields.deliverable.value='Three observations';s.fields.status.value='awaiting_feedback';
 s.get('contributionForm').listeners.input({target:s.fields.status});
 assert.equal(s.get('contributionNextTitle').textContent,'Make feedback easy to give');
 const details={tagName:'DETAILS',open:false,parentElement:null};s.get('draftFeedbackRequest').parentElement=details;
 let focused=false;s.get('draftFeedbackRequest').focus=()=>focused=true;
 s.get('contributionNextAction').listeners.click();assert.equal(details.open,true);assert.equal(focused,true);
 assert.equal(s.fields.status.value,'awaiting_feedback');assert.equal(s.writes.length,0);assert.equal(s.get('contributionOutput').textContent,'');
});
test('completion guidance prioritizes results and explicit sharing over portfolio output',()=>{
 const base={title:'A task',deliverable:'Notes',status:'completed'};
 assert.equal(kit.nextAction(base).target,'contributionResult');
 assert.equal(kit.nextAction({...base,result:'Found confusing labels',permission:true}).target,'portfolioTerms');
 assert.equal(kit.nextAction({...base,result:'Found confusing labels',creditAgreement:'Public notes allowed',permission:false}).target,'portfolioTerms');
 assert.equal(kit.nextAction({...base,result:'Found confusing labels',creditAgreement:'Public notes allowed',permission:true}).target,'previewContribution');
 assert.equal(kit.nextAction({...base,status:'planning',agreementSnapshot:'Received proposal'}).target,'founderReturnInput');
});
test('backup restore is reviewed and explicit, preserves open edits and skips duplicate restores',()=>{
 const backup=require('../contribution-backup-kit.js'),s=setup();s.fields.title.value='My unsaved task';s.fields.deliverable.value='My current plan';
 s.get('notebookBackupInput').value=backup.pack([{title:'Restored <img src=x>',deliverable:'Notes',status:'completed',result:'Actual work',permission:true}]);
 s.get('restoreNotebookBackup').listeners.click();assert.equal(s.writes.length,0);
 s.get('reviewNotebookBackup').listeners.click();assert.equal(s.writes.length,0);assert.match(s.get('notebookBackupPreview').children[0].textContent,/<img src=x>/);assert.equal(s.get('notebookBackupPreview').children[0].children.length,0);
 s.get('restoreNotebookBackup').listeners.click();assert.equal(s.writes.length,0);
 s.get('notebookBackupAck').checked=true;s.get('restoreNotebookBackup').listeners.click();assert.equal(s.writes.length,1);const restored=JSON.parse(s.writes[0]);assert.equal(restored[0].permission,false);assert.equal(s.fields.title.value,'My unsaved task');
 s.get('reviewNotebookBackup').listeners.click();s.get('notebookBackupAck').checked=true;s.get('restoreNotebookBackup').listeners.click();assert.equal(s.writes.length,1);assert.match(s.get('notebookBackupStatus').textContent,/already exist/);
});
test('changed backups revoke review and failed restores leave records intact',()=>{
 const backup=require('../contribution-backup-kit.js'),s=setup({fail:true,saved:JSON.stringify([{id:'keep',title:'Existing',deliverable:'Notes',status:'planning'}])});
 s.get('notebookBackupInput').value=backup.pack([{title:'Incoming',deliverable:'More notes',status:'planning'}]);s.get('reviewNotebookBackup').listeners.click();s.get('notebookBackupAck').checked=true;s.get('notebookBackupInput').listeners.input();s.get('restoreNotebookBackup').listeners.click();assert.equal(s.get('notebookBackupAck').checked,false);assert.equal(s.writes.length,0);
 s.get('reviewNotebookBackup').listeners.click();s.get('notebookBackupAck').checked=true;s.get('restoreNotebookBackup').listeners.click();assert.match(s.get('notebookBackupStatus').textContent,/Unable to restore/);assert.equal(s.get('savedContributions').children.length,1);assert.match(s.get('savedContributions').children[0].textContent,/Existing/);
});
test('editing completed work clears permission before refreshing next-step guidance',()=>{
 const s=setup();s.fields.title.value='Task';s.fields.deliverable.value='Notes';s.fields.status.value='completed';s.fields.result.value='Actual result';s.fields.creditAgreement.value='Allowed summary';s.fields.permission.checked=true;s.get('contributionForm').listeners.input({target:s.fields.result});assert.equal(s.fields.permission.checked,false);assert.equal(s.get('contributionNextTitle').textContent,'Check what you may share');
});
test('a newly discovered task guides interest preparation before reviewing proposed terms',()=>{
 const r={title:'Task',project:'Project',deliverable:'Notes',status:'interest'};
 assert.equal(kit.nextAction(r).target,'contributionName');assert.equal(kit.nextAction({...r,interestName:'Contributor'}).target,'interestAvailability');
 assert.equal(kit.nextAction({...r,interestName:'Contributor',interestNote:'I can help',availability:'Friday'}).target,'interestSharePermission');
 assert.equal(kit.nextAction({...r,interestName:'Contributor',availability:'Friday'}).target,'interestContribution');
 assert.equal(kit.nextAction({...r,agreementSnapshot:'Received proposal'}).target,'founderReturnInput');
});

test('My next step resumes the matching contribution at a fresh next action without saving',()=>{
 const saved=JSON.stringify([{id:'first',title:'Another task',deliverable:'Notes',status:'planning'},{id:'chosen',title:'Fictional task',deliverable:'Three notes',status:'awaiting_feedback'}]);
 const s=setup({saved,resume:JSON.stringify({kind:'contribution',id:'chosen',target:'untrusted'})});
 assert.equal(s.fields.title.value,'Fictional task');assert.equal(s.fields.status.value,'awaiting_feedback');
 assert.equal(s.get('draftFeedbackRequest').focused,true);assert.equal(s.writes.length,0);assert.equal(s.fields.permission.checked,false);
 assert.match(s.get('contributionStatus').textContent,/Nothing has been changed or sent/);
 const missing=setup({saved,resume:JSON.stringify({kind:'contribution',id:'removed'})});assert.equal(missing.fields.title.value,'');assert.equal(missing.writes.length,0);assert.match(missing.get('contributionStatus').textContent,/unavailable/);
});
test('resuming saved proposed terms prepares the stored note for explicit review without accepting it',()=>{
 const saved=JSON.stringify([{id:'chosen',title:'Review a task',project:'Fictional project',interestName:'Student',deliverable:'Notes',status:'planning',agreementSnapshot:JSON.stringify(founderPacket())}]);
 const s=setup({saved,resume:JSON.stringify({kind:'contribution',id:'chosen'})});
 assert.equal(s.get('founderReturnInput').value,JSON.stringify(founderPacket()));assert.equal(s.get('previewFounderReturn').focused,true);
 assert.equal(s.get('founderReturnAck').checked,false);assert.equal(s.get('studentTermsReviewed').checked,false);assert.equal(s.fields.status.value,'planning');assert.equal(s.writes.length,0);
});

test('explicit waiting stages save and reopen unchanged without claiming completed work',()=>{
 for(const status of ['interest_shared','work_delivered']){
  const s=setup();s.fields.title.value='Fictional task';s.fields.deliverable.value='Notes';s.fields.status.value=status;
  s.get('contributionForm').listeners.input({target:s.fields.status});assert.equal(s.writes.length,0);s.submit();
  const saved=JSON.parse(s.writes[0]);assert.equal(saved[0].status,status);
  const reopened=setup({saved:s.writes[0]});reopened.get('savedContributions').children[0].listeners.click();
  assert.equal(reopened.fields.status.value,status);assert.match(reopened.get('contributionNextTitle').textContent,/Waiting/);assert.equal(reopened.fields.permission.checked,false);
 }
});

test('delivered work opens its saved feedback for review and preserves a newly pasted reply',()=>{
 const who={title:'Review a task',project:'Fictional project',interestName:'Alex'};
 const raw=JSON.stringify(require('../founder-return-kit.js').feedbackPacket(who,{observed:'Reviewed notes',strengths:'Clear steps',nextStep:'Add expected behavior',creditName:'Alex',portfolioUse:'Anonymized notes only',reviewed:true,creditAgreed:true}));
 const saved=JSON.stringify([{id:'chosen',...who,deliverable:'Notes',status:'work_delivered',result:'My own result',feedbackSnapshot:raw}]);
 const s=setup({saved});s.get('savedContributions').children[0].listeners.click();s.get('contributionNextAction').listeners.click();
 assert.equal(s.get('founderReturnInput').value,raw);assert.equal(s.get('previewFounderReturn').focused,true);assert.equal(s.fields.status.value,'work_delivered');
 assert.equal(s.get('founderReturnAck').checked,false);assert.equal(s.fields.permission.checked,false);assert.equal(s.fields.result.value,'My own result');assert.equal(s.writes.length,0);
 s.get('founderReturnInput').value='A newly pasted reply';s.get('contributionNextAction').listeners.click();assert.equal(s.get('founderReturnInput').value,'A newly pasted reply');
});

test('malformed saved notebook records remain untouched while valid records can be opened',()=>{
 const saved=JSON.stringify([{id:'bad',title:{unexpected:true},deliverable:'Notes'},{id:'good',title:'Fictional task',deliverable:'Notes',status:'work_delivered'}]);
 const s=setup({saved,resume:JSON.stringify({kind:'contribution',id:'good'})});assert.equal(s.fields.title.value,'Fictional task');
 assert.match(s.get('contributionStorageNotice').textContent,/recovery/);assert.equal(s.get('savedContributions').children.length,1);
 s.get('prepareNotebookBackup').listeners.click();assert.match(s.get('notebookBackupStatus').textContent,/not a complete backup/);assert.equal(JSON.parse(s.get('notebookBackupOutput').value).records.length,1);
 s.submit();assert.equal(s.writes.length,0);s.get('removeContribution').listeners.click();assert.equal(s.writes.length,0);
 s.get('notebookBackupInput').value=require('../contribution-backup-kit.js').pack([{title:'New task',deliverable:'Notes',status:'planning'}]);s.get('reviewNotebookBackup').listeners.click();s.get('notebookBackupAck').checked=true;s.get('restoreNotebookBackup').listeners.click();assert.equal(s.writes.length,0);assert.match(s.get('notebookBackupStatus').textContent,/recovery/);
});

test('stale notebook tabs preserve newer work during save, removal, restore and undo',()=>{
 const original=[{id:'c',title:'Original task',deliverable:'Notes',status:'planning'}];
 const newer=JSON.stringify([{...original[0],title:'Newer task'}]);
 for(const action of ['save','remove','restore']){
  const s=setup({saved:JSON.stringify(original)});s.get('savedContributions').children[0].listeners.click();s.fields.result.value='My open reflection';s.external(newer);
  if(action==='save')s.submit();
  if(action==='remove')s.get('removeContribution').listeners.click();
  if(action==='restore'){
   s.get('notebookBackupInput').value=require('../contribution-backup-kit.js').pack([{title:'Incoming',deliverable:'Notes',status:'planning'}]);s.get('reviewNotebookBackup').listeners.click();s.get('notebookBackupAck').checked=true;s.get('restoreNotebookBackup').listeners.click();
  }
  assert.equal(s.stored(),newer);assert.equal(s.writes.length,0);assert.equal(s.fields.result.value,'My open reflection');assert.match(s.get('contributionStorageNotice').textContent,/another tab/);
 }
 const s=setup({saved:JSON.stringify(original)});s.get('savedContributions').children[0].listeners.click();s.get('removeContribution').listeners.click();s.external(newer);s.get('undoContribution').listeners.click();assert.equal(s.stored(),newer);assert.equal(s.writes.length,1);
});

test('preparing interest guides a missing project name before the sharing step',()=>{
 const s=setup();s.fields.title.value='A small task';s.fields.deliverable.value='Three notes';s.fields.interestName.value='Alex';s.fields.interestNote.value='I can review';s.fields.availability.value='Friday';s.fields.status.value='interest';
 s.get('contributionForm').listeners.input({target:s.fields.status});assert.equal(s.get('contributionNextAction').textContent,'Add the project name');
 s.get('contributionNextAction').listeners.click();assert.equal(s.get('contributionProject').focused,true);assert.equal(s.fields.status.value,'interest');assert.equal(s.writes.length,0);
 s.fields.project.value='A permitted project';s.get('contributionForm').listeners.input({target:s.fields.project});assert.equal(s.get('contributionNextAction').textContent,'Review and copy my interest');
});

test('check-in controls appear only while waiting and drafts preserve notes, permissions and progress',()=>{
 const s=setup();assert.equal(s.get('waitingCheckInActions').hidden,true);s.fields.title.value='Fictional task';s.fields.deliverable.value='Notes';s.fields.result.value='My result';
 for(const status of ['interest_shared','work_delivered']){
  s.fields.status.value=status;s.get('contributionForm').listeners.input({target:s.fields.status});assert.equal(s.get('waitingCheckInActions').hidden,false);
  s.get('previewWaitingCheckIn').listeners.click();assert.match(s.get('contributionOutput').textContent,/not sent/);assert.equal(s.fields.status.value,status);assert.equal(s.fields.result.value,'My result');assert.equal(s.fields.permission.checked,false);assert.equal(s.writes.length,0);
 }
 s.fields.status.value='completed';s.get('contributionForm').listeners.input({target:s.fields.status});assert.equal(s.get('waitingCheckInActions').hidden,true);s.get('previewWaitingCheckIn').listeners.click();assert.equal(s.get('contributionOutput').textContent,'');assert.equal(s.writes.length,0);
});

test('opening completed work focuses its portfolio review without generating or saving a summary',()=>{
 const saved=JSON.stringify([{id:'done',title:'Fictional task',project:'Fictional project',deliverable:'Notes',status:'completed',result:'Actual result',creditAgreement:'Agreed public notes',permission:true}]);
 const s=setup({saved,resume:JSON.stringify({kind:'contribution',id:'done'})});assert.equal(s.get('previewContribution').focused,true);assert.equal(s.get('contributionOutput').textContent,'');assert.equal(s.fields.status.value,'completed');assert.equal(s.writes.length,0);
});
