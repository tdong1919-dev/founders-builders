/* Participant-only, read-only context. No requests, storage, embeds or approval actions. */
(function(root){
 'use strict';
 const fields={deliverable:'Deliverable',acceptance:'What done means',outside:'Not included',minutes:'Time commitment',support:'Support',compensation:'Compensation',compensationDetails:'Compensation details',paymentAmount:'Total amount',paymentCurrency:'Currency',paymentTiming:'When payment is due',ownership:'Ownership',feedbackTiming:'Feedback timing',credit:'Credit and portfolio terms'};
 function evidenceLink(value){if(typeof value!=='string'||!value.trim()||value.length>800)return null;try{const u=new URL(value.trim());if(u.protocol!=='https:'||u.username||u.password)return null;return {href:u.href,host:u.host};}catch{return null;}}
 function model(contribution,userId){
  const c=contribution;if(!c||!userId||![c.founderId,c.builderId].includes(userId))return null;
  const version=c.terms?.version,confirmed=Number.isInteger(version)&&version>0&&c.acceptedTermsVersion===version;
  let scope=null;if(c.terms){const values=Object.entries(fields).flatMap(([key,label])=>{const value=c.terms[key];return typeof value==='string'&&value.trim()||typeof value==='number'&&Number.isFinite(value)?[{label,value:key==='minutes'?value+' minutes':key==='compensation'?({paid:'Paid · agreed directly',unpaid:'Voluntary / unpaid'}[value]||String(value)):String(value)}]:[];});if(values.length)scope={label:c.stage==='cancelled'?'Last recorded scope · collaboration ended':confirmed?'Confirmed scope · version '+version:c.stage==='terms'?'Proposed scope · awaiting confirmation':'Recorded scope · confirmation not recorded',confirmed,values};}
  const delivery=c.delivery&&typeof c.delivery.notes==='string'?{notes:c.delivery.notes,evidence:evidenceLink(c.delivery.evidence),invalidEvidence:Boolean(c.delivery.evidence)&&!evidenceLink(c.delivery.evidence),open:c.founderId===userId&&c.stage==='delivered'}:null;
  return scope||delivery?{scope,delivery}:null;
 }
 function render({document,parent,contribution,userId}){
  const data=model(contribution,userId);if(!data)return false;
  const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;},context=node('section');context.className='contribution-context';context.setAttribute('aria-label','Scope and delivered work');
  if(data.scope){const scope=node('details');scope.className='contribution-scope';scope.append(node('summary',data.scope.label));const list=node('dl');for(const field of data.scope.values)list.append(node('dt',field.label),node('dd',field.value));scope.append(list,node('p','Use the recorded terms as your reference. A message does not change the agreement.'));context.append(scope);}
  if(data.delivery){const work=node('details');work.open=data.delivery.open;work.className='contribution-delivery';work.append(node('summary','Delivered work'),node('p',data.delivery.notes));if(data.delivery.evidence){const link=node('a','Open shared evidence · '+data.delivery.evidence.host+' ↗');link.href=data.delivery.evidence.href;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';link.className='living-text-link';work.append(link,node('p','Opens an external site. This link is shared for collaboration review; portfolio sharing still needs separate approval.'));}else if(data.delivery.invalidEvidence)work.append(node('p','The recorded evidence link cannot be opened here. Ask your collaborator for an HTTPS link without embedded credentials.'));else work.append(node('p','No external evidence link was included. Review the delivery notes above.'));context.append(work);}
  parent.append(context);return true;
 }
 const api={model,render,evidenceLink};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBContributionContext=api;
})(typeof window==='undefined'?{}:window);
