const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),core=require('../collaboration-core.js');
test('fictional preview follows current non-monetary terms through agreement, work, feedback and credit',async()=>{
 const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,{listeners:{},addEventListener(k,f){this.listeners[k]=f;},click(){},textContent:''});return nodes.get(id);}};
 const context={document,FBSharedCollaboration:core};context.window=context;
 vm.runInNewContext(fs.readFileSync(require.resolve('../project-preview-client.js'),'utf8'),context);
 const client=context.FBCloudClient.create(),founder=await client.execute('list'),task=founder.tasks[0];
 assert.equal(task.brief.compensation,'nonmonetary');assert.match(task.brief.exchangeExplanation,/30-minute.*mentoring/);assert.match(task.brief.exchangeExplanation,/separately/);
 nodes.get('preview_builder').listeners.click();let c=await client.execute('interest',{taskId:task.id,note:'I can offer three observations.'});
 nodes.get('preview_founder').listeners.click();c=await client.execute('propose',{contributionId:c.id,expectedVersion:c.version,terms:task.brief});
 nodes.get('preview_builder').listeners.click();c=await client.execute('accept',{contributionId:c.id,expectedVersion:c.version,termsVersion:c.terms.version});
 c=await client.execute('deliver',{contributionId:c.id,expectedVersion:c.version,notes:'Three fictional observations, each with a suggested improvement.'});
 nodes.get('preview_founder').listeners.click();c=await client.execute('feedback',{contributionId:c.id,expectedVersion:c.version,notes:'Useful suggestions. Rank by impact next time.',creditText:'Fictional prototype heuristic review.',allowPortfolio:true});
 nodes.get('preview_builder').listeners.click();c=await client.execute('recordCredit',{contributionId:c.id,expectedVersion:c.version});
 assert.equal(c.stage,'closed');assert.equal((await client.execute('exportCredit',{contributionId:c.id})).text,'Fictional prototype heuristic review.');
});
