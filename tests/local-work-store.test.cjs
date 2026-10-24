const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../local-work-store.js');
function fixture(){let value=null,fail=false;const writes=[],notices=[];const storage={getItem:()=>value,setItem:(key,text)=>{if(fail)throw Error('Storage full');value=text;writes.push(text);},removeItem:()=>{value=null;writes.push(null);}};return {store:create(storage,'test',message=>notices.push(message)),writes,notices,value:()=>value,external:text=>value=text,fail:flag=>fail=flag};}
test('successive explicit writes and removal update the local baseline',()=>{
 const s=fixture();s.store.write('first');s.store.write('second');assert.equal(s.store.read(),'second');s.store.remove();assert.equal(s.value(),null);assert.equal(s.notices.length,0);
});
test('stale saves, deletes and undo-style writes cannot replace another tab’s work',()=>{
 for(const action of [s=>s.store.write('old edits'),s=>s.store.remove(),s=>s.store.write('old removed copy')]){
  const s=fixture();s.store.write('initial');s.external('newer work');assert.throws(()=>action(s),error=>error.code==='FB_STALE_STORE');assert.equal(s.value(),'newer work');assert.deepEqual(s.writes,['initial']);assert.match(s.notices[0],/another tab/);
 }
});
test('failed persistence retains the old baseline and allows a later retry',()=>{
 const s=fixture();s.fail(true);assert.throws(()=>s.store.write('draft'));assert.equal(s.store.read(),null);assert.equal(s.value(),null);s.fail(false);s.store.write('draft');assert.equal(s.value(),'draft');
});
