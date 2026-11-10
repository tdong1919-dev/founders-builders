/* Fictional-data preview only. No network, credentials, browser storage or real accounts. */
(function (root) {
  'use strict';
  function create(role) {
    var actors = { owner: 'demo-owner', member: 'demo-member', applicant: 'demo-applicant' };
    var actor = actors[role] || null, serial = 0;
    var projects = [
      { id: 'demo-community-map', owner_id: 'demo-owner', title: 'Community resource map', teaser: 'A fictional project connecting builders with useful local resources.', private_brief: 'Fictional private brief: interview three sample users, map useful resources, and test a simple prototype. No real founder ideas are included.', stage: 'Prototype', skills_needed: ['Design','Research','Engineering'], collaboration_model: 'Volunteer / community', visibility: 'public', created_at: '2026-10-01T12:00:00Z' },
      { id: 'demo-accessible-events', owner_id: 'demo-other', title: 'Accessible event checklist', teaser: 'A fictional project creating a practical checklist for community events.', private_brief: 'Fictional private planning notes for the event checklist.', stage: 'Research', skills_needed: ['Research','Writing'], collaboration_model: 'Open to discussion', visibility: 'public', created_at: '2026-10-02T12:00:00Z' }
    ];
    var members = [{ project_id: 'demo-community-map', user_id: 'demo-member', role: 'collaborator' }];
    var requests = [
      { id:'demo-request-member',project_id:'demo-community-map',applicant_id:'demo-member',message:'Fictional application: I can help design the sample prototype.',status:'accepted' },
      { id:'demo-request-applicant',project_id:'demo-community-map',applicant_id:'demo-applicant',message:'Fictional application: I can help research local resources.',status:'pending' }
    ];
    var milestones = [
      {id:'demo-task-1',project_id:'demo-community-map',title:'Define the first user problem',assignee_id:'demo-owner',done:true,due_at:null},
      {id:'demo-task-2',project_id:'demo-community-map',title:'Sketch a resource card',assignee_id:'demo-member',done:false,due_at:'2099-01-15T23:59:59Z'},
      {id:'demo-task-3',project_id:'demo-community-map',title:'Schedule sample interviews',assignee_id:null,done:false,due_at:'2000-01-15T23:59:59Z'}
    ];
    var copy = function (value) { return JSON.parse(JSON.stringify(value)); };
    function project(id) { var p = projects.find(function (p) { return p.id === id; }); if (!p) throw new Error('Preview project unavailable.'); return p; }
    function access(p) { return actor && (p.owner_id === actor || members.some(function (m) { return m.project_id === p.id && m.user_id === actor; })); }
    function owner(p) { if (!actor || p.owner_id !== actor) throw new Error('Only the preview project owner can do this.'); }
    function task(id) { var m=milestones.find(function(m){return m.id===id;}); if(!m) throw new Error('Preview milestone unavailable.'); return m; }
    return Object.freeze({
      enabled: true,
      user: function () { return actor ? {id:actor,email:role+'@example.test'} : null; },
      sendCode: async function () { throw new Error('This fictional preview has no email sign-in. Choose a preview role above.'); },
      verifyCode: async function () { throw new Error('Choose a preview role above. No real authentication is connected.'); },
      signOut: async function () { actor=null; },
      rpc: async function (name, input) {
        var p=input||{}, result;
        if(name==='fb_discover_projects') return projects.filter(function(p){return p.visibility==='public';}).map(function(p){return copy({id:p.id,title:p.title,teaser:p.teaser,stage:p.stage,skills_needed:p.skills_needed,collaboration_model:p.collaboration_model,created_at:p.created_at});});
        if(!actor) throw new Error('Choose a signed-in preview role above.');
        if(name==='fb_my_projects') result=projects.filter(access);
        else if(name==='fb_get_project') result=access(project(p.p_project))?[project(p.p_project)]:[];
        else if(name==='fb_my_requests') result=requests.filter(function(r){return r.applicant_id===actor;}).map(function(r){return {id:r.id,project_id:r.project_id,status:r.status};});
        else if(name==='fb_project_members_for') result=access(project(p.p_project))?members.filter(function(m){return m.project_id===p.p_project;}):[];
        else if(name==='fb_project_milestones_for') result=access(project(p.p_project))?milestones.filter(function(m){return m.project_id===p.p_project;}):[];
        else if(name==='fb_project_requests') result=project(p.p_project).owner_id===actor?requests.filter(function(r){return r.project_id===p.p_project;}):[];
        else if(name==='fb_create_project') {
          var created={id:'demo-new-'+(++serial),owner_id:actor,title:p.p_title,teaser:p.p_teaser,private_brief:p.p_private_brief||'',stage:p.p_stage||'Idea',skills_needed:p.p_skills||[],collaboration_model:p.p_model||'Open to discussion',visibility:'private',created_at:new Date().toISOString()}; projects.push(created); result=created.id;
        } else if(name==='fb_update_project') {
          var updating=project(p.p_project); owner(updating); Object.assign(updating,{title:p.p_title,teaser:p.p_teaser,private_brief:p.p_private_brief,stage:p.p_stage,skills_needed:p.p_skills,collaboration_model:p.p_model,visibility:p.p_publish?'public':'private'});result=true;
        } else if(name==='fb_apply_to_project') {
          var target=project(p.p_project);if(target.visibility!=='public'||access(target)||requests.some(function(r){return r.project_id===target.id&&r.applicant_id===actor;})) throw new Error('This preview application is unavailable or already exists.');
          var request={id:'demo-new-request-'+(++serial),project_id:target.id,applicant_id:actor,message:p.p_message,status:'pending'};requests.push(request);result=request.id;
        } else if(name==='fb_withdraw_request') {
          var withdrawing=requests.find(function(r){return r.id===p.p_request&&r.applicant_id===actor&&r.status==='pending';});if(withdrawing) withdrawing.status='withdrawn';result=!!withdrawing;
        } else if(name==='fb_review_request') {
          var reviewing=requests.find(function(r){return r.id===p.p_request;});if(!reviewing) throw new Error('Preview request unavailable.');owner(project(reviewing.project_id));if(reviewing.status!=='pending')throw new Error('Preview application already reviewed.');reviewing.status=p.p_accept?'accepted':'declined';if(p.p_accept)members.push({project_id:reviewing.project_id,user_id:reviewing.applicant_id,role:'collaborator'});result=reviewing.status;
        } else if(name==='fb_add_milestone') {
          if(!access(project(p.p_project)))throw new Error('Preview milestone unavailable.');var added={id:'demo-new-task-'+(++serial),project_id:p.p_project,title:p.p_title,due_at:p.p_due||null,done:false,assignee_id:null};milestones.push(added);result=added.id;
        } else if(name==='fb_set_milestone_done') {
          var changing=task(p.p_milestone);if(!access(project(changing.project_id)))throw new Error('Preview milestone unavailable.');changing.done=p.p_done;result=true;
        } else if(name==='fb_assign_milestone') {
          var assigning=task(p.p_milestone),assignProject=project(assigning.project_id);owner(assignProject);if(p.p_assignee&&p.p_assignee!==actor&&!members.some(function(m){return m.project_id===assignProject.id&&m.user_id===p.p_assignee;}))throw new Error('Choose an accepted preview member.');assigning.assignee_id=p.p_assignee||null;result=true;
        } else if(name==='fb_remove_project_member') {
          owner(project(p.p_project));var removing=members.find(function(m){return m.project_id===p.p_project&&m.user_id===p.p_member;});result=!!removing;if(removing){members=members.filter(function(m){return m!==removing;});milestones.forEach(function(m){if(m.project_id===p.p_project&&m.assignee_id===p.p_member)m.assignee_id=null;});requests.forEach(function(r){if(r.project_id===p.p_project&&r.applicant_id===p.p_member&&r.status==='accepted')r.status='declined';});}
        } else throw new Error('This operation is not part of the fictional preview.');
        return copy(result);
      }
    });
  }
  root.FBWorkspacePreview=Object.freeze({create:create});
  root.FBSecureClient=Object.freeze({create:function(){var role=root.location?new URLSearchParams(root.location.search).get('role'):'owner';return create(role||'owner');}});
})(typeof window!=='undefined'?window:globalThis);
