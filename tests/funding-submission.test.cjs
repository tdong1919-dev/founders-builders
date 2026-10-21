const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function setup({fail=false}={}){
 const fields=[{name:'name',value:'Fictional investor'},{name:'email',value:'a@example.com'},{name:'type',value:'Angel'},{name:'disclaimerAccepted',type:'checkbox',checked:true,value:'Yes'}];let submit,request,reset=false;const form={elements:fields,querySelector:()=>fields[3],addEventListener:(name,fn)=>submit=fn,reset:()=>reset=true};const status={},button={},location={href:''};
 vm.runInNewContext(fs.readFileSync(require.resolve('../funding.js'),'utf8'),{window:{FB_CONFIG:{PROFILES_API:'https://example.com/exec'},location},document:{getElementById:id=>({investorForm:form,formStatus:status,submitBtn:button})[id]||null},fetch:(url,options)=>{request=options;return fail?Promise.reject(Error('network')):Promise.resolve({type:'opaque'});},setTimeout:()=>{},console});
 return {fields,status,button,location,request:()=>request,reset:()=>reset,submit:async()=>{submit({preventDefault(){}});await Promise.resolve();await Promise.resolve();}};
}
test('investor routing preserves the chosen classification and an opaque response never claims publication',async()=>{
 const s=setup();await s.submit();const body=JSON.parse(s.request().body);assert.equal(body.type,'investor');assert.equal(body.investorType,'Angel');assert.equal(body.email,'a@example.com');assert.equal(s.reset(),false);assert.equal(s.location.href,'');assert.equal(s.button.disabled,true);assert.match(s.status.textContent,/Publication has not been confirmed/);assert.equal(s.fields[0].value,'Fictional investor');
});
test('a funding network failure preserves the form and allows a retry',async()=>{
 const s=setup({fail:true});await s.submit();assert.equal(s.button.disabled,false);assert.equal(s.reset(),false);assert.match(s.status.textContent,/Something went wrong/);
});
