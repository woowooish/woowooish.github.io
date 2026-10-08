'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const api = require(path.join(root, 'assets/woo-deck.js'));
const library = JSON.parse(fs.readFileSync(path.join(root, 'assets/woo-library.json'), 'utf8'));
let passed = 0;
function check(name, test) { assert.ok(test, name); passed++; console.log('PASS ' + name); }
function storage() {
  const values = new Map();
  return {getItem:key=>values.has(key)?values.get(key):null, setItem:(key,value)=>values.set(key,value), removeItem:key=>values.delete(key)};
}
function seeded(seed) { return n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor((seed/4294967296)*n);}; }
function mutex() { let queue = Promise.resolve();return {request:(_name,fn)=>{const job=queue.then(fn);queue=job.catch(()=>{});return job;}}; }
(async () => {
  const entries = api.validateLibrary(library);
  check('412 complete entries', entries.length === 412);
  check('21 labeled themes', new Set(entries.map(e=>e.theme)).size===21);
  for (const field of ['id','title','message','question']) check('Unique '+field,new Set(entries.map(e=>e[field].toLowerCase())).size===entries.length);
  check('Every entry has a question',entries.every(e=>e.question.endsWith('?')));
  check('All entries fit editorial length limits',entries.every(e=>e.title.length<=70&&e.message.length<=310&&e.question.length<=150));
  check('No authored em dashes in new files', ['assets/woo-library.json','assets/woo-deck.js','assets/pick-woo.js','pick-your-woo.html'].every(f=>!fs.readFileSync(path.join(root,f),'utf8').includes('\u2014')));
  check('Legacy twelve retained',entries.filter(e=>e.id.startsWith('original-')).length===12);
  check('No attributed teachers or scientific efficacy promises',!/(?:Bashar|Dispenza|Goenka|Hudson|\bcures?\b|\bheals?\b|\bdiagnos\w*\b)/i.test(JSON.stringify(entries)));
  check('Production engine has no calendar dependency', !/Date|dayOf|today|new Date|\.sort\(/.test(fs.readFileSync(path.join(root,'assets/woo-deck.js'),'utf8')));
  check('Invalid libraries fail clearly', (()=>{try{api.validateLibrary({schema:1,entries:[entries[0],entries[0]]});return false;}catch{return true;}})());
  let calls=0;
  const lazy=api.createPicker(entries,{storage:null,randomBelow:n=>{calls++;return n-1;}});
  check('No random choice at construction',calls===0);
  const first=await lazy.pick();
  check('One random choice at selection',calls===1&&first.entry.id===entries.at(-1).id);
  check('Only revealed item consumed',first.remaining===411);
  for(const seed of [1,12,123456,42,99999]) {
    const p=api.createPicker(entries,{storage:null,randomBelow:seeded(seed)});
    let previous=null;
    for(let round=1;round<=3;round++) {
      const seen=new Set();
      for(let i=0;i<entries.length;i++) {
        const draw=await p.pick();
        assert.equal(draw.cycle,round);
        assert.equal(seen.has(draw.entry.id),false);
        assert.notEqual(draw.entry.id,previous);
        seen.add(draw.entry.id);previous=draw.entry.id;
      }
      check('Seed '+seed+' entire distinct round '+round,seen.size===412);
    }
  }
  for(const randomBelow of [()=>0,n=>n-1]) {
    const p=api.createPicker(entries,{storage:null,randomBelow});
    const ids=[];for(let i=0;i<824;i++)ids.push((await p.pick()).entry.id);
    check('Extreme RNG still traverses every item',new Set(ids.slice(0,412)).size===412&&new Set(ids.slice(412)).size===412);
    check('Round boundary avoids preceding 32 picks', !new Set(ids.slice(380,412)).has(ids[412]));
  }
  const s=storage();let p=api.createPicker(entries,{storage:s,randomBelow:()=>0});
  const drawn=[];for(let i=0;i<70;i++)drawn.push((await p.pick()).entry.id);
  p=api.createPicker(entries,{storage:s,randomBelow:()=>0});
  const resumed=await p.pick();
  check('New picker resumes stored history',resumed.remaining===341&&!drawn.includes(resumed.entry.id));
  const saved=JSON.parse(s.getItem(api.KEY));
  check('Stored history contains only schema cycle and ID lists',Object.keys(saved).sort().join(',')==='cycle,recent,schema,seen'&&saved.seen.every(id=>typeof id==='string'));
  check('History stays compact',s.getItem(api.KEY).length<10000);
  s.setItem('unrelated-data','untouched');await p.reset();
  check('Reset touches no unrelated storage',s.getItem(api.KEY)===null&&s.getItem('unrelated-data')==='untouched');
  check('Reset creates a new first round',(await p.pick()).remaining===411);
  const absent=api.createPicker(entries,{storage:null,randomBelow:()=>0});
  check('Unavailable storage has no immediate repeat',(await absent.pick()).entry.id!==(await absent.pick()).entry.id);
  check('Unavailable storage status is honest',!(await absent.pick()).persisted);
  const denied=api.createPicker(entries,{storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}},randomBelow:()=>0});
  check('Denied storage falls back to memory',(await denied.pick()).entry.id!==(await denied.pick()).entry.id);
  const quota=storage();const remembered=api.createPicker(entries,{storage:quota,randomBelow:()=>0});
  await remembered.pick(); quota.setItem=()=>{throw Error('quota')};
  const fail=await remembered.pick(),afterFail=await remembered.pick();
  check('Quota failure does not reread stale history',!fail.persisted&&fail.entry.id!==afterFail.entry.id&&afterFail.remaining===409);
  check('Reset still removes older disk state after quota failure',(await remembered.reset()).removed&&quota.getItem(api.KEY)===null);
  const cannotRemove=storage();const refusal=api.createPicker(entries,{storage:cannotRemove});await refusal.pick();cannotRemove.removeItem=()=>{throw Error('blocked')};
  check('Reset deletion failure is reported',!(await refusal.reset()).removed);
  for(const bad of ['{bad json','null','[]',JSON.stringify({schema:2}),JSON.stringify({schema:1,cycle:-1,seen:[],recent:[]})]) {
    const broken=storage();broken.setItem(api.KEY,bad);const b=api.createPicker(entries,{storage:broken,randomBelow:()=>0});
    check('Malformed history recovers without breaking selection',(await b.pick()).historyRecovered&&(await b.pick()).remaining===410);
  }
  const partial=storage();partial.setItem(api.KEY,JSON.stringify({schema:1,cycle:1,seen:[entries[0].id,entries[0].id,'retired-id',42],recent:[entries[0].id]}));
  const fixed=await api.createPicker(entries,{storage:partial,randomBelow:()=>0}).pick();
  check('History deduplicates and removes invalid retired IDs',fixed.remaining===410&&fixed.entry.id!==entries[0].id);
  const expanded=entries.slice(0,4);const migration=storage();const a=api.createPicker(expanded,{storage:migration,randomBelow:()=>0});
  for(let i=0;i<4;i++)await a.pick();const b=api.createPicker(entries,{storage:migration,randomBelow:()=>0});
  check('New library items become eligible without losing old history',(await b.pick()).entry.id===entries[4].id);
  const reordered=api.createPicker([...entries].reverse(),{storage:migration,randomBelow:n=>n-1});
  check('Reordering content preserves stable-ID history',(await reordered.pick()).entry.id===entries[5].id);
  const shared=storage(),locks=mutex();const tabs=Array.from({length:5},()=>api.createPicker(entries,{storage:shared,locks,randomBelow:()=>0}));
  const simultaneous=await Promise.all(Array.from({length:200},(_,i)=>tabs[i%5].pick()));
  check('200 concurrent picks across five tabs have distinct IDs',new Set(simultaneous.map(x=>x.entry.id)).size===200);
  check('Cross-tab locks reported as coordinated',simultaneous.every(x=>x.coordinated));
  const noLock=api.createPicker(entries,{storage:storage(),locks:{request:()=>Promise.reject(Error('denied'))},randomBelow:()=>0});
  check('Lock denial falls back without losing sequential protection',(await noLock.pick()).entry.id!==(await noLock.pick()).entry.id);
  const badRng=api.createPicker(entries,{storage:storage(),randomBelow:()=>-1});
  await assert.rejects(badRng.pick());passed++;console.log('PASS Invalid RNG does not commit a draw');
  const script=fs.readFileSync(path.join(root,'assets/woo-deck.js'),'utf8');
  const values=[0xffffffff,7];const sandbox={Uint32Array,Math,crypto:{getRandomValues:a=>{a[0]=values.shift();return a;}}};vm.createContext(sandbox);vm.runInContext(script,sandbox);
  check('Crypto rejection sampling discards biased tail',sandbox.WooDeck.randomBelow(10)===7&&values.length===0);
  const lastRow={id:'xss-test',theme:'Test',title:'<script>bad()</script>',message:'Plain text only.',question:'Is this plain text?'};
  check('Library content remains data',api.validateLibrary({schema:1,entries:[entries[0],lastRow]})[1].title===lastRow.title);
  console.log(JSON.stringify({checks_passed:passed,library_size:entries.length,simulated_draws:6180+1648+200},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
