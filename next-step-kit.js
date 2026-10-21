/* Read saved work without changing it; hand off only a local record pointer. */
(function(root){
  'use strict';
  const local=typeof module==='object'&&module.exports;
  const contributions=local?require('./contribution-kit.js'):root.FBContributionKit;
  const reviews=local?require('./interest-review-kit.js'):root.FBInterestReviewKit;
  const contributionBackup=local?require('./contribution-backup-kit.js'):root.FBContributionBackupKit;
  const reviewBackup=local?require('./review-backup-kit.js'):root.FBReviewBackupKit;
  const pointerKey='fb_next_step_pointer_v1';
  function load(raw,kind){
    if(!['contribution','review'].includes(kind))throw Error('Unsupported saved work.');
    if(raw==null)return {records:[],skipped:0};
    if(typeof raw!=='string'||raw.length>1500000)throw Error('Saved work could not be read.');
    let values;try{values=JSON.parse(raw);}catch(error){throw Error('Saved work could not be read.');}
    if(!Array.isArray(values)||values.length>20)throw Error('Saved work could not be read.');
    const records=[],ids=new Set();let skipped=0;
    for(const value of values){
      try{
        if(!value||typeof value.id!=='string'||!value.id||value.id.length>200||ids.has(value.id))throw Error();
        const format=kind==='contribution'?'fb-contribution-backup-v1':'fb-founder-review-backup-v1';
        const kit=kind==='contribution'?contributionBackup:reviewBackup;
        const checked=kit.unpack(JSON.stringify({format,records:[value]}))[0];
        if(kind==='contribution')records.push({...checked,permission:value.permission===true,id:value.id});
        else records.push({...checked,id:value.id});
        ids.add(value.id);
      }catch(error){skipped++;}
    }
    return {records,skipped};
  }
  function items(savedContributions,savedReviews,includeClosed){
    return [
      ...savedContributions.filter(r=>includeClosed||r.status!=='completed').map(r=>({kind:'contribution',id:r.id,title:r.title,project:r.project,person:'',stage:contributions.statusLabel(r.status),closed:r.status==='completed',action:contributions.nextAction(r)})),
      ...savedReviews.filter(r=>includeClosed||r.review.phase!=='closed').map(r=>({kind:'review',id:r.id,title:r.interest.title,project:r.interest.project,person:r.interest.interestName,stage:reviews.phaseLabel(r.review.phase),closed:r.review.phase==='closed',action:reviews.nextAction(r.review)}))
    ];
  }
  function consume(storage,kind,records){
    const raw=storage.getItem(pointerKey);storage.removeItem(pointerKey);
    if(typeof raw!=='string'||raw.length>1500)throw Error('The saved task link has expired. Open My next step again.');
    let p;try{p=JSON.parse(raw);}catch(error){throw Error('The saved task link is invalid.');}
    if(!p||p.kind!==kind||typeof p.id!=='string')throw Error('The saved task link does not match this tool.');
    const record=records.find(r=>r.id===p.id);
    if(!record)throw Error('This saved task was removed or could not be read. Open My next step again.');
    return record;
  }
  const api={load,items,consume,pointerKey};
  if(local)module.exports=api;else root.FBNextStepKit=api;
})(typeof window==='undefined'?{}:window);
