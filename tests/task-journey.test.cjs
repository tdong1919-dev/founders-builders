const {test}=require('node:test');const assert=require('node:assert/strict');const offers=require('../task-offer-kit.js'),journey=require('../task-journey-kit.js'),contributions=require('../contribution-kit.js');
const task={title:'Review a screen',project:'Fictional practice project',outcome:'Make one page clearer',deliverable:'Three notes',acceptance:'Reproducible observations reviewed together',outside:'No code changes',skill:'Testing',experience:'Basic web navigation',minutes:60,support:'Sample screen and check-in',reviewer:'Project owner',feedbackTiming:'Within three days',compensation:'Paid',terms:'Agree a fixed fee before starting',creditPolicy:'Agree chosen credit and portfolio permission'};
test('published founder brief round-trips into small-task discovery with multiline scope intact',()=>{
 const original={...task,deliverable:'Three notes\nInclude screenshots'};const parsed=journey.parseListing({title:original.title,description:offers.brief(original)});assert.ok(parsed);for(const k of Object.keys(task))assert.equal(parsed[k],original[k],k);
});
test('ordinary, partial and duplicate-label listings are not promoted as scoped founder tasks',()=>{
 for(const description of ['An ordinary collaboration', 'Small contribution · Try something\nProject: Test',offers.brief(task).replace('Done means:','Deliverable:')])assert.equal(journey.parseListing({title:'Test',description}),null);
});
test('interest handoff excludes founder feedback and always starts uncompleted with no sharing permission',()=>{
 const pack=journey.pack({...task,contributor:'PRIVATE PERSON',observed:'PRIVATE FEEDBACK',reviewed:true,creditAgreed:true},'public');const raw=JSON.stringify(pack);assert.doesNotMatch(raw,/PRIVATE/);const r=journey.unpack(raw);assert.equal(r.status,'interest');assert.equal(r.permission,false);assert.equal(r.result,'');assert.match(r.scope,/public listing · unverified/);assert.match(r.nextStep,/60-minute/);assert.throws(()=>contributions.summary({...r,permission:true}));
});
test('local founder previews remain distinct from public listings and malformed drafts fail closed',()=>{
 assert.match(journey.unpack(JSON.stringify(journey.pack(task,'local-draft'))).scope,/not published/);
 for(const raw of ['bad json','{}',JSON.stringify({format:'fb-task-interest-v1',source:'verified',task}),JSON.stringify({format:'fb-task-interest-v1',source:'public',task:{...task,minutes:999}}),'x'.repeat(20001)])assert.throws(()=>journey.unpack(raw));
});
test('local progress and feedback never imply verified founder approval or completion',()=>{
 for(const status of ['interest','agreed','in_progress','awaiting_feedback']){assert.equal(contributions.normalize({...task,status}).status,status);assert.throws(()=>contributions.summary({...task,status,result:'Some notes',permission:true}));}
 assert.match(contributions.statusLabel('interest'),/not sent/);const summary=contributions.summary({...task,status:'completed',result:'Documented issues',feedback:'Owner asked for clearer reproduction steps',creditAgreement:'Agreed to show the notes',permission:true});assert.match(summary,/Feedback notes \(recorded by contributor\)/);assert.match(summary,/not independently verified/);
});
test('feedback request seeks review and agreed portfolio use without inventing a founder response',()=>{
 const text=contributions.feedbackRequest({...task,collaborator:'Owner'});assert.match(text,/Could we review/);assert.match(text,/which project details or examples I may show/);assert.doesNotMatch(text,/approved your work|has endorsed|verified/);assert.throws(()=>contributions.feedbackRequest({title:'Missing deliverable'}));
});
