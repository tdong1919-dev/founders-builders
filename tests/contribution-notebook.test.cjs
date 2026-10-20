const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const kit=require('../contribution-kit.js');
function setup({fail=false,saved='[]',incoming=null}={}){
 const elements={},writes=[];class E{constructor(){this.listeners={};this.children=[];this.value='';this.checked=false;this.type='text';this.textContent='';}addEventListener(k,f){this.listeners[k]=f;}append(...xs){this.children.push(...xs);}replaceChildren(){this.children=[];}setAttribute(){}focus(){}}
 const get=id=>elements[id]||(elements[id]=new E());const form=get('contributionForm');form.reportValidity=()=>true;
 const fields={};['title','project','skill','deliverable','collaborator','nextStep','result','evidence','credit','scope','feedback','creditAgreement','interestName','interestNote','availability','questions','agreementSnapshot','feedbackSnapshot','agreementQuestions','status','permission'].forEach(k=>fields[k]=new E());fields.permission=get('contributionPermission');fields.permission.type='checkbox';form.elements={namedItem:k=>fields[k]};form.reset=()=>Object.values(fields).forEach(f=>{f.value='';f.checked=false;});get('starterTime').value='60';
 class FormData{forEach(fn){Object.entries(fields).forEach(([k,e])=>fn(e.value,k));}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../contribution-notebook.js'),'utf8'),{URLSearchParams,window:{FBContributionKit:kit,FBFounderReturnKit:require('../founder-return-kit.js'),FBTaskJourneyKit:require('../task-journey-kit.js'),location:{search:incoming?'?founder-task=1':''},confirm:()=>false},document:{getElementById:get,createElement:()=>new E()},sessionStorage:{getItem:()=>incoming,removeItem(){}},localStorage:{getItem:()=>saved,setItem:(k,v)=>{if(fail)throw Error('full');writes.push(v);}},FormData,navigator:{},Date,Math});
 return {get,fields,writes,submit:()=>form.listeners.submit({preventDefault(){}})};
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
