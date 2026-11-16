/* Supabase sessions persist only in this tab's sessionStorage; private records are never cached. */
(function(root){
 'use strict';
 const SESSION_KEY='fb.cloud.session.v1',MAX_SESSION_MS=12*60*60*1000;
 function create(config,fetcher,options={}){
  const base=new URL(config.url);if(base.origin!=='https://ijvokvffhcvakaultzfk.supabase.co'||base.href!==base.origin+'/'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey||''))throw Error('Invalid cloud connection.');
  const send=fetcher||root.fetch.bind(root),now=options.now||Date.now;let storage=options.storage;
  if(storage===undefined)try{storage=root.sessionStorage;}catch{storage=null;}
  let session=null,generation=0,renewing=null;const pending=new Set();
  const tokenValid=value=>typeof value==='string'&&value.length>0&&value.length<=4096;
  function forget(){try{storage?.removeItem(SESSION_KEY);}catch{}}
  function suspend(){session=null;generation++;renewing=null;for(const c of pending)c.abort();}
  function clear(){suspend();forget();}
  function current(){if(session&&session.until<=now())clear();return session;}
  function persist(){if(!session?.refreshToken)return;try{storage?.setItem(SESSION_KEY,JSON.stringify({version:1,token:session.token,refreshToken:session.refreshToken,expiresAt:session.expiresAt,until:session.until}));}catch{forget();}}
  function saved(){try{const raw=storage?.getItem(SESSION_KEY);if(!raw)return null;if(raw.length>12000)throw Error();const s=JSON.parse(raw);if(s.version!==1||!tokenValid(s.token)||!tokenValid(s.refreshToken)||!Number.isFinite(s.expiresAt)||!Number.isFinite(s.until)||s.until<=now()||s.until>now()+MAX_SESSION_MS||s.expiresAt>now()+3600000)throw Error();return {...s,user:null};}catch{forget();return null;}}
  async function request(path,body,{anonymous=false,method='POST',credential,authRefresh=false}={}){
   const epoch=generation,active=anonymous?null:await ensure();if(epoch!==generation)throw Error('Session changed. Refresh before continuing.');
   const controller=new AbortController();pending.add(controller);const timer=setTimeout(()=>controller.abort(),15000);
   try{const headers={apikey:config.publishableKey,'Content-Type':'application/json'},token=credential||active?.token;if(token)headers.Authorization='Bearer '+token;if(path.includes('/functions/'))headers['Idempotency-Key']=root.crypto.randomUUID();
    const r=await send(base.origin+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});const data=await r.json().catch(()=>null);if(epoch!==generation)throw Error('Session changed. Refresh before continuing.');
    if(!r.ok){if(r.status===401||(authRefresh&&[400,403].includes(r.status)))clear();const e=Error(r.status===401||authRefresh&&[400,403].includes(r.status)?'Please sign in again.':r.status===429?(data?.message||'Please wait before trying again.'):path.includes('/functions/')?(data?.message||'Cloud action could not be confirmed.'):'Sign-in could not be verified.');e.code=data?.error;throw e;}return data;
   }finally{clearTimeout(timer);pending.delete(controller);}
  }
  async function verified(token){const user=await request('/auth/v1/user',undefined,{anonymous:true,method:'GET',credential:token});if(!user?.id||!user.email_confirmed_at){clear();throw Error('A verified email account is required.');}return user;}
  async function ensure(){
   const active=current();if(!active)throw Error('Please sign in again.');
   if(active.expiresAt>now()+60000)return active;
   if(!active.refreshToken){if(active.expiresAt<=now()){clear();throw Error('Please sign in again.');}return active;}
   if(renewing)return renewing;
   const epoch=generation;const work=(async()=>{
    const data=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:active.refreshToken},{anonymous:true,authRefresh:true});
    if(epoch!==generation)throw Error('Session changed. Refresh before continuing.');
    if(!tokenValid(data?.access_token)||!tokenValid(data?.refresh_token)||!Number.isFinite(Number(data.expires_in))||Number(data.expires_in)<=0){clear();throw Error('Please sign in again.');}
    const next={...active,user:null,token:data.access_token,refreshToken:data.refresh_token,expiresAt:now()+Math.min(3600,Number(data.expires_in))*1000};session=next;persist();const user=await verified(next.token);if(epoch!==generation||session!==next)throw Error('Session changed. Refresh before continuing.');if(active.user&&user.id!==active.user.id){clear();throw Error('Session changed. Please sign in again.');}next.user=user;return next;
   })();renewing=work;try{return await work;}finally{if(renewing===work)renewing=null;}
  }
  async function acceptToken(token,expiresIn,refreshToken){
   if(!tokenValid(token)||refreshToken!=null&&!tokenValid(refreshToken))throw Error('Invalid sign-in link.');clear();const epoch=generation,user=await verified(token);if(epoch!==generation)throw Error('Session changed. Refresh before continuing.');
   session={token,user,refreshToken:refreshToken||null,expiresAt:now()+Math.min(3600,Math.max(60,Number(expiresIn)||3600))*1000,until:now()+MAX_SESSION_MS};persist();return user;
  }
  async function restore(){
   if(!current())session=saved();if(!session)return null;const epoch=generation,active=await ensure(),user=active.user||await verified(active.token);if(epoch!==generation||session!==active)throw Error('Session changed. Refresh before continuing.');session.user=user;return user;
  }
  return {user:()=>{const s=current();return s&&s.expiresAt>now()?s.user:null;},clear,suspend,restore,
   needsRenewal:()=>Boolean(current()?.refreshToken&&session.expiresAt<=now()+60000),
   maintain:async()=>{await ensure();return session?.user;},
   sendEmail:async email=>(await request('/functions/v1/fb-collaboration',{operation:'sendCode',params:{email}},{anonymous:true})).data,
   acceptToken,
   signInPassword:async(email,password)=>{if(typeof password!=='string'||password.length<1||password.length>128)throw Error('Enter your password.');const data=await request('/auth/v1/token?grant_type=password',{email:email.trim(),password},{anonymous:true});return acceptToken(data.access_token,data.expires_in,data.refresh_token);},
   requestPasswordCode:async()=>{await request('/auth/v1/reauthenticate',undefined,{method:'GET'});return {message:'Check your account email for the security code. Enter it below with your new password.'};},
   setPassword:async(password,nonce)=>{if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Use a password with 12–128 characters.');if(typeof nonce!=='string'||!/^\d{6,10}$/.test(nonce))throw Error('Enter the security code from your account email.');await request('/auth/v1/user',{password,nonce},{method:'PUT'});return {message:'Password saved. You can now sign in with your email and password. Email sign-in still works.'};},
   verifyCode:async(email,token)=>{const data=await request('/auth/v1/verify',{email,token,type:'email'},{anonymous:true});return acceptToken(data.access_token,data.expires_in,data.refresh_token);},
   execute:async(operation,params={})=>{const result=await request('/functions/v1/fb-collaboration',{operation,params});return operation==='grant'?result:result.data;},
   signOut:async()=>{const previous=current();clear();if(previous)try{const r=await send(base.origin+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:config.publishableKey,Authorization:'Bearer '+previous.token},credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();}catch{throw Error('Signed out here. Server sign-out could not be confirmed.');}}
  };
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBCloudClient=api;
})(typeof window==='undefined'?globalThis:window);
