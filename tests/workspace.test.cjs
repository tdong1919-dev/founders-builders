const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../workspace.html'), 'utf8');
const source = fs.readFileSync(require.resolve('../workspace.js'), 'utf8');
// Small DOM adapter executes the real event handlers without a browser or network.
// Hosted browser/auth journeys remain a separate release gate.
async function harness({ owner = true, published = false, milestones = [], publicProjects = [] } = {}) {
 const all = [], elements = {};
 class Element {
  constructor(tag, id = '') { this.tagName = tag; this.id = id; this.hidden = false; this.disabled = false; this.value = ''; this.checked = false; this.children = []; this.listeners = {}; this.textContent = ''; all.push(this); }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; this.textContent = ''; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  reset() {
   const ids = this.id === 'editProjectForm' ? ['editTitle','editTeaser','editBrief','editPublishConfirm','editStage','editSkills','editModel'] :
    this.id === 'projectForm' ? ['newTitle','newTeaser','newBrief','newStage','newSkills','newModel'] : this.id === 'codeForm' ? ['code'] : this.id === 'milestoneForm' ? ['milestoneTitle','milestoneDue'] : [];
   ids.forEach(id => { if (elements[id]) { elements[id].value = ''; elements[id].checked = false; } });
  }
  set innerHTML(_) { throw new Error('Untrusted HTML rendering is forbidden'); }
 }
 for (const match of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)) {
  const el = elements[match[2]] = new Element(match[1], match[2]); el.hidden = /\bhidden\b/.test(match[0]);
 }
 for (const [id, field] of [['newTitle','title'],['newTeaser','teaser'],['newBrief','brief']]) {
  elements[id] = new Element('input', id); elements.projectForm.elements ||= {}; elements.projectForm.elements[field] = elements[id];
 }
 let user = { id: owner ? 'owner' : 'member', email: 'test@example.com' };
 let holdMine = false, release;
 const calls = [], project = { id: 'project', owner_id: 'owner', title: 'Original title', teaser: 'Original public teaser',
  private_brief: '<img src=x onerror=alert(1)> confidential', stage: 'Idea', skills_needed: ['Design'],
  collaboration_model: 'Open to discussion', visibility: published ? 'public' : 'private' };
 const client = { enabled: true, user: () => user,
  signOut: () => { user = null; return Promise.resolve(); },
  rpc: async (name, params) => {
   calls.push({ name, params });
   if (name === 'fb_my_projects' && holdMine) return new Promise(resolve => release = resolve);
   if (name === 'fb_discover_projects') return publicProjects;
   if (name === 'fb_get_project') return [{ ...project }];
   if (name === 'fb_my_projects') return [{ ...project }];
   if (name === 'fb_update_project') { Object.assign(project, { title: params.p_title, teaser: params.p_teaser, private_brief: params.p_private_brief, stage: params.p_stage, skills_needed: params.p_skills, collaboration_model: params.p_model }); return true; }
   if (name === 'fb_project_milestones_for') return milestones;
   if (name === 'fb_add_milestone') { milestones.push({ id: 'new-milestone', title: params.p_title, due_at: params.p_due, done: false }); return 'new-milestone'; }
   if (name === 'fb_set_milestone_done') { milestones.find(m => m.id === params.p_milestone).done = params.p_done; return true; }
   if (name === 'fb_create_project') return project.id;
   return [];
  }
 };
 vm.runInNewContext(source, { window: { FBSecureClient: { create: () => client }, FB_SECURE_CONFIG: {} },
  document: { getElementById: id => elements[id], createElement: tag => new Element(tag), querySelectorAll: () => all.filter(e => e.tagName === 'button') }, setInterval: () => {} });
 const settle = async () => { for (let i=0;i<6;i++) await new Promise(resolve => setImmediate(resolve)); };
 const fire = async (id, type) => { elements[id].listeners[type]({ preventDefault() {} }); await settle(); };
 await settle();
 // Create/open exercises the existing owner/member scoped detail rendering path.
 await fire('projectForm','submit');
 return { elements, calls, project, fire, settle, client, expire: () => { user = null; },
  hold: () => { holdMine = true; }, release: () => { holdMine = false; release([]); } };
}
test('owner can edit a private project without publishing it', async () => {
 const h = await harness(); const e = h.elements;
 assert.equal(e.editProjectForm.hidden, false); assert.equal(e.editBrief.value, h.project.private_brief);
 e.editTitle.value = 'Revised private title'; e.editTeaser.value = 'Revised public teaser'; e.editBrief.value = 'Revised confidential brief';
 await h.fire('editProjectForm','submit');
 const update = h.calls.find(c => c.name === 'fb_update_project');
 assert.equal(update.params.p_publish, false); assert.equal(update.params.p_private_brief, 'Revised confidential brief');
 assert.equal(update.params.p_stage, 'Idea'); assert.deepEqual(Array.from(update.params.p_skills), ['Design']);
 assert.equal(e.detailTitle.textContent, 'Revised private title');
});
test('published edits require explicit public-content review', async () => {
 const h = await harness({ published: true });
 await h.fire('editProjectForm','submit'); assert.equal(h.calls.some(c => c.name === 'fb_update_project'), false);
 assert.match(h.elements.status.textContent, /Review and approve/);
 h.elements.editPublishConfirm.checked = true; await h.fire('editProjectForm','submit');
 assert.equal(h.calls.find(c => c.name === 'fb_update_project').params.p_publish, true);
 assert.equal(h.elements.editPublishConfirm.checked, false);
});
test('collaborators cannot edit even if the hidden form is submitted', async () => {
 const h = await harness({ owner: false });
 assert.equal(h.elements.editProjectForm.hidden, true);
 await h.fire('editProjectForm','submit');
 assert.equal(h.calls.some(c => c.name === 'fb_update_project'), false);
 assert.match(h.elements.status.textContent, /Only the project owner/);
});
test('private content is rendered as text and cleared on signout', async () => {
 const h = await harness(); assert.equal(h.elements.detailBrief.textContent, h.project.private_brief);
 await h.fire('signout','click');
 assert.equal(h.elements.account.hidden, true); assert.equal(h.elements.detail.hidden, true);
 assert.equal(h.elements.detailBrief.textContent, ''); assert.equal(h.elements.editBrief.value, '');
});
test('signout remains enabled while another action is waiting', async () => {
 const h = await harness(); h.hold();
 h.elements.projectForm.listeners.submit({ preventDefault() {} }); await h.settle();
 assert.equal(h.elements.signout.disabled, false);
 await h.fire('signout','click'); assert.equal(h.elements.detail.hidden, true);
 assert.equal(h.elements.editBrief.value, ''); h.release(); await h.settle();
});
test('owner can update stage and terms while skills are trimmed and deduplicated', async () => {
 const h = await harness();
 h.elements.editStage.value = 'MVP'; h.elements.editModel.value = 'Paid contract';
 h.elements.editSkills.value = '  Design, design, Engineering, , engineering ';
 await h.fire('editProjectForm','submit');
 const update = h.calls.find(c => c.name === 'fb_update_project').params;
 assert.equal(update.p_stage, 'MVP'); assert.equal(update.p_model, 'Paid contract');
 assert.deepEqual(Array.from(update.p_skills), ['Design','Engineering']);
 assert.equal(update.p_publish, false); assert.match(h.elements.detailMetadata.textContent, /MVP.*Paid contract.*Design, Engineering/);
});
test('invalid project enums and excessive skills do not reach the API', async () => {
 const h = await harness(); h.elements.editStage.value = 'Administrator';
 await h.fire('editProjectForm','submit'); assert.match(h.elements.status.textContent, /valid project stage/);
 h.elements.editStage.value = 'Idea'; h.elements.editModel.value = 'Guaranteed equity';
 await h.fire('editProjectForm','submit'); assert.match(h.elements.status.textContent, /valid collaboration terms/);
 h.elements.editModel.value = 'Open to discussion'; h.elements.editSkills.value = Array.from({length:31},(_,i) => 'Skill '+i).join(',');
 await h.fire('editProjectForm','submit'); assert.match(h.elements.status.textContent, /up to 30 skills/);
 assert.equal(h.calls.some(c => c.name === 'fb_update_project'), false);
});
test('creation submits the selected stage, skills and collaboration terms privately', async () => {
 const h = await harness(); h.elements.newStage.value = 'Research'; h.elements.newSkills.value = 'Design, Research'; h.elements.newModel.value = 'Volunteer / community';
 await h.fire('projectForm','submit');
 const create = h.calls.filter(c => c.name === 'fb_create_project').at(-1).params;
 assert.equal(create.p_stage, 'Research'); assert.equal(create.p_model, 'Volunteer / community');
 assert.deepEqual(Array.from(create.p_skills), ['Design','Research']); assert.equal('p_publish' in create, false);
});
test('milestones include an optional UTC due date and update progress', async () => {
 const h = await harness({ owner: false, milestones: [{id:'first',title:'Research users',done:true,due_at:null}] });
 assert.equal(h.elements.milestoneProgress.textContent, '1 of 1 milestones completed');
 h.elements.milestoneTitle.value = 'Build prototype'; h.elements.milestoneDue.value = '2027-01-15';
 await h.fire('milestoneForm','submit');
 const add = h.calls.find(c => c.name === 'fb_add_milestone').params;
 assert.equal(add.p_due, '2027-01-15T23:59:59.000Z'); assert.equal(add.p_project, 'project');
 assert.equal(h.elements.milestoneProgress.textContent, '1 of 2 milestones completed');
 const row = h.elements.milestones.children[1]; assert.equal(row.children[1].textContent, 'Due 2027-01-15 (UTC)');
 row.children[0].listeners.click(); await h.settle();
 assert.equal(h.elements.milestoneProgress.textContent, '2 of 2 milestones completed');
 assert.equal(h.calls.some(c => c.name === 'fb_update_project'), false);
});
test('invalid milestone dates are rejected before sending', async () => {
 const h = await harness(); h.elements.milestoneDue.value = '2027-02-31';
 await h.fire('milestoneForm','submit');
 assert.match(h.elements.status.textContent, /valid due date/);
 assert.equal(h.calls.some(c => c.name === 'fb_add_milestone'), false);
});
const discoveryFixtures = [
 { id:'alpha',title:'Climate prototype',teaser:'Build useful climate tools',stage:'Prototype',skills_needed:['Design','Engineering'],collaboration_model:'Paid contract',private_brief:'DO NOT INDEX SECRET' },
 { id:'beta',title:'Health research',teaser:'Explore care workflows',stage:'Research',skills_needed:['Research','Design'],collaboration_model:'Volunteer / community' },
 { id:'gamma',title:'Climate launch',teaser:'Launch a local product',stage:'MVP',skills_needed:['Marketing'],collaboration_model:'Paid contract' }
];
test('public discovery combines words, skills, stage and collaboration terms without new requests', async () => {
 const h = await harness({publicProjects:discoveryFixtures}), before = h.calls.length;
 h.elements.discoverySearch.value = 'CLIMATE engineering'; await h.fire('discoverySearch','input');
 h.elements.discoveryStage.value = 'Prototype'; await h.fire('discoveryStage','change');
 h.elements.discoveryModel.value = 'Paid contract'; await h.fire('discoveryModel','change');
 assert.equal(h.elements.publicProjects.children.length,1);
 assert.equal(h.elements.publicProjects.children[0].children[0].textContent,'Climate prototype');
 assert.match(h.elements.discoveryResults.textContent,/Showing 1 of 3/); assert.equal(h.calls.length,before);
});
test('discovery never searches private fields even if an unexpected field is returned', async () => {
 const h = await harness({publicProjects:discoveryFixtures});
 h.elements.discoverySearch.value = 'DO NOT INDEX SECRET'; await h.fire('discoverySearch','input');
 assert.equal(h.elements.publicProjects.children.length,0); assert.match(h.elements.publicProjects.textContent,/No projects match/);
});
test('clearing discovery filters restores loaded public records', async () => {
 const h = await harness({publicProjects:discoveryFixtures});
 h.elements.discoverySearch.value = 'nonexistent'; h.elements.discoveryStage.value='Idea'; await h.fire('discoverySearch','input');
 await h.fire('clearDiscovery','click');
 assert.equal(h.elements.discoverySearch.value,''); assert.equal(h.elements.discoveryStage.value,'');
 assert.equal(h.elements.publicProjects.children.length,3); assert.match(h.elements.discoveryResults.textContent,/Showing 3 of 3/);
});
test('milestone views distinguish overdue work, completed work and undated work', async () => {
 const h = await harness({milestones:[
  {id:'past',title:'Open overdue',done:false,due_at:'2000-01-01T23:59:59Z'},
  {id:'future',title:'Future work',done:false,due_at:'2099-01-01T23:59:59Z'},
  {id:'complete',title:'Finished overdue',done:true,due_at:'2000-01-01T23:59:59Z'},
  {id:'undated',title:'No deadline',done:false,due_at:null}
 ]});
 h.elements.milestoneFilter.value='overdue'; await h.fire('milestoneFilter','change');
 assert.equal(h.elements.milestones.children.length,1); assert.equal(h.elements.milestones.children[0].children[0].textContent,'○ Open overdue');
 assert.equal(h.elements.milestoneProgress.textContent,'1 of 4 milestones completed');
 h.elements.milestoneFilter.value='done'; await h.fire('milestoneFilter','change'); assert.equal(h.elements.milestones.children.length,1);
 h.elements.milestoneFilter.value='open'; await h.fire('milestoneFilter','change'); assert.equal(h.elements.milestones.children.length,3);
});
test('signout clears private milestone caches and public application drafts', async () => {
 const h = await harness({publicProjects:discoveryFixtures,milestones:[{id:'private',title:'Confidential launch',done:false,due_at:null}]});
 h.elements.discoverySearch.value='draft keyword';
 await h.fire('signout','click'); h.elements.milestoneFilter.value='open'; await h.fire('milestoneFilter','change');
 assert.equal(h.elements.milestones.children.length,0); assert.equal(h.elements.milestoneProgress.textContent,'');
 assert.equal(h.elements.discoverySearch.value,'');
 await h.fire('clearDiscovery','click');
 assert.equal(h.elements.publicProjects.children.length,3);
 assert.equal(h.elements.publicProjects.children.some(card => card.children.some(child => child.tagName==='form')),false);
});

test('session loss clears public application drafts when a private filter is used', async () => {
 const h = await harness({publicProjects:discoveryFixtures,milestones:[{id:'private',title:'Confidential',done:false,due_at:null}]});
 assert.equal(h.elements.publicProjects.children.length,3);
 h.expire(); await h.fire('milestoneFilter','change');
 assert.equal(h.elements.publicProjects.children.length,0); assert.equal(h.elements.milestones.children.length,0);
 assert.equal(h.elements.detailBrief.textContent,''); assert.equal(h.elements.account.hidden,true);
});
