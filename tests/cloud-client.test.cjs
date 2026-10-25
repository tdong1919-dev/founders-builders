const {test}=require('node:test'),assert=require('node:assert/strict'),{create}=require('../cloud-client.js');
const config={url:'https://ijvokvffhcvakaultzfk.supabase.co',publishableKey:'sb_publishable_test_only'};
test('cloud transport verifies a real auth user before using a session and never sends an API key as bearer',async()=>{
 const calls=[],client=create(config,async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(url.endsWith('/user')?{id:'owner',email:'owner@example.test',email_confirmed_at:'now'}:{data:{tasks:[],contributions:[],grants:[]}}));});
 await assert.rejects(client.execute('list'),/sign in/);await client.acceptToken('signed_test_access_token',3600);await client.execute('list');assert.equal(calls[0].options.headers.Authorization,'Bearer signed_test_access_token');assert.equal(calls[1].options.headers.apikey,config.publishableKey);assert.equal(calls[1].options.credentials,'omit');assert.ok(calls[1].options.headers['Idempotency-Key']);client.clear();assert.equal(client.user(),null);
});
test('unauthenticated login email operation has no bearer and rejected verification grants no session',async()=>{
 const calls=[],client=create(config,async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(url.endsWith('/user')?{id:'unverified'}:{data:{message:'Check your email'}}));});
 assert.equal((await client.sendEmail('owner@example.test')).message,'Check your email');assert.equal(calls[0].options.headers.Authorization,undefined);await assert.rejects(client.acceptToken('signed_test_access_token',3600),/verified/);assert.equal(client.user(),null);
});
test('sign-out immediately clears identity and invalidates late cloud responses',async()=>{
 let release;const client=create(config,async(url)=>url.endsWith('/user')?new Response(JSON.stringify({id:'owner',email_confirmed_at:'now'})):new Promise(r=>release=r));await client.acceptToken('signed_test_access_token',3600);const pending=client.execute('list');client.clear();release(new Response(JSON.stringify({data:{tasks:['private']}})));await assert.rejects(pending,/Session changed/);assert.equal(client.user(),null);
});
test('wrong project or secret keys cannot initialize the browser cloud client',()=>{
 assert.throws(()=>create({...config,url:'https://wrong.supabase.co'}),/connection/);assert.throws(()=>create({...config,publishableKey:'sb_secret_not_allowed'}),/connection/);
});
