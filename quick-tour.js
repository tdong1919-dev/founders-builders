/* Fictional tour: real collaboration rules, page memory only, no account/network/storage. */
(function(root){
 'use strict';
 function create(core){
  let state,role='founder',step=-1,seq=0,task,contribution;const ids={founder:'tour-founder',builder:'tour-builder'},id=()=> 'tour-'+(++seq);
  const brief={deliverable:'Three suggestions to improve an onboarding prototype',acceptance:'Each suggestion explains the problem and one improvement',outside:'No coding, private files or production access',minutes:45,support:'Ask the founder questions before you start',compensation:'unpaid',compensationDetails:'Fictional voluntary exercise; no payment promised',ownership:'Builder keeps their original notes',feedbackTiming:'Within two days',credit:'Onboarding research and product-design feedback'};
  const run=(who,op,p={})=>core.create({state,principal:{userId:ids[who]},id}).run(op,p);
  function reset(nextRole='founder'){if(!['founder','builder'].includes(nextRole))throw Error('Choose founder or builder.');role=nextRole;step=-1;seq=0;contribution=null;state=core.initial();const project=run('founder','saveProject',{title:'A customer-feedback tool',overview:'Help independent businesses turn customer feedback into clearer product decisions.',outcome:'Make the first onboarding prototype easier to understand.',visibility:'public'});task=run('founder','createTask',{title:'Review the onboarding prototype',projectId:project.id,brief,skills:['design','research'],visibility:'public'});run('builder','saveProfile',{name:'Alex · fictional builder',skills:['design','research'],learningSkills:['writing'],goal:'Grow research skills through an early-stage product',maxMinutes:60,discoverable:true});return view();}
  function view(){return {role,step,stage:contribution?.stage||'discovery',finished:step===6};}
  function advance(){if(step===6)return view();if(step===-1){step=0;return view();}const p=()=>({contributionId:contribution.id,expectedVersion:contribution.version});
   if(step===0)contribution=run('builder','interest',{taskId:task.id,note:'I can review the onboarding prototype and suggest three improvements.'});
   if(step===1)contribution=run('founder','propose',{...p(),terms:brief});
   if(step===2)contribution=run('builder','accept',{...p(),termsVersion:contribution.terms.version});
   if(step===3)contribution=run('builder','deliver',{...p(),notes:'Explain the first step, simplify the feedback form, and show what happens after submitting.'});
   if(step===4)contribution=run('founder','feedback',{...p(),notes:'Clear, practical suggestions. Next time, explain which change matters most.',creditText:'Contributed onboarding research and product-design feedback to a fictional customer-feedback tool.',allowPortfolio:true});
   if(step===5){contribution=run('builder','recordCredit',p());for(const who of ['founder','builder'])run(who,'review',{contributionId:contribution.id,rating:5,worked:who==='founder'?'Useful, focused suggestions':'Clear scope and helpful feedback',improve:who==='founder'?'Prioritize the strongest suggestion':'Share a sample customer-feedback scenario earlier'});}
   step++;return view();
  }
  reset();return {reset,advance,view,inspect:()=>({state,task,contribution})};
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBQuickTour=api;
})(typeof window==='undefined'?{}:window);
