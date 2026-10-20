(function () {
  'use strict';
  var client = window.FBSecureClient.create(window.FB_SECURE_CONFIG || {});
  var selected = null, emailForCode = '', busy = false, publicRecords = [], milestoneRecords = [], projectMembers = [], ownProjects = [], requestRecords = [], reviewRecords = [];
  var $ = function (id) { return document.getElementById(id); };
  function message(text) { $('status').textContent = text; }
  function node(tag, text) { var el = document.createElement(tag); el.textContent = text; return el; }
  function button(label, action) { var el = node('button', label); el.type = 'button'; el.addEventListener('click', function () { run(action); }); return el; }
  function projectOptions(prefix) {
    var stage = $(prefix + 'Stage').value || 'Idea', model = $(prefix + 'Model').value || 'Open to discussion';
    if (['Idea','Research','Prototype','MVP','Early revenue'].indexOf(stage) === -1) throw new Error('Choose a valid project stage.');
    if (['Open to discussion','Co-founder / potential equity','Paid contract','Volunteer / community'].indexOf(model) === -1)
      throw new Error('Choose valid collaboration terms.');
    var seen = Object.create(null), skills = $(prefix + 'Skills').value.split(',').map(function (skill) { return skill.trim(); }).filter(function (skill) {
      if (!skill || seen[skill.toLowerCase()]) return false;
      seen[skill.toLowerCase()] = true; return true;
    });
    if (skills.length > 30 || skills.join(',').length > 1500) throw new Error('Use up to 30 skills and 1,500 characters.');
    return { stage: stage, model: model, skills: skills };
  }
  function resetPrivate() {
    selected = null; milestoneRecords = []; projectMembers = []; ownProjects = []; requestRecords = []; reviewRecords = [];
    $('requestFilter').value = ''; $('reviewFilter').value = 'pending'; $('reviewSection').hidden = true; $('milestoneFilter').value = '';
    $('discoverySearch').value = ''; $('discoveryStage').value = ''; $('discoveryModel').value = '';
    $('publicProjects').replaceChildren(); $('discoveryResults').textContent = '';
    $('detail').hidden = true; $('account').hidden = true;
    $('editProjectForm').hidden = true; $('editProjectForm').reset();
    ['myProjects', 'myRequests', 'requestSummary', 'reviewSummary', 'detailTitle', 'detailBrief', 'detailMetadata', 'milestoneProgress', 'milestoneResultStatus', 'detailActions', 'members', 'milestones', 'applications', 'identity'].forEach(function (id) { $(id).replaceChildren(); });
    $('projectForm').reset(); $('milestoneForm').reset(); $('codeForm').reset();
  }
  function syncAuth() {
    var user = client.user();
    $('signin').hidden = !client.enabled || !!user;
    $('account').hidden = !user;
    if (!user) resetPrivate();
    else $('identity').textContent = 'Signed in as ' + user.email;
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    document.querySelectorAll('button').forEach(function (b) { if (b.id !== 'signout') b.disabled = true; });
    try { await action(); } catch (error) { syncAuth(); message(error.message); }
    finally { busy = false; document.querySelectorAll('button').forEach(function (b) { b.disabled = false; }); }
  }
  async function loadMine() {
    var projects = await client.rpc('fb_my_projects'); ownProjects = projects;
    $('myProjects').replaceChildren();
    projects.forEach(function (p) { $('myProjects').append(button(p.title + ' · ' + p.visibility, function () { return openProject(p.id); })); });
    if (!projects.length) $('myProjects').textContent = 'No private projects or accepted collaborations yet.';
    requestRecords = await client.rpc('fb_my_requests'); renderMyRequests();
  }
  function projectName(id) {
    var project = ownProjects.concat(publicRecords).find(function (p) { return p.id === id; });
    return project ? project.title : 'Private or unavailable project';
  }
  function renderMyRequests() {
    if (!client.user()) { syncAuth(); return; }
    var filter = $('requestFilter').value;
    $('requestSummary').textContent = requestRecords.filter(function (r) { return r.status === 'pending'; }).length + ' pending · ' +
      requestRecords.filter(function (r) { return r.status === 'accepted'; }).length + ' accepted · ' + requestRecords.length + ' total applications';
    $('myRequests').replaceChildren();
    var requests = requestRecords.filter(function (r) { return !filter || r.status === filter; });
    if (!requests.length) $('myRequests').append(node('p', requestRecords.length ? 'No applications match this status.' : 'No applications yet. Explore published projects below.'));
    requests.forEach(function (r) {
      var item = node('article', ''); item.append(node('h3', projectName(r.project_id)), node('p', 'Status: ' + r.status));
      var explanation = { pending: 'The owner has not made a decision. Private project details remain protected.', accepted: 'Your application was accepted. Open the workspace if membership is still active.',
        declined: 'This application is closed. It does not grant private project access.', withdrawn: 'You withdrew this application. It does not grant private project access.' };
      item.append(node('p', explanation[r.status] || 'Refresh for the latest application status.'));
      if (r.status === 'accepted' && ownProjects.some(function (p) { return p.id === r.project_id; }))
        item.append(button('Open project workspace', function () { return openProject(r.project_id); }));
      if (r.status === 'pending') item.append(button('Withdraw application', async function () {
        if (!await client.rpc('fb_withdraw_request', { p_request: r.id })) throw new Error('Application is no longer pending.');
        await loadMine(); renderPublic(); message('Application withdrawn.');
      }));
      $('myRequests').append(item);
    });
  }
  async function loadPublic() {
    var projects = await client.rpc('fb_discover_projects', {}, false);
    // Cache only columns permitted in public discovery, never confidential briefs.
    publicRecords = projects.map(function (p) { return { id: p.id, title: p.title, teaser: p.teaser,
      stage: p.stage, collaboration_model: p.collaboration_model, skills_needed: p.skills_needed || [] }; });
    renderPublic(); if (client.user()) renderMyRequests();
  }
  function renderPublic() {
    if (!client.enabled) return;
    var query = $('discoverySearch').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var stage = $('discoveryStage').value, model = $('discoveryModel').value;
    var projects = publicRecords.filter(function (p) {
      var text = [p.title, p.teaser, p.stage, p.collaboration_model, p.skills_needed.join(' ')].join(' ').toLowerCase();
      return (!stage || p.stage === stage) && (!model || p.collaboration_model === model) &&
        query.every(function (word) { return text.indexOf(word) !== -1; });
    });
    $('discoveryResults').textContent = 'Showing ' + projects.length + ' of ' + publicRecords.length + ' loaded published projects';
    $('publicProjects').replaceChildren();
    projects.forEach(function (p) {
      var card = node('article', ''); card.append(node('h3', p.title), node('p', p.teaser));
      card.append(node('p', [p.stage, p.collaboration_model, (p.skills_needed || []).join(', ')].filter(Boolean).join(' · ')));
      var mine = ownProjects.some(function (owned) { return owned.id === p.id; });
      var application = requestRecords.find(function (r) { return r.project_id === p.id; });
      if (client.user() && mine) card.append(button('Open project workspace', function () { return openProject(p.id); }));
      else if (client.user() && application) card.append(node('p', 'Application: ' + application.status + '. See My applications for details.'));
      else if (client.user()) {
        var form = document.createElement('form'), label = node('label', 'Why would you like to collaborate?'), input = document.createElement('textarea');
        input.required = true; input.minLength = 20; input.maxLength = 1200; label.append(input);
        var submit = node('button', 'Apply to collaborate'); form.append(label, submit);
        form.addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
          await client.rpc('fb_apply_to_project', { p_project: p.id, p_message: input.value });
          input.value = ''; await loadMine(); renderPublic(); message('Application sent. Private access requires owner acceptance.');
        }); }); card.append(form);
      }
      $('publicProjects').append(card);
    });
    if (!projects.length) $('publicProjects').textContent = publicRecords.length ? 'No projects match. Try a different skill, stage or collaboration term.' : 'No published projects yet.';
  }
  async function openProject(id) {
    // Clear the previous brief before attempting another permission-scoped read.
    $('detail').hidden = true; $('detailBrief').textContent = ''; selected = null; milestoneRecords = []; projectMembers = []; reviewRecords = [];
    $('reviewSection').hidden = true; $('applications').replaceChildren(); $('reviewSummary').textContent = '';
    $('milestones').replaceChildren(); $('milestoneProgress').textContent = ''; $('milestoneResultStatus').textContent = '';
    $('editProjectForm').hidden = true; $('editProjectForm').reset();
    var rows = await client.rpc('fb_get_project', { p_project: id });
    if (!rows.length) throw new Error('This project is unavailable to your account.');
    selected = rows[0];
    $('detailTitle').textContent = selected.title;
    $('detailBrief').textContent = selected.private_brief;
    $('detailMetadata').textContent = selected.stage + ' · ' + selected.collaboration_model +
      ((selected.skills_needed || []).length ? ' · Skills: ' + selected.skills_needed.join(', ') : '');
    $('detailActions').replaceChildren();
    if (selected.owner_id === client.user().id) {
      $('editProjectForm').hidden = false;
      $('editTitle').value = selected.title; $('editTeaser').value = selected.teaser;
      $('editBrief').value = selected.private_brief;
      $('editStage').value = selected.stage; $('editSkills').value = (selected.skills_needed || []).join(', ');
      $('editModel').value = selected.collaboration_model;
      $('editPublishReview').hidden = selected.visibility !== 'public';
      $('editPublishConfirm').checked = false;
      $('editVisibility').textContent = selected.visibility === 'public'
        ? 'Your title, teaser, stage, skills and collaboration terms are public. Review them before saving. Your full brief stays private.'
        : 'This project is private. Saving changes will keep it private.';
      var publish = document.createElement('input'); publish.type = 'checkbox';
      var label = node('label', 'I reviewed the title, teaser, stage, skills and collaboration terms and want to publish them publicly.'); label.prepend(publish);
      if (selected.visibility !== 'public') $('detailActions').append(node('p', selected.teaser), label);
      var project = selected;
      $('detailActions').append(button(selected.visibility === 'public' ? 'Make private' : 'Publish title and teaser', async function () {
        var publishing = project.visibility !== 'public';
        if (publishing && !publish.checked) throw new Error('Review and confirm the public teaser first.');
        var changed = await client.rpc('fb_update_project', { p_project: project.id, p_title: project.title,
          p_teaser: project.teaser, p_private_brief: project.private_brief, p_stage: project.stage,
          p_skills: project.skills_needed, p_model: project.collaboration_model, p_publish: publishing });
        if (!changed) throw new Error('Project update was not authorized.');
        await loadMine(); await loadPublic(); await openProject(project.id); message(publishing ? 'Title and teaser published.' : 'Project is private.');
      }));
    }
    var members = await client.rpc('fb_project_members_for', { p_project: id });
    projectMembers = members;
    $('members').replaceChildren(node('p', 'Owner: ' + selected.owner_id));
    members.forEach(function (m) {
      var row = node('p', m.user_id + ' · ' + m.role);
      if (selected.owner_id === client.user().id) row.append(button('Remove member and revoke private access', async function () {
        if (!await client.rpc('fb_remove_project_member', { p_project: id, p_member: m.user_id }))
          throw new Error('Member was already removed.');
        await openProject(id); message('Member removed. Future private project and milestone requests are denied.');
      }));
      $('members').append(row);
    });
    milestoneRecords = await client.rpc('fb_project_milestones_for', { p_project: id });
    renderMilestones();
    if (selected.owner_id === client.user().id) {
      reviewRecords = await client.rpc('fb_project_requests', { p_project: id });
      $('reviewSection').hidden = false; renderReviews();
    }
    $('detail').hidden = false;
  }
  function renderReviews() {
    var user = client.user();
    if (!user) { syncAuth(); return; }
    if (!selected || selected.owner_id !== user.id) { $('reviewSection').hidden = true; return; }
    var id = selected.id, filter = $('reviewFilter').value;
    $('reviewSummary').textContent = reviewRecords.filter(function (r) { return r.status === 'pending'; }).length + ' pending · ' + reviewRecords.length + ' total applications';
    $('applications').replaceChildren();
    var requests = reviewRecords.filter(function (r) { return !filter || r.status === filter; });
    if (!requests.length) $('applications').append(node('p', 'No applications in this view.'));
    requests.forEach(function (r) {
      var card = node('article', r.applicant_id + ' · ' + r.status); card.append(node('p', r.message));
      if (r.status === 'pending') [true, false].forEach(function (accept) {
        card.append(button(accept ? 'Accept and grant private project access' : 'Decline', async function () {
          await client.rpc('fb_review_request', { p_request: r.id, p_accept: accept });
          await openProject(id); message(accept ? 'Accepted. This member can now read the private brief and milestones.' : 'Application declined.');
        }));
      }); $('applications').append(card);
    });
  }
  function renderMilestones() {
    if (!client.user()) { syncAuth(); return; }
    if (!selected) return;
    var id = selected.id, filter = $('milestoneFilter').value;
    var milestones = milestoneRecords.filter(function (m) {
      if (filter === 'mine') return m.assignee_id === client.user().id;
      if (filter === 'done') return m.done;
      if (filter === 'open') return !m.done;
      if (filter === 'overdue') return !m.done && m.due_at && new Date(m.due_at).getTime() < Date.now();
      return true;
    });
    $('milestones').replaceChildren();
    $('milestoneProgress').textContent = milestoneRecords.filter(function (m) { return m.done; }).length + ' of ' + milestoneRecords.length + ' milestones completed';
    $('milestoneResultStatus').textContent = milestones.length + ' milestone' + (milestones.length === 1 ? '' : 's') + ' in this view';
    if (!milestones.length) $('milestones').append(node('p', milestoneRecords.length ? 'No milestones match this view.' : 'No milestones yet. Add the first next step below.'));
    milestones.forEach(function (m) {
      var row = node('article', '');
      row.append(button((m.done ? '✓ ' : '○ ') + m.title, async function () {
        if (!await client.rpc('fb_set_milestone_done', { p_milestone: m.id, p_done: !m.done })) throw new Error('Milestone update was not authorized.');
        await openProject(id); message('Milestone updated.');
      }));
      if (m.due_at) {
        var due = new Date(m.due_at);
        if (!isNaN(due.getTime())) row.append(node('p', 'Due ' + due.toISOString().slice(0, 10) + ' (UTC)'));
      }
      row.append(node('p', m.assignee_id ? 'Assigned to: ' + (m.assignee_id === client.user().id ? 'You' : m.assignee_id) : 'Unassigned'));
      if (selected.owner_id === client.user().id) {
        var form = document.createElement('form'), label = node('label', 'Assign milestone'), choice = document.createElement('select');
        var unassigned = node('option', 'Unassigned'); unassigned.value = ''; choice.append(unassigned);
        var owner = node('option', 'Project owner (you)'); owner.value = selected.owner_id; choice.append(owner);
        projectMembers.forEach(function (member) { var option = node('option', member.user_id); option.value = member.user_id; choice.append(option); });
        choice.value = m.assignee_id || ''; label.append(choice); form.append(label, node('button', 'Save assignment'));
        form.addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
          if (!selected || selected.owner_id !== client.user().id) throw new Error('Only the project owner can assign milestones.');
          if (!await client.rpc('fb_assign_milestone', { p_milestone: m.id, p_assignee: choice.value || null }))
            throw new Error('Milestone assignment was not authorized.');
          await openProject(id); message('Milestone assignment saved. Project access has not changed.');
        }); });
        row.append(form);
      }
      $('milestones').append(row);
    });
  }
  $('requestFilter').addEventListener('change', renderMyRequests);
  $('reviewFilter').value = 'pending';
  $('reviewFilter').addEventListener('change', renderReviews);
  $('refreshWorkspace').addEventListener('click', function () { run(async function () {
    var id = selected && selected.id; await loadMine(); await loadPublic(); if (id) await openProject(id); message('Workspace refreshed.');
  }); });
  $('discoverySearch').addEventListener('input', renderPublic);
  $('discoveryStage').addEventListener('change', renderPublic);
  $('discoveryModel').addEventListener('change', renderPublic);
  $('clearDiscovery').addEventListener('click', function () {
    $('discoverySearch').value = ''; $('discoveryStage').value = ''; $('discoveryModel').value = ''; renderPublic();
  });
  $('milestoneFilter').addEventListener('change', renderMilestones);
  $('emailForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    emailForCode = $('email').value.trim(); await client.sendCode(emailForCode);
    $('codeForm').hidden = false; message('If this email has approved access, a sign-in code has been sent.');
  }); });
  $('codeForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    await client.verifyCode(emailForCode, $('code').value.trim()); $('codeForm').reset();
    syncAuth(); await loadMine(); await loadPublic(); message('Signed in. Your project briefs are private.');
  }); });
  $('signout').addEventListener('click', async function () {
    try {
    var signingOut = client.signOut(); resetPrivate(); syncAuth(); $('publicProjects').replaceChildren();
    await signingOut; await loadPublic(); message('Signed out. Private data cleared from this page.');
    } catch (error) { syncAuth(); message(error.message); }
  });
  $('projectForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    var form = $('projectForm'), options = projectOptions('new'); var id = await client.rpc('fb_create_project', {
      p_title: form.elements.title.value, p_teaser: form.elements.teaser.value, p_private_brief: form.elements.brief.value,
      p_stage: options.stage, p_skills: options.skills, p_model: options.model });
    form.reset(); await loadMine(); await openProject(id); message('Private project created. Nothing has been published.');
  }); });
  $('editProjectForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    var project = selected, user = client.user();
    if (!project || !user || project.owner_id !== user.id) throw new Error('Only the project owner can edit this project.');
    var published = project.visibility === 'public', options = projectOptions('edit');
    if (published && !$('editPublishConfirm').checked) throw new Error('Review and approve the public project details before saving.');
    var changed = await client.rpc('fb_update_project', { p_project: project.id,
      p_title: $('editTitle').value, p_teaser: $('editTeaser').value, p_private_brief: $('editBrief').value,
      p_stage: options.stage, p_skills: options.skills, p_model: options.model, p_publish: published });
    if (!changed) throw new Error('Project update was not authorized.');
    await loadMine(); await loadPublic(); await openProject(project.id);
    message(published ? 'Project saved. Reviewed title and teaser are public; the full brief stays private.' : 'Private project changes saved.');
  }); });
  $('milestoneForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    if (!selected) throw new Error('Open a project first.');
    var id = selected.id, due = $('milestoneDue').value, dueAt = null;
    if (due) {
      dueAt = /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(due + 'T23:59:59Z') : new Date(NaN);
      if (isNaN(dueAt.getTime()) || dueAt.toISOString().slice(0, 10) !== due) throw new Error('Choose a valid due date.');
      dueAt = dueAt.toISOString();
    }
    await client.rpc('fb_add_milestone', { p_project: id, p_title: $('milestoneTitle').value, p_due: dueAt });
    $('milestoneForm').reset(); await openProject(id); message('Milestone added.');
  }); });
  setInterval(function () {
    if (!$('account').hidden && !client.user()) {
      resetPrivate(); syncAuth(); $('publicProjects').replaceChildren(); message('Session expired. Sign in again to continue.');
    }
  }, 1000);
  syncAuth();
  if (client.enabled) { $('discovery').hidden = false; run(async function () { if (client.user()) await loadMine(); await loadPublic(); message(client.user() ? 'Your workspace is ready.' : 'Sign in to access your private projects.'); }); }
  else message('Secure workspace setup is pending. Private submissions are disabled. Existing community hubs remain available.');
})();
