const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const offers=require('../task-offer-kit.js'),journey=require('../task-journey-kit.js'),reviews=require('../interest-review-kit.js'),returns=require('../founder-return-kit.js'),contributions=require('../contribution-kit.js');
test('public discovery fixture through interest, proposed terms, reviewed feedback and permitted portfolio credit',()=>{
 const task={title:'Review a sign-up screen',project:'Fictional practice project',outcome:'Clarify the first step',deliverable:'Three usability observations',acceptance:'Reproducible notes reviewed together',outside:'No production edits or private data',skill:'Testing',experience:'Basic web navigation',minutes:60,support:'Sample screen and a short check-in',reviewer:'Project owner',feedbackTiming:'Within three days',compensation:'Paid',terms:'A fixed fee agreed directly before starting',creditPolicy:'Chosen credit name; anonymized notes only',publicReady:true};
 const listing=offers.publicDraft(task);const nodes={},location={search:'?scope=small',href:''};let handoff;
 class E{constructor(tag){this.tag=tag;this.value='';this.children=[];this.listeners={};}append(...xs){this.children.push(...xs);}replaceChildren(){this.children=[];}addEventListener(k,f){this.listeners[k]=f;}}
 const get=id=>nodes[id]||(nodes[id]=new E('div'));
 vm.runInNewContext(fs.readFileSync(require.resolve('../projects.js'),'utf8'),{URLSearchParams,window:{location,FBTaskJourneyKit:journey,FBTaskOfferKit:offers,FBPlatform:{fetchType:(type,cb)=>cb(null,[{...listing,status:'approved',email:'fixture-owner@example.com'}],false)}},document:{getElementById:get,createElement:tag=>new E(tag)},sessionStorage:{setItem:(k,v)=>handoff=v}});
 assert.equal(get('projectCards').children.length,1);get('projectCards').children[0].children.find(e=>e.tag==='button').listeners.click();assert.match(location.href,/founder-task=1/);assert.doesNotMatch(handoff,/fixture-owner@example.com/);
 let plan={...journey.unpack(handoff),interestName:'Fictional contributor',interestNote:'I can review the sample and want to practice testing',availability:'One hour on Friday',questions:'Which screen is ready?'};
 assert.throws(()=>reviews.interestPacket(plan,false),/permission/);const interest=reviews.parseInterest(JSON.stringify(reviews.interestPacket(plan,true)));
 assert.match(reviews.response(interest,{response:'Could you review the sample on Friday?'}),/not confirmed/);
 const terms={...reviews.scopeTemplate(interest),ownership:'Founder retains sample; contributor may show anonymized observations'};
 const rawAgreement=JSON.stringify(returns.agreementPacket(interest,terms));assert.throws(()=>returns.apply(rawAgreement,plan,false),/Review the note/);
 plan=returns.apply(rawAgreement,plan,true);assert.equal(plan.status,'planning');assert.equal(plan.permission,false);assert.match(returns.confirmation(rawAgreement,plan,true,''),/not sent or signed/);
 plan={...plan,status:'awaiting_feedback',result:'Documented three confusing labels in the sample',feedback:'My reflection: next time include expected behavior'};
 assert.match(contributions.feedbackRequest(plan),/What was useful/);
 const feedback={observed:'Three observations reviewed together',strengths:'Specific reproduction steps',nextStep:'Include expected behavior next time',creditName:plan.interestName,portfolioUse:'Anonymized observations only; no private screen',reviewer:'Project owner',reviewed:true,creditAgreed:true};
 assert.throws(()=>returns.feedbackPacket(interest,{...feedback,creditAgreed:false}));const rawFeedback=JSON.stringify(returns.feedbackPacket(interest,feedback));
 const ownResult=plan.result,ownFeedback=plan.feedback;plan=returns.apply(rawFeedback,plan,true);assert.equal(plan.result,ownResult);assert.equal(plan.feedback,ownFeedback);assert.equal(plan.status,'awaiting_feedback');assert.throws(()=>contributions.summary({...plan,permission:true}),/completed/);
 plan.status='completed';assert.throws(()=>contributions.summary(plan),/permission/);plan.permission=true;const portfolio=contributions.summary(plan);
 assert.match(portfolio,/Documented three confusing labels/);assert.match(portfolio,/Anonymized observations only/);assert.match(portfolio,/sender and work unverified/);assert.match(portfolio,/Self-reported/);assert.doesNotMatch(portfolio,/fixture-owner@example.com/);
});
