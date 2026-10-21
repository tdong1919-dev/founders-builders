const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const files=require('../handoff-files.js'),reviews=require('../interest-review-kit.js'),returns=require('../founder-return-kit.js');
const who={title:'Review a sample',project:'Fictional project',interestName:'Alex'};
const interest=JSON.stringify(reviews.interestPacket({...who,deliverable:'Three notes',interestNote:'I can help with testing',availability:'Friday'},true));
const terms={deliverable:'Three notes',acceptance:'Review together',exclusions:'No production changes',minutes:'60',compensation:'Paid',terms:'Fixed fee agreed directly',support:'A check-in',reviewer:'Owner',feedbackTiming:'Within three days',creditTerms:'Anonymized notes only',ownership:'Founder owns sample'};
const agreement=JSON.stringify(returns.agreementPacket(who,terms));
const feedback=JSON.stringify(returns.feedbackPacket(who,{observed:'Three reviewed notes',strengths:'Clear steps',nextStep:'Add expected behavior',creditName:'Alex',portfolioUse:'Anonymized notes only',reviewed:true,creditAgreed:true}));
function file(text,name='note.json'){return {name,size:Buffer.byteLength(text),text:async()=>text};}
test('all three file types round-trip through existing validators and exclude undeclared private fields',async()=>{
 const raw=JSON.parse(interest);raw.privateHistory='PRIVATE';raw.interest.result='PRIVATE';
 const checked=await files.read(file('\uFEFF'+JSON.stringify(raw)),'interest');assert.doesNotMatch(checked,/PRIVATE/);
 assert.equal(reviews.parseInterest(checked).interestName,'Alex');
 for(const [raw,kind] of [[agreement,'agreement'],[feedback,'feedback']]){
  const checked=await files.read(file(raw),'return',who);assert.equal(returns.parse(checked,who).kind,kind);
 }
});
test('malformed, oversized, unsupported, unreadable and wrong-recipient files fail without accepting content',async()=>{
 let touched=false;
 await assert.rejects(()=>files.read({name:'x.json',size:88001,text:async()=>{touched=true;return interest;}},'interest'));assert.equal(touched,false);
 for(const bad of [file('bad'),file('{}'),file(interest,'note.html'),file(JSON.stringify({format:'fb-notebook-backup-v1'})),file('x'.repeat(22001)),{name:'x.json',size:10,text:async()=>{throw Error('PRIVATE path');}}])await assert.rejects(()=>files.read(bad,'interest'));
 await assert.rejects(()=>files.read(file(agreement),'return',{...who,interestName:'Someone else'}),/must match/);
 assert.throws(()=>files.prepare(interest,'__proto__'),/Unsupported/);
 await assert.rejects(()=>files.read({name:'x.json',size:1,text:async()=>{throw Error('PRIVATE path');}},'interest'),error=>!error.message.includes('PRIVATE'));
});
function importer({kind='interest',record}={}){
 const input={files:[],value:'',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}},textarea={value:'Previous note',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}},status={textContent:''};let invalidated=0;
 files.bindImport({input,textarea,status,kind,record,onChange:()=>invalidated++});
 return {input,textarea,status,invalidated:()=>invalidated,choose:f=>{input.files=[f];return input.listeners.change();}};
}
test('imports stage checked text for separate review, revoke stale acknowledgments and preserve input on failure',async()=>{
 const p=importer();await p.choose(file(interest));assert.match(p.status.textContent,/Open interest for review/);assert.equal(p.invalidated(),2);assert.equal(JSON.parse(p.textarea.value).format,'fb-student-interest-v1');assert.equal(p.input.value,'');
 const prior=p.textarea.value;await p.choose(file('bad'));assert.equal(p.textarea.value,prior);
 const q=importer({kind:'return',record:()=>who});await q.choose(file(agreement));assert.match(q.status.textContent,/Nothing is accepted or saved/);
});
test('late reads cannot replace newer choices, manually edited text, or a changed notebook record',async()=>{
 let resolve;const delayed={name:'note.json',size:20,text:()=>new Promise(r=>resolve=r)};
 const p=importer();const waiting=p.choose(delayed);await p.choose(file(interest));const checked=p.textarea.value;resolve('bad');await waiting;assert.equal(p.textarea.value,checked);assert.match(p.status.textContent,/File checked/);
 const q=importer();const pending=q.choose(delayed);q.textarea.value='My edited note';q.textarea.listeners.input();resolve(interest);await pending;assert.equal(q.textarea.value,'My edited note');
 let current=who;const r=importer({kind:'return',record:()=>current});const loading=r.choose(delayed);current={...who,project:'Another project'};resolve(agreement);await loading;assert.equal(r.textarea.value,'Previous note');assert.match(r.status.textContent,/changed/);
});
test('download creates only a canonical JSON blob with a generic filename and cleans up its URL',()=>{
 const calls=[];let parts;
 const link={click:()=>calls.push('click'),remove:()=>calls.push('remove')};
 const window={FBInterestReviewKit:reviews,FBFounderReturnKit:returns,Blob:class{constructor(value){parts=value;}},
  URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:url=>calls.push(url)},document:{createElement:()=>link,body:{append:()=>calls.push('append')}},setTimeout:fn=>fn()};
 vm.runInNewContext(fs.readFileSync(require.resolve('../handoff-files.js'),'utf8'),{window});
 window.FBHandoffFiles.download(interest,'interest');assert.equal(link.download,'founders-builders-interest.json');assert.deepEqual(JSON.parse(parts[0]),JSON.parse(files.prepare(interest,'interest')));assert.deepEqual(calls,['append','click','remove','blob:local']);
 assert.throws(()=>window.FBHandoffFiles.download('bad','interest'));assert.equal(calls.length,4);
});
