(function () {
  'use strict';
  var client = window.FBSecureClient.create(window.FB_SECURE_CONFIG || {});
  var selected = null, emailForCode = '', busy = false;
  var $ = function (id) { return document.getElementById(id); };
  function message(text) { $('status').textContent = text; }
  function node(tag, text) { var el = document.createElement(tag); el.textContent = text; return el; }
  function button(label, action) { var el = node('button', label); el.type = 'button'; el.addEventListener('click', function () { run(action); }); return el; }
  function resetPrivate() {
    selected = null; $('detail').hidden = true; $('account').hidden = true;
    $('editProjectForm').hidden = true; $('editProjectForm').reset();
    ['myProjects', 'myRequests', 'detailTitle', 'detailBrief', 'detailActions', 'members', 'milestones', 'applications', 'identity'].forEach(function (id) { $(id).replaceChildren(); });
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
    var projects = await client.rpc('fb_my_projects');
    $('myProjects').replaceChildren();
    projects.forEach(function (p) { $('myProjects').append(button(p.title + ' · ' + p.visibility, function () { return openProject(p.id); })); });
    if (!projects.length) $('myProjects').textContent = 'No private projects or accepted collaborations yet.';
    var requests = await client.rpc('fb_my_requests');
    $('myRequests').replaceChildren();
    requests.forEach(function (r) {
      var item = node('article', 'Project ' + r.project_id + ' · ' + r.status);
      if (r.status === 'pending') item.append(button('Withdraw', async function () {
        if (!await client.rpc('fb_withdraw_request', { p_request: r.id })) throw new Error('Application is no longer pending.');
        await loadMine(); message('Application withdrawn.');
      }));
      $('myRequests').append(item);
    });
  }
  async function loadPublic() {
    var projects = await client.rpc('fb_discover_projects', {}, false);
    $('publicProjects').replaceChildren();
    projects.forEach(function (p) {
      var card = node('article', ''); card.append(node('h3', p.title), node('p', p.teaser));
      if (client.user()) {
        var form = document.createElement('form'), label = node('label', 'Why would you like to collaborate?'), input = document.createElement('textarea');
        input.required = true; input.minLength = 20; input.maxLength = 1200; label.append(input);
        var submit = node('button', 'Apply to collaborate'); form.append(label, submit);
        form.addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
          await client.rpc('fb_apply_to_project', { p_project: p.id, p_message: input.value });
          input.value = ''; await loadMine(); message('Application sent. Private access requires owner acceptance.');
        }); }); card.append(form);
      }
      $('publicProjects').append(card);
    });
    if (!projects.length) $('publicProjects').textContent = 'No published projects yet.';
  }
  async function openProject(id) {
    // Clear the previous brief before attempting another permission-scoped read.
    $('detail').hidden = true; $('detailBrief').textContent = ''; selected = null;
    $('editProjectForm').hidden = true; $('editProjectForm').reset();
    var rows = await client.rpc('fb_get_project', { p_project: id });
    if (!rows.length) throw new Error('This project is unavailable to your account.');
    selected = rows[0];
    $('detailTitle').textContent = selected.title;
    $('detailBrief').textContent = selected.private_brief;
    $('detailActions').replaceChildren();
    if (selected.owner_id === client.user().id) {
      $('editProjectForm').hidden = false;
      $('editTitle').value = selected.title; $('editTeaser').value = selected.teaser;
      $('editBrief').value = selected.private_brief;
      $('editPublishReview').hidden = selected.visibility !== 'public';
      $('editPublishConfirm').checked = false;
      $('editVisibility').textContent = selected.visibility === 'public'
        ? 'Your title and teaser are public. Review them before saving. Your full brief stays private.'
        : 'This project is private. Saving changes will keep it private.';
      var publish = document.createElement('input'); publish.type = 'checkbox';
      var label = node('label', 'I reviewed the title and teaser and want to publish them publicly.'); label.prepend(publish);
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
    var milestones = await client.rpc('fb_project_milestones_for', { p_project: id });
    $('milestones').replaceChildren();
    milestones.forEach(function (m) { $('milestones').append(button((m.done ? '✓ ' : '○ ') + m.title, async function () {
      if (!await client.rpc('fb_set_milestone_done', { p_milestone: m.id, p_done: !m.done })) throw new Error('Milestone update was not authorized.');
      await openProject(id); message('Milestone updated.');
    })); });
    $('applications').replaceChildren();
    var requests = await client.rpc('fb_project_requests', { p_project: id });
    requests.forEach(function (r) {
      var card = node('article', r.applicant_id + ' · ' + r.status); card.append(node('p', r.message));
      if (r.status === 'pending') [true, false].forEach(function (accept) {
        card.append(button(accept ? 'Accept and grant private project access' : 'Decline', async function () {
          await client.rpc('fb_review_request', { p_request: r.id, p_accept: accept });
          await openProject(id); message(accept ? 'Accepted. This member can now read the private brief and milestones.' : 'Application declined.');
        }));
      }); $('applications').append(card);
    });
    $('detail').hidden = false;
  }
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
    var form = $('projectForm'); var id = await client.rpc('fb_create_project', {
      p_title: form.elements.title.value, p_teaser: form.elements.teaser.value, p_private_brief: form.elements.brief.value });
    form.reset(); await loadMine(); await openProject(id); message('Private project created. Nothing has been published.');
  }); });
  $('editProjectForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    var project = selected, user = client.user();
    if (!project || !user || project.owner_id !== user.id) throw new Error('Only the project owner can edit this project.');
    var published = project.visibility === 'public';
    if (published && !$('editPublishConfirm').checked) throw new Error('Review and approve the public title and teaser before saving.');
    var changed = await client.rpc('fb_update_project', { p_project: project.id,
      p_title: $('editTitle').value, p_teaser: $('editTeaser').value, p_private_brief: $('editBrief').value,
      p_stage: project.stage, p_skills: project.skills_needed, p_model: project.collaboration_model, p_publish: published });
    if (!changed) throw new Error('Project update was not authorized.');
    await loadMine(); await loadPublic(); await openProject(project.id);
    message(published ? 'Project saved. Reviewed title and teaser are public; the full brief stays private.' : 'Private project changes saved.');
  }); });
  $('milestoneForm').addEventListener('submit', function (event) { event.preventDefault(); run(async function () {
    if (!selected) throw new Error('Open a project first.');
    var id = selected.id; await client.rpc('fb_add_milestone', { p_project: id, p_title: $('milestoneTitle').value });
    $('milestoneForm').reset(); await openProject(id); message('Milestone added.');
  }); });
  setInterval(function () {
    if (!$('account').hidden && !client.user()) {
      resetPrivate(); syncAuth(); $('publicProjects').replaceChildren(); message('Session expired. Sign in again to continue.');
    }
  }, 1000);
  syncAuth();
  if (client.enabled) { $('discovery').hidden = false; run(async function () { await loadPublic(); message('Sign in to access your private projects.'); }); }
  else message('Secure workspace setup is pending. Private submissions are disabled. Existing community hubs remain available.');
})();
