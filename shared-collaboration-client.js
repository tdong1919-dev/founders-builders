/* Same-origin transport. Account/agent credentials remain in memory, never browser storage. */
(function(root){
 'use strict';
 function create({fetcher,token,uuid}){
  let generation=0,closed=false;const pending=new Set();
  return {close(){closed=true;generation++;for(const c of pending)c.abort();},async execute(operation,params,requestId){
   if(closed)throw Error('This shared session is closed.');const epoch=generation,controller=new AbortController();pending.add(controller);
   const timeout=setTimeout(()=>controller.abort(),15000);
   try{const credential=await token();if(typeof credential!=='string'||credential.length<16)throw Error('Sign in to use the shared workspace.');
    if(epoch!==generation||closed)throw Error('Session changed. Refresh before continuing.');
    const r=await fetcher('/api/collaboration',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+credential,'Idempotency-Key':requestId||uuid()},body:JSON.stringify({operation,params:params||{}}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
    if(epoch!==generation||closed)throw Error('Session changed. Refresh before continuing.');const result=await r.json();if(epoch!==generation||closed)throw Error('Session changed. Refresh before continuing.');if(!r.ok){const e=Error(result.message||'Shared action was not confirmed.');e.code=result.error;throw e;}return result;
   }finally{clearTimeout(timeout);pending.delete(controller);}
  }};
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBSharedClient=api;
})(typeof window==='undefined'?{}:window);
