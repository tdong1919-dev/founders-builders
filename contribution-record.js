/* Private, read-only record. It does not publish or export portfolio content. */
(function(root){'use strict';
 function model(c,userId,reviews=[]){
  if(!c||!userId||![c.founderId,c.builderId].includes(userId))return null;
  const participants=[c.founderId,c.builderId],shared=reviews.filter(r=>r.contributionId===c.id&&participants.includes(r.authorId)&&participants.includes(r.recipientId)&&r.authorId!==r.recipientId&&r.visibility==='participants'&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5&&typeof r.worked==='string'&&typeof r.improve==='string');
  const approved=c.portfolioAllowed===true&&typeof c.feedback?.creditText==='string';
  return {id:c.id,stage:c.stage,application:typeof c.note==='string'?c.note:null,feedback:typeof c.feedback?.notes==='string'?c.feedback.notes:null,reviews:shared.map(r=>({author:r.authorId===userId?'Your review':r.authorId===c.founderId?'Founder review':'Builder review',rating:r.rating,worked:r.worked,improve:r.improve})),credit:{approved,text:approved?c.feedback.creditText:null,recorded:approved&&c.stage==='closed'&&c.creditRecorded===true},termsLabel:c.terms?(Number.isInteger(c.terms.version)&&c.terms.version>0&&c.acceptedTermsVersion===c.terms.version?'Agreement compensation':'Proposed compensation'):'Compensation at application',terms:c.terms||c.offeredCompensation||null};
 }
 function render({document,parent,contribution,userId,reviews=[],context,compensation}){
  const data=model(contribution,userId,reviews);if(!data)return false;
  const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;},record=node('details');record.className='contribution-record';record.open=['closed','delivered'].includes(data.stage);record.setAttribute('aria-label','Private contribution record');record.append(node('summary','Your contribution record'),node('p','Private to both participants. This is a record of collaboration, not independent verification or proof of payment.'));
  if(compensation){const pay=compensation.summary(data.terms);record.append(node('h3',data.termsLabel+' · '+pay.label),node('p',pay.detail),node('p',compensation.notice));}
  if(data.application){const details=node('details');details.append(node('summary','Original application'),node('p',data.application));record.append(details);}
  context?.render({document,parent:record,contribution,userId});
  record.append(node('h3','Feedback on delivered work'),node('p',data.feedback||'Feedback has not been recorded yet.'));
  const review=node('details');review.append(node('summary','Feedback from both sides'));for(const r of data.reviews)review.append(node('h4',r.author+' · '+r.rating+'/5'),node('p',r.worked),node('p','For next time: '+r.improve));if(data.reviews.length<2)review.append(node('p','Both participants can share a private review after completion. A missing review is not inferred.'));record.append(review);
  const credit=node('details');credit.append(node('summary','Portfolio permission'));if(data.credit.approved)credit.append(node('p','Approved text: '+data.credit.text),node('p',data.credit.recorded?'Approved credit recorded. Nothing is published automatically.':'This text is approved, but recording or exporting it is a separate action.'));else credit.append(node('p','Portfolio sharing is not approved or permission was revoked. Private feedback does not grant publishing rights.'));record.append(credit);parent.append(record);return true;
 }
 const api={model,render};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBContributionRecord=api;
})(typeof window==='undefined'?{}:window);
