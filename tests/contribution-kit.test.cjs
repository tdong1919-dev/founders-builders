const {test}=require('node:test');
const assert=require('node:assert/strict');
const kit=require('../contribution-kit.js');
const ready={title:'Review a sign-up flow',deliverable:'Document confusing steps',project:'A permitted project',skill:'Testing',result:'Documented three issues and learned to write reproducible notes.',status:'completed',permission:true};
test('starter filtering respects skill and a small time commitment without inventing roles',()=>{
 assert.equal(kit.filterTasks('Code',45).length,0);
 assert.equal(kit.filterTasks('Code',90)[0].id,'code');
 assert.ok(kit.filterTasks('',60).every(t=>t.minutes<=60));
});
test('portfolio output requires completed work, evidence of result, and explicit sharing permission',()=>{
 for(const patch of [{status:'planning'},{result:''},{permission:false},{permission:'true'}])assert.throws(()=>kit.summary({...ready,...patch}));
 const text=kit.summary(ready);assert.match(text,/Self-reported contribution; not independently verified/);assert.match(text,/Documented three issues/);
 assert.doesNotMatch(text,/verified credential|increased conversion|employed/);
});
test('evidence links reject script schemes, credentials, and malformed addresses',()=>{
 for(const evidence of ['javascript:alert(1)','http://example.com','https://user:password@example.com','not a url'])assert.ok(kit.validate({...ready,evidence}));
 assert.equal(kit.validate({...ready,evidence:'https://example.com/work'}),'');
});
test('normalization bounds stored text and rejects unsupported work statuses',()=>{
 const r=kit.normalize({title:'  Task  ',deliverable:'a'.repeat(10000),result:'x'.repeat(10000),status:'verified',permission:1});
 assert.equal(r.title,'Task');assert.equal(r.deliverable.length,800);assert.equal(r.result.length,2500);assert.equal(r.status,'planning');assert.equal(r.permission,false);
});
test('introduction is a proposal with scope and feedback rather than a claim of completed experience',()=>{
 const text=kit.message({project:'A demo project',deliverable:'a usability review',skill:'Testing'});
 assert.match(text,/would like to propose a small contribution/);assert.match(text,/a usability review/);assert.match(text,/compensation if any/);assert.match(text,/confirm the plan with you before starting/);
});
