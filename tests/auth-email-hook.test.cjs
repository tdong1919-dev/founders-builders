const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const {randomBytes}=require('node:crypto');
const {Webhook}=createRequire(require.resolve('../supabase/functions/fb-auth-email/package.json'))('standardwebhooks');
const secret='whsec_'+randomBytes(32).toString('base64');
const verifier=new Webhook(secret),fakeHash='a'.repeat(56);
const target='https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-auth-email';
function event(type='magiclink') {return {user:{email:'owner@example.invalid',new_email:'new@example.invalid',user_metadata:{arbitrary:'NEVER INCLUDE THIS PRIVATE BIO'}},email_data:{email_action_type:type,token:'12345678',token_hash:fakeHash,token_new:'87654321',token_hash_new:'b'.repeat(56),site_url:'https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html',redirect_to:'https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html'}};}
function signed(payload=event(),options={}) {
 const id=options.id||'msg_test_1',date=options.date||new Date(),raw=options.raw||JSON.stringify(payload);
 return new Request(target,{method:'POST',headers:{'Content-Type':'application/json','webhook-id':id,'webhook-timestamp':String(Math.floor(date.getTime()/1000)),'webhook-signature':options.signature||verifier.sign(id,date,raw)},body:raw});
}
async function setup(overrides={}) {
 const api=await import('../supabase/functions/fb-auth-email/handler.mjs'),sent=[];
 const handler=api.createAuthEmail({Webhook,secret:'v1,'+secret,apiKey:'re_fictional_only',fetcher:async(url,options)=>{sent.push({url,options,mail:JSON.parse(options.body)});return Response.json({id:'provider-fixture-id'});},...overrides});
 return {...api,handler,sent};
}
const status=async(s,request)=>(await s.handler(request)).status;
test('signed real-library verification sends branded mail with explicit Reply-To and no client-controlled headers',async()=>{
 const s=await setup(),r=await s.handler(signed());
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{});assert.equal(s.sent.length,1);
 const {mail,url,options}=s.sent[0];
 assert.equal(url,'https://api.resend.com/emails');assert.equal(mail.from,s.FROM);
 assert.deepEqual(mail.reply_to,['support@getjidoka.com']);assert.deepEqual(mail.to,['owner@example.invalid']);
 assert.match(mail.html,/Crystal Dong/);assert.match(mail.html,/crystalthuydong/);
 assert.doesNotMatch(JSON.stringify(mail),/PRIVATE BIO|user_metadata|undefined|\{\{/);
 const link=new URL(mail.html.match(/href="(https:\/\/ijvok[^\"]+)"/)[1].replaceAll('&amp;','&'));
 assert.equal(link.searchParams.get('token'),fakeHash);assert.equal(link.searchParams.get('type'),'magiclink');assert.equal(link.searchParams.get('redirect_to'),s.WORKSPACE);
 assert.ok(!options.headers['Idempotency-Key'].includes('owner'));
});
test('reauthentication preserves code without links or code in subject; security notifications omit tokens',async()=>{
 const s=await setup();assert.equal(await status(s,signed(event('reauthentication'))),200);
 const m=s.sent[0].mail;assert.match(m.html,/12345678/);assert.doesNotMatch(m.subject,/12345678/);assert.doesNotMatch(m.html,/auth\/v1\/verify|ConfirmationURL/);
 s.sent.length=0;assert.equal(await status(s,signed(event('password_changed_notification'))),200);
 assert.doesNotMatch(JSON.stringify(s.sent[0].mail),/12345678|87654321|token_hash|PRIVATE BIO/);
});
test('email change uses documented current/new recipient and reversed hash mapping',async()=>{
 const s=await setup(),items=s.messages(event('email_change'));
 assert.equal(items.length,2);assert.deepEqual(items.map(m=>m.to[0]),['owner@example.invalid','new@example.invalid']);
 assert.ok(items[0].html.includes('b'.repeat(56))&&items[0].html.includes('12345678'));
 assert.ok(items[1].html.includes(fakeHash)&&items[1].html.includes('87654321'));
 const one=event('email_change');one.email_data.token_hash_new='';one.email_data.token_new='';
 assert.equal(s.messages(one).length,1);assert.match(s.messages(one)[0].html,/12345678/);
});
test('existing auth actions preserve flow type; every security notification uses fixed Reply-To',async()=>{
 const s=await setup();
 for(const type of ['signup','invite','email','recovery']) {const mail=s.messages(event(type))[0];assert.ok(mail.html.includes('type='+type));assert.deepEqual(mail.reply_to,[s.REPLY_TO]);}
 for(const type of ['email_changed_notification','phone_changed_notification','identity_linked_notification','identity_unlinked_notification','mfa_factor_enrolled_notification','mfa_factor_unenrolled_notification'])assert.equal(s.messages(event(type)).length,1);
});
test('unsigned, stale, tampered, browser-origin, unknown-action and oversized requests never send',async()=>{
 const s=await setup();
 assert.equal(await status(s,new Request(target,{method:'POST',body:'{}'})),401);
 assert.equal(await status(s,signed(event(),{date:new Date(Date.now()-600000)})),401);
 assert.equal(await status(s,signed(event(),{date:new Date(Date.now()+600000)})),401);
 const headers=new Headers(signed().headers);
 assert.equal(await status(s,new Request(target,{method:'POST',headers,body:JSON.stringify({...event(),user:{email:'attacker@example.invalid'}})})),401);
 headers.set('Origin','https://attacker.invalid');
 assert.equal(await status(s,new Request(target,{method:'POST',headers,body:'{}'})),403);
 assert.equal(await status(s,signed(event('unknown'))),400);
 assert.equal(await status(s,signed(event(),{raw:'x'.repeat(131073)})),413);
 assert.equal(s.sent.length,0);
});
test('header-injection recipients and malformed code/hash fail before provider delivery',async()=>{
 const s=await setup();
 for(const alter of [e=>e.user.email='a@example.invalid\r\nBcc:other@example.invalid',e=>e.email_data.token='<script>',e=>e.email_data.token_hash='../../not-a-token']) {const e=event();alter(e);assert.equal(await status(s,signed(e)),400);}
 assert.equal(s.sent.length,0);
});
test('missing secrets/wrong project fail closed; provider errors are sanitized; retries reuse a key',async()=>{
 for(const config of [{secret:''},{apiKey:''},{projectUrl:'https://wrong.supabase.co'}]) {const bad=await setup(config);assert.equal(await status(bad,signed()),503);assert.equal(bad.sent.length,0);}
 const broken=await setup({fetcher:async()=>Response.json({message:'PRIVATE PROVIDER KEY DETAILS'},{status:403})});
 const r=await broken.handler(signed());assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/PRIVATE PROVIDER/);
 const s=await setup();await s.handler(signed());await s.handler(signed());assert.equal(s.sent[0].options.headers['Idempotency-Key'],s.sent[1].options.headers['Idempotency-Key']);
 assert.equal(await status(s,new Request(target)),405);
});

test('incoming site and redirect settings never control the generated sign-in destination',async()=>{const s=await setup();const e=event();e.email_data.site_url='http://localhost:3000';e.email_data.redirect_to='https://attacker.invalid/capture?x=1';assert.equal(await status(s,signed(e)),200);const body=JSON.stringify(s.sent[0]);assert.doesNotMatch(body,/attacker.invalid|localhost/);assert.match(body,/cloud-workspace/);});
