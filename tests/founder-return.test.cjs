const {test}=require('node:test');const assert=require('node:assert/strict');const api=require('../founder-return-kit.js'),contributions=require('../contribution-kit.js');
const person={title:'Review a screen',project:'A fictional project',interestName:'Chosen student'};
const record={...person,deliverable:'Three notes',status:'interest',result:'',feedback:'My own notes',permission:true};
const terms={deliverable:'Three reviewed notes',acceptance:'Clear steps',exclusions:'No production changes',minutes:'60',compensation:'Paid',terms:'Agree a fixed fee',support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',creditTerms:'Agree chosen credit',ownership:'Agree license directly'};
const feedback={observed:'Three sample notes',strengths:'Clear steps',nextStep:'Add expected behavior',creditName:'Chosen credit',portfolioUse:'May show anonymized notes',reviewer:'Owner',reviewed:true,creditAgreed:true};
test('agreement returns contain only proposed terms and recipient identity, never private review details or confirmations',()=>{
 const packet=api.agreementPacket({...person,availability:'PRIVATE'},{...terms,response:'PRIVATE RESPONSE',observed:'PRIVATE FEEDBACK',confirmed:true});const raw=JSON.stringify(packet);assert.doesNotMatch(raw,/PRIVATE|confirmed|permission/);const note=api.parse(raw,record);assert.equal(note.kind,'agreement');assert.match(note.text,/proposal|Proposed/);
});
test('returns reject malformed formats, oversized and wrongly typed fields and mismatched task, project or recipient',()=>{
 const packet=api.agreementPacket(person,terms);for(const raw of ['invalid','{}','x'.repeat(18001),JSON.stringify({...packet,terms:{...terms,minutes:60}})])assert.throws(()=>api.parse(raw,record));
 for(const patch of [{title:'Other task'},{project:'Other project'},{interestName:'Another person'},{interestName:''}])assert.throws(()=>api.parse(JSON.stringify(packet),{...record,...patch}));
});
test('adding a reviewed proposal requires acknowledgment and resets unfinished work to planning without saving or granting permission',()=>{
 const raw=JSON.stringify(api.agreementPacket(person,terms));assert.throws(()=>api.apply(raw,record,false));const r=api.apply(raw,{...record,status:'agreed'},true);assert.equal(r.status,'planning');assert.equal(r.deliverable,terms.deliverable);assert.equal(r.permission,false);assert.equal(r.feedback,'My own notes');assert.equal(JSON.parse(r.agreementSnapshot).format,'fb-founder-agreement-v1');assert.throws(()=>api.apply(raw,{...record,status:'completed'},true));
});
test('confirmation requires explicit student review and resolved compensation but never marks terms signed or sends a message',()=>{
 const raw=JSON.stringify(api.agreementPacket(person,terms));assert.throws(()=>api.confirmation(raw,record,false));assert.match(api.confirmation(raw,record,true),/not sent or signed/);const unresolved=JSON.stringify(api.agreementPacket(person,{...terms,compensation:'Discuss before starting'}));assert.throws(()=>api.confirmation(unresolved,record,true),/Resolve compensation/);assert.match(api.confirmation(unresolved,record,false,'What is the payment arrangement?'),/What is the payment arrangement/);
});
test('founder feedback export requires reviewed work and agreed sharing, strips unrelated review fields',()=>{
 assert.throws(()=>api.feedbackPacket(person,{...feedback,reviewed:false}));assert.throws(()=>api.feedbackPacket(person,{...feedback,creditAgreed:false}));const p=api.feedbackPacket(person,{...feedback,response:'PRIVATE',confirmed:true});assert.doesNotMatch(JSON.stringify(p),/PRIVATE|confirmed|creditAgreed/);assert.match(api.parse(JSON.stringify(p),record).text,/unverified/);
});
test('received feedback preserves personal notes, result and progress and never grants portfolio permission',()=>{
 const r=api.apply(JSON.stringify(api.feedbackPacket(person,feedback)),{...record,result:'My actual result',status:'awaiting_feedback'},true);assert.equal(r.result,'My actual result');assert.equal(r.feedback,'My own notes');assert.equal(r.status,'awaiting_feedback');assert.equal(r.permission,false);assert.equal(r.creditAgreement,feedback.portfolioUse);assert.ok(r.feedbackSnapshot);
});
test('portfolio includes received notes only after completion, actual result and separate permission and still identifies unverified source',()=>{
 const r=api.apply(JSON.stringify(api.feedbackPacket(person,feedback)),record,true);assert.throws(()=>contributions.summary(r));const complete={...r,result:'My actual work',status:'completed',permission:true};const text=contributions.summary(complete);assert.match(text,/Received feedback · sender and work unverified/);assert.match(text,/My actual work/);assert.throws(()=>contributions.summary({...complete,interestName:'Someone else'}));
});
