const {test}=require('node:test');const assert=require('node:assert/strict');const backup=require('../contribution-backup-kit.js');
const record={title:'Review a flow',project:'Fictional project',deliverable:'Three observations',status:'completed',result:'Found confusing labels',permission:true,feedback:'Helpful notes',creditAgreement:'Public summary allowed'};
test('backup round-trip retains personal work but excludes IDs and sharing grants',()=>{
 const raw=backup.pack([{...record,id:'private-local-id',unknown:'omit'}]),[r]=backup.unpack(raw);
 assert.equal(r.result,record.result);assert.equal(r.feedback,record.feedback);assert.equal(r.permission,false);assert.equal(r.status,'completed');assert.equal(r.id,undefined);assert.equal(r.unknown,undefined);assert.doesNotMatch(raw,/private-local-id/);
});
test('invalid, oversized and unsupported backups are rejected before restore',()=>{
 for(const raw of ['null','{','{"format":"wrong","records":[]}',JSON.stringify({format:'fb-contribution-backup-v1',records:[]}),JSON.stringify({format:'fb-contribution-backup-v1',records:Array(21).fill(record)}),'x'.repeat(1500001)])assert.throws(()=>backup.unpack(raw));
 for(const r of [{...record,status:'verified'},{...record,title:{}},{...record,result:'x'.repeat(2501)},{...record,evidence:'javascript:alert(1)'},{...record,feedbackSnapshot:'{"format":"bad"}'}])assert.throws(()=>backup.unpack(JSON.stringify({format:'fb-contribution-backup-v1',records:[r]})));
});
test('merge skips identical records, preserves existing records and rejects overflow atomically',()=>{
 const existing=[{...record,id:'keep',permission:true}];assert.equal(backup.merge(existing,backup.unpack(backup.pack(existing))).length,0);assert.equal(existing[0].permission,true);assert.equal(existing[0].id,'keep');
 assert.equal(backup.merge(existing,[{...record,title:'Another task'}]).length,1);
 assert.throws(()=>backup.merge(Array.from({length:20},(_,i)=>({...record,title:'Existing '+i})),[record]),/exceed 20/);
 assert.equal(backup.unpack(backup.pack([record,record])).length,1);
});

test('generated backups never exceed the supported restore limit',()=>{
 assert.throws(()=>backup.pack(Array.from({length:20},(_,i)=>({...record,title:'Task '+i,scope:String.fromCharCode(1).repeat(16000)}))),/too large/);
});
test('received sources survive backup with matching identity and keep their unverified status',()=>{
 const returns=require('../founder-return-kit.js'),who={title:record.title,project:record.project,interestName:'Contributor'};
 const agreement=returns.agreementPacket(who,{deliverable:'Three observations',acceptance:'Clear steps',exclusions:'No code edits',minutes:'60',compensation:'Paid',terms:'Fixed fee agreed directly',support:'A check-in',reviewer:'Owner',feedbackTiming:'Three days',creditTerms:'Public summary allowed',ownership:'Discuss directly'});
 const saved={...record,interestName:'Contributor',agreementSnapshot:JSON.stringify(agreement)};
 assert.equal(backup.unpack(backup.pack([saved]))[0].agreementSnapshot,saved.agreementSnapshot);
 assert.throws(()=>backup.pack([{...saved,interestName:'Someone else'}]),/must match/);
 assert.throws(()=>backup.pack([{...saved,agreementSnapshot:'',feedbackSnapshot:JSON.stringify(agreement)}]),/mismatched received source/);
});
