/* Real Supabase session + cloud commands. Tokens remain in tab memory; no local fallback. */
(function(root){
 'use strict';
 function create(config,fetcher){
  const base=new URL(config.url);if(base.origin!=='https://ijvokvffhcvakaultzfk.supabase.co'||base.href!==base.origin+'/'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey||''))throw Error('Invalid cloud connection.');
  const send=fetcher||root.fetch.bind(root);let session=null,generation=0;const pending=new Set();
  function clear(){session=null;generation++;for(const c of pending)c.abort();}
  function current(){if(session&&session.expiresAt<=Date.now())clear();return session;}
  async function request(path,body,{anonymous=false,method='POST',credential}={}){
   const active=current(),epoch=generation;if(!anonymous&&!active&&!credential)throw Error('Please sign in again.');
   const controller=new AbortController();pending.add(controller);const timer=setTimeout(()=>controller.abort(),15000);
   try{const headers={apikey:config.publishableKey,'Content-Type':'application/json'};const token=credential||active?.token;if(token)headers.Authorization='Bearer '+token;if(path.includes('/functions/'))headers['Idempotency-Key']=root.crypto.randomUUID();
    const r=await send(base.origin+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});const data=await r.json().catch(()=>null);if(epoch!==generation)throw Error('Session changed. Refresh before continuing.');
    if(!r.ok){if(r.status===401)clear();const e=Error(r.status===401?'Please sign in again.':r.status===429?'Please wait before requesting another email.':path.includes('/functions/')?(data?.message||'Cloud action could not be confirmed.'):'Sign-in could not be verified.');e.code=data?.error;throw e;}return data;
   }finally{clearTimeout(timer);pending.delete(controller);}
  }
  async function acceptToken(token,expiresIn){if(typeof token!=='string'||token.length>4096||!token)throw Error('Invalid sign-in link.');clear();const user=await request('/auth/v1/user',undefined,{anonymous:true,method:'GET',credential:token});if(!user?.id||!user.email_confirmed_at)throw Error('A verified email account is required.');session={token,user,expiresAt:Date.now()+Math.min(3600,Math.max(60,Number(expiresIn)||3600))*1000};return user;}
  return {user:()=>current()?.user||null,clear,
   sendEmail:async email=>(await request('/functions/v1/fb-collaboration',{operation:'sendCode',params:{email}},{anonymous:true})).data,
   acceptToken,
   verifyCode:async(email,token)=>{const data=await request('/auth/v1/verify',{email,token,type:'email'},{anonymous:true});return acceptToken(data.access_token,data.expires_in);},
   execute:async(operation,params={})=>{const result=await request('/functions/v1/fb-collaboration',{operation,params});return operation==='grant'?result:result.data;},
   signOut:async()=>{const previous=current();clear();if(previous){const r=await send(base.origin+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:config.publishableKey,Authorization:'Bearer '+previous.token},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('Signed out here. Server sign-out could not be confirmed.');}}
  };
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBCloudClient=api;
})(typeof window==='undefined'?globalThis:window);
