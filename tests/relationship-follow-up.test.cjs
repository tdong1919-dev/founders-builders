const {test}=require('node:test'),assert=require('node:assert/strict');
const contributions=require('../contribution-kit.js'),reviews=require('../interest-review-kit.js');
const task={title:'Review one screen',project:'Fictional project',deliverable:'Three notes',collaborator:'Alex',result:'PRIVATE RESULT',scope:'PRIVATE SCOPE',feedback:'PRIVATE FEEDBACK',creditAgreement:'PRIVATE TERMS',permission:true};
test('waiting-stage check-ins are minimal drafts and do not invent delivery, deadlines or outcomes',()=>{
 for(const status of ['interest_shared','work_delivered']){
  const input={...task,status},before=JSON.stringify(input),text=contributions.checkIn(input);
  assert.match(text,/not sent/);assert.match(text,/Review one screen/);assert.match(text,/share|sharing/);assert.doesNotMatch(text,/PRIVATE|overdue|automatically sent|guaranteed/);assert.equal(JSON.stringify(input),before);
 }
 assert.match(contributions.checkIn({...task,status:'interest_shared'}),/useful next step/);
 assert.match(contributions.checkIn({...task,status:'work_delivered'}),/feedback check-in/);
 for(const status of ['planning','interest','agreed','in_progress','completed'])assert.throws(()=>contributions.checkIn({...task,status}));
});
test('closing drafts remain a conversation rather than completion, credit permission or an endorsement',()=>{
 const interest={title:task.title,project:task.project,interestName:'Alex'};
 const review={phase:'feedback_shared',response:'PRIVATE RESPONSE',observed:'PRIVATE WORK',portfolioUse:'PRIVATE TERMS',confirmed:false,reviewed:false,creditAgreed:false};
 const before=JSON.stringify(review),text=reviews.closingReply(interest,review);
 assert.match(text,/not sent/);assert.match(text,/staying in touch/);assert.match(text,/does not close/);assert.doesNotMatch(text,/PRIVATE/);assert.equal(JSON.stringify(review),before);
 assert.throws(()=>reviews.closingReply(interest,{phase:'feedback'}));assert.throws(()=>reviews.closingReply(interest,{phase:'closed'}));
});
