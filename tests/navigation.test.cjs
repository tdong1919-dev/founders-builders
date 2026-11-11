const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
function setup(){
 const handlers={},events={},classes=new Set();let focused=false;
 const links={classList:{remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:k=>{if(classes.has(k)){classes.delete(k);return false;}classes.add(k);return true;}},querySelectorAll:()=>[link]};
 let destination='workspace.html';const link={getAttribute:()=>destination,setAttribute:(k,v)=>destination=v,addEventListener:(name,fn)=>handlers['link-'+name]=fn};
 const attrs={},toggle={setAttribute:(k,v)=>attrs[k]=v,addEventListener:(name,fn)=>handlers['toggle-'+name]=fn,focus:()=>focused=true};
 const nav={classList:{toggle(){}},contains:target=>target==='inside'};
 const document={getElementById:id=>({nav,primaryLinks:links,navToggle:toggle}[id]||null),addEventListener:(name,fn)=>handlers[name]=fn};
 vm.runInNewContext(fs.readFileSync(require.resolve('../navigation.js'),'utf8'),{document,window:{scrollY:0,addEventListener:(name,fn)=>events[name]=fn}});
 return {destination:()=>destination,handlers,attrs,classes,focused:()=>focused};
}
test('shared mobile menu updates aria and returns focus when Escape closes it',()=>{
 const s=setup();s.handlers['toggle-click']();assert.equal(s.attrs['aria-expanded'],'true');
 s.handlers.keydown({key:'Escape'});assert.equal(s.attrs['aria-expanded'],'false');assert.equal(s.classes.has('open'),false);assert.equal(s.focused(),true);
});
test('navigation closes after following a link or clicking outside',()=>{
 const s=setup();s.handlers['toggle-click']();s.handlers['link-click']();assert.equal(s.attrs['aria-expanded'],'false');
 s.handlers['toggle-click']();s.handlers.click({target:'outside'});assert.equal(s.classes.has('open'),false);
});
test('every full-navigation branded page keeps the same four primary destinations',()=>{
 const root=path.resolve(__dirname,'..');let count=0;
 for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
  const html=fs.readFileSync(path.join(root,name),'utf8');if(!html.includes('brand-system.css'))continue;if(name==='quick-tour.html'){assert.match(html,/<a href="index.html">Back to home<\/a>/);assert.match(html,/id="tourFounder"/);continue;}count++;
  const nav=html.match(/<nav class="nav__links"[^>]*>([\s\S]*?)<\/nav>/);assert.ok(nav, name);
  assert.deepEqual([...nav[1].matchAll(/href="([^"]+)"/g)].map(m=>m[1]),['/opportunities/','/builders/','community.html','cloud-workspace.html'],name);
  assert.ok(html.includes('navigation.js'),name);assert.ok(html.includes('aria-controls="primaryLinks"'),name);
 }
 assert.ok(count>=40);
});
test('direct links reveal collapsed journey steps on initial load and hash changes',()=>{
 const events={},outer={tagName:'DETAILS',open:false,parentElement:null};
 let scrolled=0;
 const step={tagName:'DETAILS',open:false,parentElement:outer,scrollIntoView:()=>scrolled++};
 const window={location:{hash:'#founder-return'},addEventListener:(name,fn)=>events[name]=fn};
 const document={getElementById:id=>id==='founder-return'?step:null};
 vm.runInNewContext(fs.readFileSync(require.resolve('../navigation.js'),'utf8'),{document,window});
 assert.equal(step.open,true);assert.equal(outer.open,true);assert.equal(scrolled,1);
 step.open=false;events.hashchange();assert.equal(step.open,true);assert.equal(scrolled,2);
 window.location.hash='#%ZZ';assert.doesNotThrow(()=>events.hashchange());
 window.location.hash='#missing';assert.doesNotThrow(()=>events.hashchange());assert.equal(scrolled,2);
});

test('Workspace navigation opens the real cloud entry point',()=>{assert.equal(setup().destination(),'cloud-workspace.html');});
