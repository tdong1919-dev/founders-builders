const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function backend(){
 const sheets=new Map();let touches=0,fail=false;
 function sheet(rows=[]){return {rows:rows.map(r=>r.slice()),getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));},getRange(row,col,numRows,numCols){const self=this;return {getValues:()=>Array.from({length:numRows},(_,i)=>Array.from({length:numCols},(_,j)=>(self.rows[row-1+i]||[])[col-1+j]??'')),setValues(values){values.forEach((r,i)=>{self.rows[row-1+i]??=[];r.forEach((v,j)=>self.rows[row-1+i][col-1+j]=v);});}};},setFrozenRows(){},getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())};},appendRow(row){this.rows.push(row.slice());}};}
 const ctx={SpreadsheetApp:{getActiveSpreadsheet(){touches++;if(fail)throw Error('PRIVATE SHEET ID / credentials');return {getSheetByName:name=>sheets.get(name),insertSheet:name=>{const s=sheet();sheets.set(name,s);return s;}};}},Utilities:{getUuid:()=> '12345678-1234-1234-1234-123456789abc'},ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'javascript'},createTextOutput(text){return {text,setMimeType(mime){this.mime=mime;return this;}};}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../apps-script/Code.gs'),'utf8'),ctx);
 const get=(type,extra={})=>ctx.doGet({parameter:{...(type==null?{}:{type}),...extra}});
 const post=(data,params={})=>ctx.doPost({parameter:params,postData:{contents:JSON.stringify(data)}});
 return {ctx,sheets,seed:(name,rows)=>sheets.set(name,sheet(rows)),touches:()=>touches,fail:()=>fail=true,get,post,json:r=>JSON.parse(r.text)};
}
test('all private reads and anonymous admin/account writes are blocked before opening a sheet',()=>{
 const b=backend();for(const [type,entity] of Object.entries(b.ctx.ENTITIES))if(entity.public===false){const result=b.json(b.get(type));assert.equal(result.ok,false,type);assert.match(result.error,/authenticated/);}
 for(const type of ['account','savedItem','adminAction','chapter','activity','graphEdge','seedTemplate','__proto__','constructor','toString'])assert.equal(b.json(b.post({type,name:'Private',email:'a@example.com',action:'Reviewed'})).ok,false,type);
 assert.equal(b.touches(),0);
});
test('public reads suppress every nonpublic row and strip internal or undeclared columns at the server',()=>{
 const b=backend();const header=['id','title','description','email','moderationStatus','status','visibility','isPublic','ownerKey','accountEmail','adminNotes','credentials','verified'];
 const row=(id,patch={})=>header.map(k=>({id,title:'Public <screen>',description:'Safe public task',email:'owner@example.com',ownerKey:'PRIVATE OWNER',accountEmail:'PRIVATE ACCOUNT',adminNotes:'PRIVATE NOTES',credentials:'PRIVATE TOKEN',verified:'Yes',...patch})[k]??'');
 const rows=[row('public',{moderationStatus:'Active'}),row('legacy')];for(const state of ['demo','hidden','rejected','spam','blocked','archived','deleted','draft','private','pending','pending_review','pending review','unapproved','closed','Needs review','FUTURE UNKNOWN STATUS'])rows.push(row(state,{moderationStatus:' APPROVED ',status:' '+state.toUpperCase()+' '}));rows.push(row('private',{visibility:'private'}),row('notPublic',{isPublic:'false'}),row('falseVisibility',{visibility:false}));
 b.seed('Collabs',[header,...rows]);const r=b.json(b.get('collab'));assert.equal(r.ok,true);assert.equal(r.count,2);assert.equal(r.records[0].id,'legacy');assert.equal(r.records[1].title,'Public <screen>');assert.equal(r.records[1].email,'owner@example.com');assert.equal(r.records[1].verified,'Yes');assert.deepEqual(r.profiles,r.records);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|ownerKey|accountEmail|adminNotes|credentials/);
});
test('public appends preserve contracts, prevent metadata spoofing and never fill unknown sheet columns',()=>{
 const b=backend();b.seed('Collabs',[['id','timestamp','title','email','description','ownerKey','accountEmail','verified','reportCount','moderationStatus','lastUpdated','adminNotes']]);
 const result=b.json(b.post({type:'collab',title:'A task',email:'owner@example.com',description:'Public brief',ownerKey:'SPOOF',accountEmail:'SPOOF',verified:'Yes',reportCount:50,moderationStatus:'Approved',lastUpdated:'SPOOF',adminNotes:'PRIVATE'}));assert.equal(result.ok,true);assert.equal(result.id,'12345678');
 const s=b.sheets.get('Collabs'),saved=Object.fromEntries(s.rows[0].map((k,i)=>[k,s.rows[1][i]]));assert.equal(saved.title,'A task');assert.equal(saved.description,'Public brief');assert.equal(saved.ownerKey,'');assert.equal(saved.accountEmail,'');assert.equal(saved.verified,'');assert.equal(saved.reportCount,'0');assert.equal(saved.moderationStatus,'Active');assert.match(saved.lastUpdated,/^\d{4}-/);assert.equal(saved.adminNotes,'');
});
test('one-way private intake accepts requests but ignores caller-controlled workflow and admin notes',()=>{
 const b=backend();const samples={report:{reason:'Spam',details:'Please review',reporterEmail:'a@example.com',status:'Resolved'},conciergeRequest:{question:'Where can I contribute?',email:'a@example.com',status:'Resolved'},eventSource:{sourceName:'Public calendar',organizerEmail:'a@example.com',platform:'iCal feed',authMethod:'Public calendar/feed URL',permissionConfirmed:'Yes',attributionAccepted:true,reviewAccepted:'Yes',approvalStatus:'Approved',syncStatus:'Active',secretStatus:'Stored in Script Properties'}};
 for(const [type,data] of Object.entries(samples)){const r=b.json(b.post({type,...data,notes:'INJECTED PRIVATE NOTES',adminEmail:'attacker@example.com'}));assert.equal(r.ok,true,type);const s=b.sheets.get(b.ctx.ENTITIES[type].sheetName),saved=Object.fromEntries(s.rows[0].map((k,i)=>[k,s.rows[1][i]]));assert.notEqual(saved.status,'Resolved');assert.notEqual(saved.approvalStatus,'Approved');assert.notEqual(saved.syncStatus,'Active');assert.notEqual(saved.secretStatus,'Stored in Script Properties');assert.doesNotMatch(JSON.stringify(saved),/INJECTED|attacker/);assert.equal(b.json(b.get(type)).ok,false);}
});
test('callbacks are validated before sheet access and valid JSONP safely round-trips public text',()=>{
 const b=backend();for(const callback of ['x);alert(1)//','a.b','x[0]','x'.repeat(129),{},'\nalert']){const r=b.get('collab',{callback});assert.equal(r.mime,'json');assert.deepEqual(b.json(r),{ok:false,error:'Invalid callback.'});assert.equal(b.json(b.post({title:'X',email:'a@example.com'},{callback})).ok,false);}assert.equal(b.touches(),0);
 b.seed('Profiles',[['id','name','email'],['1','<script>\u2028\u2029','a@example.com']]);const r=b.get(null,{callback:'fb_platform_profile_123'});assert.equal(r.mime,'javascript');assert.doesNotMatch(r.text,/<script>/);const inside=r.text.slice('fb_platform_profile_123('.length,-1);assert.equal(JSON.parse(inside).records[0].name,'<script>\u2028\u2029');
});
test('invalid input, private intent and failed consent cannot write or leak internal errors',()=>{
 const b=backend();for(const patch of [{visibility:'private'},{isPublic:false},{status:'pending'},{name:{}},{name:'x'.repeat(20001)},{email:'not-email'}])assert.equal(b.json(b.post({name:'Name',email:'a@example.com',...patch})).ok,false);
 assert.equal(b.json(b.post({type:'eventSource',sourceName:'Calendar',organizerEmail:'a@example.com',platform:'iCal feed',authMethod:'Public calendar/feed URL',permissionConfirmed:'No',attributionAccepted:'Yes',reviewAccepted:'Yes'})).ok,false);assert.equal(b.touches(),0);
 assert.equal(b.json(b.ctx.doPost({postData:{contents:'{bad'}})).ok,false);assert.equal(b.json(b.post([])).ok,false);
 b.fail();assert.equal(b.json(b.get('collab')).error,'Unable to read public records.');assert.equal(b.json(b.post({title:'Task',email:'a@example.com',type:'collab'})).error,'Unable to save this submission.');
});
test('formulas are stored as literal text, valid enums and honeypots retain their contract',()=>{
 const b=backend();assert.equal(b.json(b.post({name:'Name',email:'a@example.com',company_website:'spam'})).ok,true);assert.equal(b.touches(),0);assert.equal(b.json(b.post({type:'collab',title:'Task',email:'a@example.com',category:'NOT A CATEGORY'})).ok,false);
 for(const title of ['=IMPORTXML("https://example.com","//x")','+formula','-formula','@formula']){assert.equal(b.json(b.post({type:'collab',title,email:'a@example.com'})).ok,true);const s=b.sheets.get('Collabs');assert.equal(s.rows.at(-1)[s.rows[0].indexOf('title')],"'"+title);}
});
test('default profile, public fields for every hub and investor classification remain compatible',()=>{
 const b=backend();assert.equal(b.json(b.post({name:'Member',email:'a@example.com'})).ok,true);assert.equal(b.json(b.get()).records[0].name,'Member');
 for(const type of Object.keys(b.ctx.PUBLIC_FORM_FIELDS)){assert.equal(b.ctx.ENTITIES[type].public===false,false,type);assert.equal(b.json(b.get(type)).ok,true,type);}
 assert.equal(b.json(b.post({type:'investor',investorType:'Angel',name:'Investor',email:'a@example.com'})).ok,true);assert.equal(b.json(b.get('investor')).records[0].type,'Angel');assert.equal(b.json(b.post({type:'VC Fund',name:'Fund',email:'a@example.com'},{type:'investor'})).ok,true);assert.equal(b.json(b.get('investor')).records[0].type,'VC Fund');
});
test('every public hub retains valid append/read behavior and a full founder task survives its API round trip',()=>{
 const b=backend();for(const [type,entity] of Object.entries(b.ctx.ENTITIES)){if(!Object.hasOwn(b.ctx.PUBLIC_FORM_FIELDS,type))continue;const data={type};for(const key of entity.required)data[key]=key==='email'?'a@example.com':key==='link'?'https://example.com':'Public '+key;if(type==='investor')data.investorType='Angel';assert.equal(b.json(b.post(data)).ok,true,type);assert.equal(b.json(b.get(type)).count,1,type);}
 const offers=require('../task-offer-kit.js'),journey=require('../task-journey-kit.js');const task={title:'Review one screen',project:'A public sample project',outcome:'Clarify a sign-up flow',deliverable:'Three observations',acceptance:'Reproducible notes',outside:'No production edits',skill:'Testing',experience:'Basic web navigation',minutes:60,support:'A sample and check-in',reviewer:'Owner',feedbackTiming:'Three days',compensation:'Paid',terms:'Fixed fee agreed directly',creditPolicy:'Anonymized notes only'};const brief=offers.brief(task);assert.equal(b.json(b.post({type:'collab',title:task.title,description:brief,email:'owner@example.com',category:'Project'})).ok,true);const found=b.json(b.get('collab')).records[0];assert.equal(found.description,brief);assert.equal(journey.parseListing(found).project,task.project);assert.equal(journey.parseListing(found).minutes,60);
});
test('public boundary remains fail-closed for a newly added type or a private-marked public type',()=>{
 const b=backend();b.ctx.ENTITIES.newType={sheetName:'New',headers:['id','name'],required:['name']};assert.equal(b.json(b.get('newType')).ok,false);assert.equal(b.json(b.post({type:'newType',name:'X'})).ok,false);b.ctx.ENTITIES.profile.public=false;assert.equal(b.json(b.get()).ok,false);assert.equal(b.json(b.post({name:'X',email:'a@example.com'})).ok,false);assert.equal(b.touches(),0);
});
