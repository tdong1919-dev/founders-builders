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
  const fields=['title','project','skill','deliverable','collaborator','nextStep','result','evidence','credit','scope','feedback','creditAgreement'];
  function normalize(input){
    const r={};fields.forEach(k=>r[k]=String(input[k]||'').trim().slice(0,k==='scope'?12000:['result','feedback'].includes(k)?2500:800));
    r.status=['planning','interest','agreed','in_progress','awaiting_feedback','completed'].includes(input.status)?input.status:'planning';r.permission=input.permission===true;
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
  function summary(input){const r=normalize(input);const error=validate(r);if(error)throw Error(error);if(r.status!=='completed'||!r.result)throw Error('Mark the work completed and describe the actual result first.');if(!r.permission)throw Error('Confirm permission to share the included project details and work first.');return 'Contribution: '+r.title+'\n'+(r.project?'Project: '+r.project+'\n':'')+'My contribution: '+r.deliverable+'\nWhat happened and what I learned: '+r.result+'\n'+(r.skill?'Skills practiced: '+r.skill+'\n':'')+(r.feedback?'Feedback notes (recorded by contributor): '+r.feedback+'\n':'')+(r.creditAgreement?'Agreed portfolio use (recorded by contributor): '+r.creditAgreement+'\n':'')+(r.credit?'Collaborator credits: '+r.credit+'\n':'')+(r.evidence?'Evidence: '+r.evidence+'\n':'')+'\nSelf-reported contribution; not independently verified by Founders & Builders.';}
  function feedbackRequest(input){const r=normalize(input),error=validate(r);if(error)throw Error(error);return 'Hi'+(r.collaborator?' '+r.collaborator:'')+',\n\nCould we review this contribution together: '+r.deliverable+'\n\n'+(r.result?'My notes on the result: '+r.result+'\n\n':'')+'What was useful, what should I improve, and what would be a good next step? Could we also confirm the credit name and which project details or examples I may show in my portfolio?\n\nThank you for helping me learn.';}
  function statusLabel(s){return {planning:'Planning',interest:'Interest drafted · not sent',agreed:'Scope agreed · self-reported',in_progress:'In progress · self-reported',awaiting_feedback:'Awaiting feedback · self-reported',completed:'Completed · self-reported'}[s]||'Planning';}
  const api={tasks,normalize,validate,filterTasks,message,summary,statusLabel,feedbackRequest};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FBContributionKit=api;
})(typeof window==='undefined'?{}:window);
