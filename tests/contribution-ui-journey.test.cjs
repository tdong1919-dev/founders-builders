const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const contribution=require('../contribution-kit.js');
const reviews=require('../interest-review-kit.js');
const returns=require('../founder-return-kit.js');

// Executes both real page controllers through their button/form handlers. This
// checks UI wiring without claiming layout, clipboard permission, or Google QA.
function page(founder=false,failSave=false){
  class Element{
    constructor(){this.listeners={};this.value='';this.checked=false;this.children=[];this.textContent='';this.type='text';}
    addEventListener(k,fn){this.listeners[k]=fn;}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(){this.children=[];}
    setAttribute(){} focus(){}
  }
  const events={};
  const nodes={},get=id=>nodes[id]||(nodes[id]=new Element()),fields={},saved=[];
  const values=founder?reviews.normalize({}):contribution.normalize({});
  for(const [name,value] of Object.entries(values)){
    const field=fields[name]=new Element();field.name=name;
    if(typeof value==='boolean')field.type='checkbox';else field.value=value;
  }
  if(!founder)fields.permission=get('contributionPermission');
  const form=get(founder?'interestReviewForm':'contributionForm');
  form.elements={namedItem:name=>fields[name]};form.reportValidity=()=>true;
  form.reset=()=>Object.values(fields).forEach(f=>{f.value='';f.checked=false;});
  class FormData{forEach(fn){Object.entries(fields).forEach(([k,f])=>fn(f.value,k));}}
  const window={FBContributionKit:contribution,FBInterestReviewKit:reviews,FBFounderReturnKit:returns,
    FBContributionBackupKit:require('../contribution-backup-kit.js'),FBReviewBackupKit:require('../review-backup-kit.js'),
    location:{search:''},confirm:()=>false,addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(fs.readFileSync(require.resolve('../draft-guard.js'),'utf8'),{window});
  vm.runInNewContext(fs.readFileSync(require.resolve(founder?'../interest-review.js':'../contribution-notebook.js'),'utf8'),{
    window,document:{getElementById:get,createElement:()=>new Element()},FormData,URLSearchParams,
    localStorage:{getItem:()=>null,setItem:(key,value)=>{if(failSave)throw Error('Storage full');saved.push(JSON.parse(value));}},navigator:{},
    fetch:()=>{throw Error('Journey must not make network requests');}
  });
  return {get,fields,saved,warns:()=>{let prevented=false;events.beforeunload({preventDefault(){prevented=true;}});return prevented;},click:id=>get(id).listeners.click(),
    edit:(key,value)=>{fields[key].value=value;form.listeners.input({target:fields[key]});},
    submit:()=>form.listeners.submit({preventDefault(){}})};
}

test('both UI controllers carry one fictional contribution through proposal, feedback and permitted credit',()=>{
  const builder=page(),founder=page(true);
  assert.equal(builder.warns(),false);assert.equal(founder.warns(),false);
  for(const [key,value] of Object.entries({title:'Review one sample screen',project:'Fictional project',deliverable:'Three usability notes',
    interestName:'Alex',interestNote:'I can test the sample and want to practice clear feedback',availability:'One hour Friday',status:'interest'}))builder.edit(key,value);
  assert.match(builder.get('contributionNextTitle').textContent,/Share your interest/);
  builder.click('previewInterestPacket');assert.equal(builder.get('contributionOutput').textContent,'');
  builder.get('interestSharePermission').checked=true;builder.click('previewInterestPacket');
  const interest=builder.get('contributionOutput').textContent;
  founder.get('interestPacketInput').value=interest;founder.click('loadInterestPacket');
  assert.match(founder.get('reviewIdentity').textContent,/Alex/);
  const terms={deliverable:'Three usability notes',acceptance:'Reproducible observations reviewed together',exclusions:'No production changes',
    minutes:'60',compensation:'Paid',terms:'A fixed fee agreed directly',support:'A sample and check-in',reviewer:'Owner',
    feedbackTiming:'Within three days',creditTerms:'Anonymized notes with chosen credit name',ownership:'Founder owns sample; contributor may show agreed notes'};
  for(const [key,value] of Object.entries(terms))founder.edit(key,value);
  founder.click('previewAgreementReturn');
  builder.get('founderReturnInput').value=founder.get('interestReviewOutput').textContent;
  builder.click('previewFounderReturn');builder.get('founderReturnAck').checked=true;builder.click('applyFounderReturn');
  assert.equal(builder.fields.status.value,'planning');
  builder.get('studentTermsReviewed').checked=true;builder.click('draftStudentConfirmation');
  assert.match(builder.get('contributionOutput').textContent,/not sent or signed/);
  builder.edit('status','awaiting_feedback');builder.edit('result','Identified three confusing labels in the sample');
  builder.click('draftFeedbackRequest');assert.match(builder.get('contributionOutput').textContent,/What was useful/);
  for(const [key,value] of Object.entries({observed:'Three notes reviewed together',strengths:'Clear reproduction steps',nextStep:'Include expected behavior',
    creditName:'Alex',portfolioUse:'Anonymized notes only',reviewer:'Owner'}))founder.edit(key,value);
  founder.click('previewFeedbackReturn');assert.equal(founder.get('interestReviewOutput').textContent,'');
  founder.fields.reviewed.checked=true;founder.fields.creditAgreed.checked=true;founder.click('previewFeedbackReturn');
  builder.get('founderReturnInput').value=founder.get('interestReviewOutput').textContent;
  builder.click('previewFounderReturn');builder.get('founderReturnAck').checked=true;builder.click('applyFounderReturn');
  assert.equal(builder.fields.result.value,'Identified three confusing labels in the sample');
  assert.equal(builder.fields.status.value,'awaiting_feedback');assert.equal(builder.fields.permission.checked,false);
  builder.click('previewContribution');assert.equal(builder.get('contributionOutput').textContent,'');
  builder.edit('status','completed');builder.click('previewContribution');assert.equal(builder.get('contributionOutput').textContent,'');
  builder.get('contributionPermission').checked=true;builder.click('previewContribution');
  assert.match(builder.get('contributionOutput').textContent,/Anonymized notes only/);
  assert.match(builder.get('contributionOutput').textContent,/Self-reported/);
  assert.equal(builder.saved.length,0);assert.equal(founder.saved.length,0);
  assert.equal(builder.warns(),true);assert.equal(founder.warns(),true);
  builder.submit();founder.submit();assert.equal(builder.saved.length,1);assert.equal(founder.saved.length,1);
  assert.equal(builder.warns(),false);assert.equal(founder.warns(),false);
});

test('failed notebook or founder saves keep unsaved-work protection active',()=>{
 for(const founder of [false,true]){
  const p=page(founder,true);
  if(founder){
   p.get('interestPacketInput').value=JSON.stringify(reviews.interestPacket({title:'Fictional task',project:'Fictional project',deliverable:'Notes',interestName:'Alex',interestNote:'I can review',availability:'Friday'},true));
   p.click('loadInterestPacket');
  }else{p.edit('title','Fictional task');p.edit('deliverable','Notes');}
  p.submit();assert.equal(p.warns(),true);assert.equal(p.saved.length,0);
 }
});
