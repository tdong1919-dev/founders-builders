/* Local planning helpers. Starter tasks are examples, never live opportunities. */
(function(root){
  'use strict';
  const tasks=[
    {id:'test',skill:'Testing',title:'Test one sign-up flow',minutes:45,deliverable:'A short list of confusing steps with reproduction notes.',firstStep:'Ask the owner which flow is ready to test and what feedback would help.'},
    {id:'research',skill:'Research',title:'Summarize three public resources',minutes:60,deliverable:'A one-page summary with sources and questions for the team.',firstStep:'Agree on one research question and who will review the summary.'},
    {id:'writing',skill:'Writing',title:'Improve one page of copy',minutes:45,deliverable:'A draft with clearer headings and a short explanation of the changes.',firstStep:'Ask who the page is for and what readers should do next.'},
    {id:'design',skill:'Design',title:'Review a small screen',minutes:60,deliverable:'Three annotated usability observations and one suggested revision.',firstStep:'Confirm the screen, the intended user, and how to share feedback.'},
    {id:'code',skill:'Code',title:'Reproduce and document one bug',minutes:90,deliverable:'Clear reproduction steps, expected behavior, and an optional small fix.',firstStep:'Ask for a public issue or a safe test environment and a reviewer.'},
    {id:'community',skill:'Community',title:'Help prepare a workshop',minutes:90,deliverable:'A draft agenda or participant checklist for the organizer to review.',firstStep:'Ask the organizer what one piece of preparation would be useful.'}
  ];
  const fields=['title','project','skill','deliverable','collaborator','nextStep','result','evidence','credit','scope','feedback','creditAgreement','interestName','interestNote','availability','questions','agreementSnapshot','feedbackSnapshot','agreementQuestions'];
  function normalize(input){
    const r={};fields.forEach(k=>r[k]=String(input[k]||'').trim().slice(0,['agreementSnapshot','feedbackSnapshot'].includes(k)?18000:k==='scope'?16000:['result','feedback','interestNote','agreementQuestions'].includes(k)?2500:800));
    r.status=['planning','interest','interest_shared','agreed','in_progress','awaiting_feedback','work_delivered','completed'].includes(input.status)?input.status:'planning';r.permission=input.permission===true;
    return r;
  }
  function validate(input){
    const r=normalize(input);
    if(!r.title||!r.deliverable)return 'Add a task title and a clear deliverable.';
    if(r.evidence){try{const url=new URL(r.evidence);if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch(e){return 'Use a public HTTPS evidence link without login details, or leave it blank.';}}
    return '';
  }
  function filterTasks(skill,minutes){return tasks.filter(t=>(!skill||t.skill===skill)&&t.minutes<=Number(minutes||120));}
  function message(input){const r=normalize(input);return 'Hi'+(r.collaborator?' '+r.collaborator:'')+',\n\nI am interested in '+(r.project||'your project')+' and would like to propose a small contribution:\n'+(r.deliverable||'One small, useful task.')+'\n\nI am practicing '+(r.skill||'a new skill')+'.\n\nCould we agree on the scope, timing, feedback, compensation if any, and what I may share afterward? '+(r.nextStep||'What would be a useful first step?')+'\n\nI will confirm the plan with you before starting.';}
  function summary(input){const r=normalize(input);const error=validate(r);if(error)throw Error(error);if(r.status!=='completed'||!r.result)throw Error('Mark the work completed and describe the actual result first.');if(!r.permission)throw Error('Confirm permission to share the included project details and work first.');if(!r.creditAgreement)throw Error('Record the agreed credit and portfolio-use terms before preparing a summary.');const returned=r.feedbackSnapshot?(typeof module==='object'&&module.exports?require('./founder-return-kit.js'):root.FBFounderReturnKit).parse(r.feedbackSnapshot,r):null;return 'Contribution: '+r.title+'\n'+(r.project?'Project: '+r.project+'\n':'')+'My contribution: '+r.deliverable+'\nWhat happened and what I learned: '+r.result+'\n'+(r.skill?'Skills practiced: '+r.skill+'\n':'')+(r.feedback?'Feedback notes (recorded by contributor): '+r.feedback+'\n':'')+(r.creditAgreement?'Agreed portfolio use (recorded by contributor): '+r.creditAgreement+'\n':'')+(r.credit?'Collaborator credits: '+r.credit+'\n':'')+(r.evidence?'Evidence: '+r.evidence+'\n':'')+(returned?'\n'+returned.text+'\n':'')+'\nSelf-reported contribution; not independently verified by Founders & Builders.';}
  function feedbackRequest(input){const r=normalize(input),error=validate(r);if(error)throw Error(error);return 'Hi'+(r.collaborator?' '+r.collaborator:'')+',\n\nCould we review this contribution together: '+r.deliverable+'\n\n'+(r.result?'My notes on the result: '+r.result+'\n\n':'')+'What was useful, what should I improve, and what would be a good next step? Could we also confirm the credit name and which project details or examples I may show in my portfolio?\n\nThank you for helping me learn.';}
  function statusLabel(s){return {planning:'Planning',interest:'Interest drafted · not sent',interest_shared:'Interest shared · waiting for a reply',agreed:'Scope agreed · self-reported',in_progress:'In progress · self-reported',awaiting_feedback:'Awaiting feedback · self-reported',work_delivered:'Work delivered · waiting for feedback',completed:'Completed · self-reported'}[s]||'Planning';}
  function nextAction(input){
    const r=normalize(input);
    if(!r.title||!r.deliverable)return {title:'Choose one useful contribution',text:'Start with a task title and one clear deliverable. Keep the first commitment small enough to discuss with its owner.',target:'contributionTitle',button:'Shape my first task'};
    if(r.status==='completed'){
      if(!r.result)return {title:'Record what actually happened',text:'Describe your own work, what you learned, and the result you can support before preparing a portfolio summary.',target:'contributionResult',button:'Record my result'};
      if(!r.creditAgreement||!r.permission)return {title:'Check what you may share',text:'Agree on project details, evidence and collaborator credit directly. Review the sharing permission separately before preparing your summary.',target:'portfolioTerms',button:'Review credit and sharing'};
      return {title:'Review your contribution story',text:'Preview your summary, check it against the work, and decide what to copy. Thank your collaborator and discuss a useful next step together.',target:'previewContribution',button:'Go to portfolio preview'};
    }
    if(r.status==='interest'&&!r.project)return {title:'Name the project in your notes',text:'Add a project name you have permission to use. It helps the founder match your interest and lets you review their reply in the right record. This does not share or resend anything.',target:'contributionProject',button:'Add the project name'};
    if(r.status==='interest_shared'&&!r.agreementSnapshot)return {waiting:true,title:'Waiting for a founder’s reply',text:'You recorded that you shared your interest directly. Replies do not arrive here automatically. When the founder shares a proposal, open the matching note here to review it; otherwise check in through your agreed channel.',target:'founderReturnInput',button:'Review a founder’s reply'};
    if(r.status==='work_delivered'){
      if(r.feedbackSnapshot)return {title:'Review received feedback and credit',text:'A founder feedback source is saved in this record. Review the unverified note, record what happened and the agreed credit, and decide whether the contribution is complete. Portfolio sharing still needs separate permission.',target:'founderReturnInput',button:'Review feedback and credit'};
      return {waiting:true,title:'Waiting for feedback',text:'You recorded that you delivered the work directly. Give your collaborator the feedback time you agreed, then plan a check-in if needed. Add their feedback note when it arrives; delivery does not mark the contribution complete.',target:'contributionNextStep',button:'Plan a feedback check-in'};
    }
    if(r.status==='awaiting_feedback')return {title:'Make feedback easy to give',text:'Ask what helped, what could improve, and which details and credit you may show. Add a received founder note when they reply.',target:'draftFeedbackRequest',button:'Prepare a feedback request'};
    if(r.status==='in_progress')return {title:'Keep the next check-in clear',text:'Note what you will deliver and when to check in. Discuss blockers or scope changes with your collaborator before taking on more.',target:'contributionNextStep',button:'Plan my next check-in'};
    if(r.status==='agreed')return {title:'Plan a small first delivery',text:'Confirm access, support and the first check-in with your collaborator. Change progress yourself when the work has started.',target:'contributionNextStep',button:'Plan my first delivery'};
    if(r.status==='interest'&&!r.agreementSnapshot&&(!r.interestName||!r.interestNote||!r.availability))return {title:'Introduce what you can contribute',text:'Add your chosen name, availability, and what you can offer and want to learn. Review your interest note and contact the owner yourself before reviewing proposed terms.',target:!r.interestName?'contributionName':!r.availability?'interestAvailability':'interestContribution',button:'Prepare my interest'};
    if(r.status==='interest'&&!r.agreementSnapshot)return {title:'Share your interest with the founder',text:'Review the included details, confirm permission, and copy your interest note. Send it directly to the founder; then use Review an agreement or feedback when they reply. Nothing is sent automatically.',target:'interestSharePermission',button:'Review and copy my interest'};
    if(r.agreementSnapshot)return {title:'Agree the details before starting',text:'Discuss scope, timing, compensation, support, ownership and credit directly. If the founder shared a return note, review it here before drafting your reply.',target:'founderReturnInput',button:'Review a founder’s terms'};
    return {title:'Start a useful conversation',text:'Introduce the contribution you can make and what you hope to practice. Review your note, then contact the owner yourself.',target:'interestAvailability',button:'Prepare my interest'};
  }
  function checkIn(input){
    const r=normalize(input),error=validate(r);if(error)throw Error(error);
    if(!['interest_shared','work_delivered'].includes(r.status))throw Error('Record interest shared or work delivered before preparing a waiting-stage check-in.');
    const context=r.title+(r.project?' for '+r.project:'');
    return 'Check-in draft · not sent\n\nHi'+(r.collaborator?' '+r.collaborator:'')+',\n\n'+
      (r.status==='interest_shared'?'I wanted to check in about '+context+'. Is there a useful next step, or anything you would like me to clarify? No rush if you are still reviewing interest.':
      'Could we arrange the feedback check-in for '+context+' when convenient? I would appreciate hearing what helped, what I could improve, and which details we agree I may show in a portfolio.')+
      '\n\nThank you.\n\nReview the timing and recipient before sharing directly. This draft does not send a reminder or change progress.';
  }
  const api={tasks,normalize,validate,filterTasks,message,summary,statusLabel,feedbackRequest,nextAction,checkIn};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FBContributionKit=api;
})(typeof window==='undefined'?{}:window);
