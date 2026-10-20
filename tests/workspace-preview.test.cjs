const {test}=require('node:test');const assert=require('node:assert/strict');
require('../workspace-preview-client.js');
const create=FBWorkspacePreview.create;
test('fictional preview exposes only public teaser fields to visitors',async()=>{
 const c=create('visitor'),publicRows=await c.rpc('fb_discover_projects');
 assert.equal(publicRows.length,2);assert.equal(publicRows.some(p=>'private_brief'in p||'owner_id'in p),false);
 await assert.rejects(c.rpc('fb_get_project',{p_project:'demo-community-map'}),/preview role/);
});
test('fictional preview resets changes in a fresh instance and has no real email flow',async()=>{
 const c=create('owner'),id=await c.rpc('fb_create_project',{p_title:'Synthetic sample',p_teaser:'Fictional sample teaser',p_private_brief:'Fictional sample brief'});
 assert.equal((await c.rpc('fb_get_project',{p_project:id}))[0].visibility,'private');
 assert.equal((await create('owner').rpc('fb_my_projects')).some(p=>p.id===id),false);
 await assert.rejects(c.sendCode('real@example.com'),/no email sign-in/);
});
test('fictional owner review updates membership and assignment cleanup',async()=>{
 const c=create('owner');await c.rpc('fb_review_request',{p_request:'demo-request-applicant',p_accept:true});
 assert.equal((await c.rpc('fb_project_members_for',{p_project:'demo-community-map'})).length,2);
 await c.rpc('fb_assign_milestone',{p_milestone:'demo-task-2',p_assignee:'demo-applicant'});
 await c.rpc('fb_remove_project_member',{p_project:'demo-community-map',p_member:'demo-applicant'});
 assert.equal((await c.rpc('fb_project_milestones_for',{p_project:'demo-community-map'})).find(m=>m.id==='demo-task-2').assignee_id,null);
});
test('fictional collaborator can complete work but not edit the owner project',async()=>{
 const c=create('member');assert.equal(await c.rpc('fb_set_milestone_done',{p_milestone:'demo-task-2',p_done:true}),true);
 await assert.rejects(c.rpc('fb_update_project',{p_project:'demo-community-map',p_title:'Changed'}),/owner/);
 await c.signOut();await assert.rejects(c.rpc('fb_my_projects'),/preview role/);
});
test('fictional preview and real authentication remain separate entry points',()=>{
 const fs=require('node:fs'),real=fs.readFileSync(require.resolve('../workspace.html'),'utf8'),preview=fs.readFileSync(require.resolve('../workspace-preview.html'),'utf8');
 assert.match(real,/<script src="secure-client.js"><\/script>/);assert.doesNotMatch(real,/<script src="workspace-preview-client.js"/);
 assert.match(preview,/connect-src 'none'/);assert.match(preview,/<script src="workspace-preview-client.js"><\/script>/);
 assert.doesNotMatch(preview,/<script src="secure-client.js"/);assert.match(preview,/fictional data only/);
});
