/* Portable local notebook copies. No network, identity verification or permissions transfer. */
(function(root){
  'use strict';
  const kit=typeof module==='object'&&module.exports?require('./contribution-kit.js'):root.FBContributionKit;
  const limits={title:800,project:800,skill:800,deliverable:800,collaborator:800,nextStep:800,result:2500,evidence:800,credit:800,scope:16000,feedback:2500,creditAgreement:800,interestName:800,interestNote:2500,availability:800,questions:800,agreementSnapshot:18000,feedbackSnapshot:18000,agreementQuestions:2500};
  function record(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('The backup contains an invalid contribution.');
    for(const [field,max] of Object.entries(limits))if(value[field]!=null&&(typeof value[field]!=='string'||value[field].length>max))throw Error('The backup contains an invalid or oversized field.');
    if(!['planning','interest','interest_shared','agreed','in_progress','awaiting_feedback','work_delivered','completed'].includes(value.status))throw Error('The backup contains an unknown progress stage.');
    const r=kit.normalize(value),error=kit.validate(r);if(error)throw Error(error);r.permission=false;
    const returns=typeof module==='object'&&module.exports?require('./founder-return-kit.js'):root.FBFounderReturnKit;
    for(const field of ['agreementSnapshot','feedbackSnapshot'])if(r[field]){const source=returns.parse(r[field],r);if(source.kind!==(field==='agreementSnapshot'?'agreement':'feedback'))throw Error('The backup contains a mismatched received source.');}
    return r;
  }
  function unpack(raw){
    if(typeof raw!=='string'||raw.length>1500000)throw Error('Use a notebook backup of at most 1.5 million characters.');
    let p;try{p=JSON.parse(raw);}catch(e){throw Error('This is not a valid notebook backup.');}
    if(!p||p.format!=='fb-contribution-backup-v1'||!Array.isArray(p.records)||!p.records.length||p.records.length>20)throw Error('Use a supported notebook backup containing 1–20 contributions.');
    const records=p.records.map(record),seen=new Set();
    return records.filter(r=>{const key=JSON.stringify(r);if(seen.has(key))return false;seen.add(key);return true;});
  }
  function pack(records){if(!Array.isArray(records)||!records.length||records.length>20)throw Error('Save at least one contribution before preparing a backup.');const raw=JSON.stringify({format:'fb-contribution-backup-v1',records:records.map(record)},null,2);if(raw.length>1500000)throw Error('This notebook is too large for one backup. Copy individual plans before removing saved copies.');return raw;}
  function merge(existing,incoming){
    const seen=new Set(existing.map(r=>JSON.stringify({...kit.normalize(r),permission:false}))),added=[];
    for(const value of incoming){const r=record(value),key=JSON.stringify(r);if(!seen.has(key)){seen.add(key);added.push(r);}}
    if(existing.length+added.length>20)throw Error('This would exceed 20 saved contributions. Remove saved copies you no longer need, then review the backup again.');
    return added;
  }
  const api={pack,unpack,merge};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBContributionBackupKit=api;
})(typeof window==='undefined'?{}:window);
