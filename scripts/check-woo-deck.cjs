'use strict';
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');
const catalog = require('../assets/woo-library.js');
const api = require('../assets/woo-deck.js');
const entries = catalog.entries;
let checks = 0;
function check(name, test) { assert.ok(test, name); checks++; }
function store() { const values = new Map(); return {getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value), values}; }
function options(storage, day = '2026-10-07T12:00:00') { return {storage:()=>storage, locks:null, crypto:null, random:()=>0, now:()=>new Date(day)}; }
async function run() {
  check('412 complete records', entries.length === 412 && entries.every(e => ['id','theme','title','body','question'].every(k=>typeof e[k]==='string' && e[k].trim())));
  for (const field of ['id','title','body','question']) check('Unique '+field, new Set(entries.map(e=>e[field])).size === 412);
  check('20 new editorial themes', new Set(entries.slice(12).map(e=>e.theme)).size === 20);
  check('No injected markup or authored em dash', entries.every(e=>![e.title,e.body,e.question].some(t=>/[<>\u2014]/.test(t))));
  check('Source entries immutable',Object.isFrozen(entries) && entries.every(Object.isFrozen));
  let calls=0; const s=store();
  const deck=api.create(entries,{...options(s),random:()=>{calls++;return .37;}});
  check('No random draw on construction',calls===0 && s.getItem(api.storageKey)===null);
  const seen=new Set();
  for(let i=0;i<entries.length;i++) {
    const draw=await deck.next();
    assert.ok(!seen.has(draw.entry.id),'No repeat at pick '+(i+1)); seen.add(draw.entry.id);
    assert.equal(draw.persistent,true);assert.equal(draw.today,i+1);
  }
  check('Entire same-day collection drawn without repeat',seen.size===412);
  const history=s.getItem(api.storageKey),callsBefore=calls;
  const exhausted=await deck.next();
  check('Same-day exhaustion pauses without RNG or history reset',exhausted.exhausted && exhausted.entry===null && calls===callsBefore && s.getItem(api.storageKey)===history);
  const tomorrow=await api.create(entries,options(s,'2026-10-08T12:00:00')).next();
  check('New day starts another round',tomorrow.restarted && tomorrow.entry && tomorrow.today===1);
  check('Cycle boundary cannot repeat last pick',tomorrow.entry.id!==JSON.parse(history).last);
  const persisted=store();const first=await api.create(entries,options(persisted)).next();
  const second=await api.create(entries,options(persisted)).next();
  check('Reload preserves no-repeat history',first.entry.id!==second.entry.id);
  const third=await api.create(entries,options(persisted,'2026-10-08T12:00:00')).next();
  check('Next day does not reset full-history exclusion',![first.entry.id,second.entry.id].includes(third.entry.id));
  let day=new Date('2026-10-07T23:59:59');const clock=store();
  const changing=api.create(entries,{...options(clock),now:()=>day});
  const before=await changing.next();day=new Date('2026-10-08T00:00:01');const after=await changing.next();
  check('Midnight in open page does not replay a Woo',before.entry.id!==after.entry.id && after.today===1 && after.seen===2);
  const broken=api.create(entries,{...options(null),storage:()=>{throw Error('blocked');}});
  const b1=await broken.next(),b2=await broken.next();
  check('Blocked storage keeps in-page no-repeat behavior',!b1.persistent && !b2.persistent && b1.entry.id!==b2.entry.id);
  const failing=store();failing.setItem=()=>{throw Error('quota');};
  const quota=api.create(entries,options(failing));const q1=await quota.next(),q2=await quota.next();
  check('Write failure continues in memory without repeats',!q1.persistent && !q2.persistent && q1.entry.id!==q2.entry.id);
  for(const raw of ['bad json','null','4','[]','{"schema":9}',JSON.stringify({schema:1,seen:[],today:[],day:null})]) {
    const bad=store();bad.setItem(api.storageKey,raw);const draw=await api.create(entries,options(bad)).next();
    check('Malformed state recovered: '+raw.slice(0,20),draw.recovered && draw.entry && draw.persistent);
  }
  const stale=store();stale.setItem(api.storageKey,JSON.stringify({schema:1,seen:[entries[0].id,entries[0].id,'removed'],today:[entries[0].id,'removed'],last:entries[0].id,day:'2026-10-07',cycles:0}));
  const filtered=await api.create(entries,options(stale)).next();
  check('Duplicate and removed IDs filtered',filtered.seen===2 && filtered.today===2 && filtered.entry.id!==entries[0].id);
  const changed=store();const short=entries.slice(0,3);const small=api.create(short,options(changed));
  for(let i=0;i<3;i++)await small.next();
  const extended=await api.create(entries.slice(0,4),options(changed)).next();
  check('Library additions become available without resetting history',extended.entry.id===entries[3].id);
  const s2=store();const deck2=api.create(entries,options(s2));
  const burst=await Promise.all(Array.from({length:100},()=>deck2.next()));
  check('Concurrent same-page calls are serialized',new Set(burst.map(x=>x.entry.id)).size===100);
  let lockQueue=Promise.resolve(),lockCalls=0;
  const locks={request:(name,fn)=>{assert.equal(name,api.lockName);lockCalls++;const task=lockQueue.then(fn);lockQueue=task.catch(()=>{});return task;}};
  const shared=store(),a=api.create(entries,{...options(shared),locks}),b=api.create(entries,{...options(shared),locks});
  const across=await Promise.all(Array.from({length:200},(_,i)=>(i%2?a:b).next()));
  check('Mocked lock clients have 200 unique draws without claiming native transaction safety',lockCalls===200 && new Set(across.map(x=>x.entry.id)).size===200 && across.every(x=>!x.coordinated));
  let draws=0;
  const rejected=api.create(entries,{...options(store()),locks:{request:()=>Promise.reject(Error('locks denied'))},random:()=>{draws++;return 0;}});
  await assert.rejects(rejected.next());check('Rejected lock does not bypass coordination and draw',draws===0);
  let n=0;const cryptoMock={getRandomValues:array=>{array[0]=n++===0?0xffffffff:5;return array;}};
  check('Rejection sampling avoids modulo tail bias',api.randomIndex(3,cryptoMock,()=>.1)===2 && n===2);
  check('Unavailable crypto has a valid fallback',api.randomIndex(10,{getRandomValues:()=>{throw Error('no crypto');}},()=>.8)===8);
  assert.throws(()=>api.randomIndex(0,null,()=>0));checks++;
  assert.throws(()=>api.randomIndex(3,null,()=>1));checks++;
  check('Local calendar date, not UTC serialization',api.localDay(new Date(2026,9,7,23,55))==='2026-10-07');
  const simulated=store();let date=new Date(2026,0,1,12),simulation=api.create(entries,{...options(simulated),crypto:webcrypto,now:()=>date});
  const firstRound=new Set();let previous=null;let perDay=new Set();
  for(let i=0;i<3000;i++) {
    if(i%7===0){date=new Date(2026,0,1+Math.floor(i/7),12);perDay=new Set();}
    if(i%11===0)simulation=api.create(entries,{...options(simulated),crypto:webcrypto,now:()=>date});
    const draw=await simulation.next();assert.ok(draw.entry);assert.notEqual(draw.entry.id,previous);assert.ok(!perDay.has(draw.entry.id));
    if(i<412){assert.ok(!firstRound.has(draw.entry.id));firstRound.add(draw.entry.id);}
    previous=draw.entry.id;perDay.add(previous);
  }
  check('3000 picks across dates/reloads/rounds: no daily or consecutive repeats',firstRound.size===412);
  console.log(JSON.stringify({checks_passed:checks,simulation_draws:3000,total_entries:entries.length,status:'PASS'},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
