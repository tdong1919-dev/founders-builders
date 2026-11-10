const {test}=require('node:test'),assert=require('node:assert/strict');
const contributions=require('../contribution-kit.js'),reviews=require('../interest-review-kit.js'),board=require('../next-step-kit.js');
const cb=require('../contribution-backup-kit.js'),rb=require('../review-backup-kit.js');
const interest={title:'Fictional task',project:'Fictional project',deliverable:'Notes',interestName:'Alex',interestNote:'I can help',availability:'Friday'};
test('waiting cards show one useful follow-up rather than repeating the action already recorded',()=>{
 const cs=['interest_shared','work_delivered'].map((status,i)=>({...interest,id:'c'+i,status}));
 const rs=['terms_proposed','feedback_shared'].map((phase,i)=>({id:'r'+i,interest,review:{phase}}));
 const before=JSON.stringify([cs,rs]),items=board.items(cs,rs,false);
 assert.equal(items.length,4);assert.ok(items.every(item=>!item.closed));
 assert.deepEqual(items.map(item=>item.action.target),['reviewReply','founderReturnInput','contributionNextStep','reviewAgreement']);
 assert.match(items[0].action.title,/close the loop/);assert.ok(items.slice(1).every(item=>item.action.waiting));
 assert.doesNotMatch(items.map(item=>item.action.button).join(' '),/copy|share|download/i);
 assert.equal(JSON.stringify([cs,rs]),before);
});
test('new stages survive backup and board loading without transferring confirmation or permission',()=>{
 for(const status of ['interest_shared','work_delivered']){
  const saved={...interest,id:'c',status,permission:true};
  assert.equal(contributions.normalize(saved).status,status);
  const restored=cb.unpack(cb.pack([saved]))[0];assert.equal(restored.status,status);assert.equal(restored.permission,false);
  assert.equal(board.load(JSON.stringify([saved]),'contribution').records[0].status,status);
  assert.throws(()=>contributions.summary({...saved,result:'An actual result',creditAgreement:'Agreed notes'}),/completed/);
 }
 for(const phase of ['terms_proposed','feedback_shared']){
  const saved={id:'r',interest,review:{phase,confirmed:true,reviewed:true,creditAgreed:true}};
  const restored=rb.unpack(rb.pack([saved]))[0];assert.equal(restored.review.phase,phase);
  for(const key of ['confirmed','reviewed','creditAgreed'])assert.equal(restored.review[key],false);
  assert.equal(board.load(JSON.stringify([saved]),'review').records[0].review.phase,phase);
 }
});
test('founder filters expose both waiting phases while keeping them open until explicitly closed',()=>{
 const records=['terms_proposed','feedback_shared','closed'].map((phase,i)=>({id:String(i),interest,review:{phase}}));
 assert.equal(reviews.filterReviews(records,'','open').length,2);
 for(const phase of ['terms_proposed','feedback_shared']){
  assert.equal(reviews.filterReviews(records,'Alex',phase).length,1);
  assert.notEqual(reviews.phaseLabel(phase),'Reviewing');
 }
});
