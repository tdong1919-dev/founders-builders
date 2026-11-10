(function(root){
  'use strict';
  const offers=typeof module==='object'&&module.exports?require('./task-offer-kit.js'):root.FBTaskOfferKit;
  const labels={project:'Project',outcome:'Why it matters',deliverable:'Deliverable',acceptance:'Done means',outside:'Outside this task',minutes:'Estimated time',skill:'Skill to practice',experience:'Starting knowledge',support:'Support',reviewer:'Reviewer',feedbackTiming:'Feedback',compensation:'Compensation',creditPolicy:'Credit and portfolio use'};
  function parseListing(record){
    if(!record||typeof record.description!=='string'||record.description.length>15000)return null;
    const text=record.description.replace(/\r\n?/g,'\n');if(!text.startsWith('Small contribution · '))return null;
    const r={title:String(record.title||text.split('\n')[0].slice(21))};let field=null;
    const keys=Object.keys(labels);
    for(const line of text.split('\n').slice(1)){
      if(line.startsWith('Confirm scope, timing, compensation'))break;
      const key=keys.find(k=>line.startsWith(labels[k]+': '));
      if(key){if(r[key]!==undefined)return null;field=key;r[key]=line.slice(labels[key].length+2);}
      else if(field)r[field]+='\n'+line;
    }
    const time=/^(\d+) minutes; agree a stop point before starting\.$/.exec(String(r.minutes||'').trim());if(!time)return null;r.minutes=Number(time[1]);
    const comp=String(r.compensation||'').trim().split(' — ');r.compensation=comp.shift();r.terms=comp.join(' — ');
    return offers.validate(r)?null:offers.normalize(r);
  }
  function pack(task,source){const error=offers.validate(task);if(error)throw Error(error);const r=offers.normalize(task);const clean={};Object.keys(labels).concat(['title','terms']).forEach(k=>clean[k]=r[k]);return {format:'fb-task-interest-v1',source:source==='public'?'public':'local-draft',task:clean};}
  function unpack(raw){if(typeof raw!=='string'||raw.length>20000)throw Error('Task draft is missing or too large.');const p=JSON.parse(raw);if(!p||p.format!=='fb-task-interest-v1'||!['public','local-draft'].includes(p.source)||!p.task||typeof p.task!=='object')throw Error('This task draft could not be read.');const safe=pack(p.task,p.source);const t=safe.task;return {title:t.title,project:t.project,skill:t.skill,deliverable:t.deliverable,collaborator:t.reviewer,nextStep:'Confirm the scope, '+t.minutes+'-minute time limit, compensation ('+t.compensation+'), feedback timing, ownership, and portfolio permission before starting.',scope:(safe.source==='public'?'From a public listing · unverified':'Local founder draft · not published')+'\n\n'+offers.brief(t),status:'interest',permission:false,feedback:'',creditAgreement:'',result:'',credit:''};}
  const api={parseListing,pack,unpack};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBTaskJourneyKit=api;
})(typeof window==='undefined'?{}:window);
