/* Unsent contribution text stays in this page's memory. Never writes browser storage. */
(function(root){
 'use strict';
 function create({onChange=()=>{}}={}){
  const values=new Map(),key=(context,label)=>JSON.stringify([context,label]);
  function bind(element,context,label){
   const id=key(context,label),initial=element.value;if(values.has(id))element.value=values.get(id);
   element.addEventListener('input',()=>{if(element.value===initial)values.delete(id);else values.set(id,element.value);onChange(values.size);});
  }
  function remove(context,labels){for(const label of labels)values.delete(key(context,label));onChange(values.size);}
  function clear(){values.clear();onChange(0);}
  return {bind,remove,clear,count:()=>values.size};
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.FBCloudDrafts=api;
})(typeof window==='undefined'?{}:window);
