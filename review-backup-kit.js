/* Local founder review copies. Confirmation and sharing choices never transfer. */
(function(root){
  'use strict';
  const kit=typeof module==='object'&&module.exports?require('./interest-review-kit.js'):root.FBInterestReviewKit;
  const interestFields={title:160,project:160,deliverable:800,scope:12000,interestName:160,interestNote:2500,availability:800,questions:800};
  const reviewFields={deliverable:800,acceptance:800,exclusions:800,minutes:80,compensation:160,terms:800,support:800,reviewer:160,feedbackTiming:800,creditTerms:800,ownership:800,response:2500,observed:2500,strengths:2500,nextStep:2500,creditName:160,portfolioUse:800};
  function bounded(input,spec){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('The backup contains an invalid review.');
    for(const [field,max] of Object.entries(spec))if(input[field]!=null&&(typeof input[field]!=='string'||input[field].length>max))throw Error('The backup contains an invalid or oversized field.');
  }
  function record(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('The backup contains an invalid review.');
    bounded(value.interest,interestFields);bounded(value.review,reviewFields);
    if(!['reviewing','clarification','agreement','working','feedback','closed'].includes(value.review.phase))throw Error('The backup contains an unknown review stage.');
    for(const flag of ['confirmed','reviewed','creditAgreed'])if(value.review[flag]!=null&&typeof value.review[flag]!=='boolean')throw Error('The backup contains an invalid confirmation field.');
    const interest=kit.parseInterest(JSON.stringify(kit.interestPacket(value.interest,true))),review=kit.normalize(value.review);
    review.confirmed=false;review.reviewed=false;review.creditAgreed=false;
    return {interest,review};
  }
  function unpack(raw){
    if(typeof raw!=='string'||raw.length>1500000)throw Error('Use a founder review backup of at most 1.5 million characters.');
    let p;try{p=JSON.parse(raw);}catch(e){throw Error('This is not a valid founder review backup.');}
    if(!p||p.format!=='fb-founder-review-backup-v1'||!Array.isArray(p.records)||!p.records.length||p.records.length>20)throw Error('Use a supported founder review backup containing 1–20 reviews.');
    const seen=new Set();return p.records.map(record).filter(r=>{const key=JSON.stringify(r);if(seen.has(key))return false;seen.add(key);return true;});
  }
  function pack(records){
    if(!Array.isArray(records)||!records.length||records.length>20)throw Error('Save at least one founder review before preparing a backup.');
    const raw=JSON.stringify({format:'fb-founder-review-backup-v1',records:records.map(record)},null,2);
    if(raw.length>1500000)throw Error('These reviews are too large for one backup. Copy individual notes before removing saved copies.');
    return raw;
  }
  function merge(existing,incoming){
    const seen=new Set(existing.map(r=>JSON.stringify(record(r)))),added=[];
    for(const value of incoming){const r=record(value),key=JSON.stringify(r);if(!seen.has(key)){seen.add(key);added.push(r);}}
    if(existing.length+added.length>20)throw Error('This would exceed 20 saved reviews. Make room on this device, then review the backup again.');
    return added;
  }
  const api={pack,unpack,merge};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBReviewBackupKit=api;
})(typeof window==='undefined'?{}:window);
