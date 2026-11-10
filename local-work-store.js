/* Detect stale local copies before writing. Never sends data or reloads forms. */
(function(root){
  'use strict';
  function create(storage,key,onConflict){
    let baseline=storage.getItem(key);
    function check(){
      if(storage.getItem(key)===baseline)return;
      const message='Saved work changed in another tab. Your open notes are preserved. Copy unsaved notes before reloading to load the latest saved work. Nothing was overwritten.';
      if(onConflict)onConflict(message);
      const error=Error(message);error.code='FB_STALE_STORE';throw error;
    }
    return {
      read:()=>baseline,
      write:function(text){if(typeof text!=='string')throw Error('Invalid saved work.');check();storage.setItem(key,text);baseline=text;},
      remove:function(){check();storage.removeItem(key);baseline=null;}
    };
  }
  const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBLocalWorkStore=api;
})(typeof window==='undefined'?{}:window);
