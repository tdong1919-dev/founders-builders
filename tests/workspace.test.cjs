const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../workspace.html'), 'utf8');
const source = fs.readFileSync(require.resolve('../workspace.js'), 'utf8');
// Small DOM adapter executes the real event handlers without a browser or network.
// Hosted browser/auth journeys remain a separate release gate.
async function harness({ owner = true, published = false } = {}) {
 const all = [], elements = {};
 class Element {
  constructor(tag, id = '') { this.tagName = tag; this.id = id; this.hidden = false; this.disabled = false; this.value = ''; this.checked = false; this.children = []; this.listeners = {}; this.textContent = ''; all.push(this); }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; this.textContent = ''; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  reset() {
   const ids = this.id === 'editProjectForm' ? ['editTitle','editTeaser','editBrief','editPublishConfirm'] :
    this.id === 'projectForm' ? ['newTitle','newTeaser','newBrief'] : this.id === 'codeForm' ? ['code'] : [];
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
   if (name === 'fb_discover_projects') return [];
   if (name === 'fb_get_project') return [{ ...project }];
   if (name === 'fb_my_projects') return [{ ...project }];
   if (name === 'fb_update_project') { Object.assign(project, { title: params.p_title, teaser: params.p_teaser, private_brief: params.p_private_brief }); return true; }
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
 return { elements, calls, project, fire, settle, client,
  hold: () => { holdMine = true; }, release: () => { holdMine = false; release([]); } };
}
test('owner can edit a private project without publishing it', async () => {
 const h = await harness(); const e = h.elements;
 assert.equal(e.editProjectForm.hidden, false); assert.equal(e.editBrief.value, h.project.private_brief);
 e.editTitle.value = 'Revised private title'; e.editTeaser.value = 'Revised public teaser'; e.editBrief.value = 'Revised confidential brief';
 await h.fire('editProjectForm','submit');
 const update = h.calls.find(c => c.name === 'fb_update_project');
 assert.equal(update.params.p_publish, false); assert.equal(update.params.p_private_brief, 'Revised confidential brief');
 assert.equal(update.params.p_stage, 'Idea'); assert.deepEqual(update.params.p_skills, ['Design']);
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
