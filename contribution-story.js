/* Private editorial preparation only. No publication, storage, network or consent inference. */
(function(root){
 'use strict';
 function prepare({contribution:c,task,userId,preview=false}){
  if(preview)throw Error('Fictional examples cannot become public contribution stories.');
  if(!c||![c.founderId,c.builderId].includes(userId))throw Error('Open your own contribution before preparing a story.');
  if(c.stage!=='closed'||!c.delivery||!c.terms||!Number.isInteger(c.terms.version)||c.terms.version<1||c.acceptedTermsVersion!==c.terms.version)throw Error('A story needs completed work under confirmed terms.');
  return ['PRIVATE STORY DRAFT — NOT APPROVED FOR PUBLICATION','',
   'Use this as a starting point. Remove confidential details before sharing it for review.',
   'Public project name or alias: [choose together]',
   'Public participant names or aliases: [each person chooses]',
   'Agreed outcome: '+String(c.terms.deliverable||''),
   'Recorded delivery: '+String(c.delivery.notes||''),
   'What changed: [describe an outcome you can substantiate; no invented metrics]',
   'What each person learned: [ask both people; do not copy private reviews]',
   'Public evidence: [only a link both people are permitted to share]','',
   'Before publication: both participants must approve the exact final text, names, evidence, destination and permitted use. Record those approvals privately with the operator.',
   'Portfolio permission is separate from permission to use a story in platform marketing.',
   'Completion and recorded feedback do not verify payment. Do not describe this as a verified payment or guaranteed result.'
  ].join('\n');
 }
 if(typeof module==='object'&&module.exports)module.exports={prepare};else root.FBContributionStory={prepare};
})(typeof window==='object'?window:globalThis);
