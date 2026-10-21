/* Local-only handoff files. Existing packet validators remain the authority. */
(function(root){
  'use strict';
  const limits={interest:22000,return:18000};
  function prepare(raw,kind,record){
    if(!Object.prototype.hasOwnProperty.call(limits,kind))throw Error('Unsupported note type.');
    if(typeof raw!=='string')throw Error('Choose a valid JSON note file.');
    raw=raw.replace(/^\uFEFF/,'');
    if(raw.length>limits[kind])throw Error('This note is too large. Ask for a new note from the contribution tools.');
    let packet;
    if(kind==='interest'){
      const kit=typeof module==='object'&&module.exports?require('./interest-review-kit.js'):root.FBInterestReviewKit;
      packet=kit.interestPacket(kit.parseInterest(raw),true);
    }else{
      const kit=typeof module==='object'&&module.exports?require('./founder-return-kit.js'):root.FBFounderReturnKit;
      packet=kit.parse(raw,record).packet;
    }
    const text=JSON.stringify(packet);
    if(text.length>limits[kind])throw Error('This note is too large to share. Shorten its details first.');
    return text;
  }
  async function read(file,kind,record){
    if(!Object.prototype.hasOwnProperty.call(limits,kind))throw Error('Unsupported note type.');
    if(!file||!Number.isFinite(file.size)||file.size<0||file.size>limits[kind]*4||typeof file.text!=='function')throw Error('Choose a small JSON note file from the contribution tools.');
    if(!/\.json$/i.test(file.name||''))throw Error('Choose a .json note file, not a backup, document or image.');
    let raw;try{raw=await file.text();}catch(error){throw Error('This file could not be read. Try again or paste the note instead.');}
    return prepare(raw,kind,record);
  }
  function download(raw,kind,record){
    const text=prepare(raw,kind,record);
    if(!root.Blob||!root.URL?.createObjectURL)throw Error('File downloads are unavailable. Copy the note instead.');
    const url=root.URL.createObjectURL(new root.Blob([text],{type:'application/json;charset=utf-8'}));
    const link=root.document.createElement('a');
    try{
      link.href=url;link.download='founders-builders-'+(kind==='interest'?'interest':JSON.parse(text).format==='fb-founder-agreement-v1'?'agreement':'feedback')+'.json';
      root.document.body.append(link);link.click();
    }finally{link.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);}
  }
  function bindImport(options){
    const {input,textarea,status,kind,record,onChange}=options;let version=0;
    textarea.addEventListener('input',()=>{version++;status.textContent='';});
    input.addEventListener('change',async()=>{
      const ticket=++version,file=input.files?.[0];if(!file)return;
      if(onChange)onChange();
      const original=textarea.value,identity=record?JSON.stringify(record()):'';
      status.textContent='Checking note file on this device…';
      try{
        const text=await read(file,kind,record?record():undefined);
        if(ticket!==version)return;
        if(textarea.value!==original||(record&&JSON.stringify(record())!==identity)){
          status.textContent='Your open record or note changed. Choose the file again when ready; nothing was replaced.';return;
        }
        if(onChange)onChange();
        textarea.value=text;
        status.textContent=kind==='interest'?'File checked. Choose Open interest for review below. Nothing is saved or sent.':'File matches this record. Choose Review received note below, then check the details. Nothing is accepted or saved.';
      }catch(error){if(ticket===version)status.textContent=error.message;}
      finally{if(ticket===version)input.value='';}
    });
  }
  const api={prepare,read,download,bindImport};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FBHandoffFiles=api;
})(typeof window==='undefined'?{}:window);
