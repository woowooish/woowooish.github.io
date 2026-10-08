'use strict';
const assert = require('node:assert/strict');
const api = require('../assets/gratitude-store.js');
let checks=0;
function ok(name,fn){fn();checks++;}
const map = new Map();
const storage = {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
let i=0;let queue=Promise.resolve();
const locks = {request:(name,fn)=>{assert.equal(name,api.lockName);const task=queue.then(fn);queue=task.catch(()=>{});return task;}};
const options = {storage:()=>storage,locks,makeId:()=>`note-${++i}`,now:()=>new Date('2026-10-08T05:00:00Z')};
async function main(){
const first=api.create(options),second=api.create(options);
ok('empty storage is a valid empty jar',()=>assert.deepEqual(first.load().items,[]));
await first.add('  One ordinary detail.  ');
ok('add retains schema and trims text',()=>assert.equal(JSON.parse(map.get(api.key))[0].text,'One ordinary detail.'));
ok('recreated client retains note',()=>assert.equal(second.load().items.length,1));
await Promise.all(Array.from({length:100},(_,n)=>(n%2?first:second).add('Synthetic note '+n)));
ok('coordinated clients retain all additions',()=>assert.equal(first.load().items.length,101));
ok('all IDs unique',()=>assert.equal(new Set(first.load().items.map(n=>n.id)).size,101));
const id=first.load().items[0].id;await second.remove(id);
ok('remove only targeted note',()=>assert.equal(first.load().items.length,100));
await assert.rejects(first.remove(id),e=>e.code==='changed');checks++;
await assert.rejects(first.add(' '),e=>e.code==='invalid');checks++;
await assert.rejects(first.add('x'.repeat(501)),e=>e.code==='invalid');checks++;
const saved=map.get(api.key);
const bads=['not json','{}','null','[null]',JSON.stringify([{id:'n',text:'hello',date:'not a date'}]),
 JSON.stringify([{id:'n',text:'hello',date:'2026-01-01'},{id:'n',text:'other',date:'2026-01-01'}]),
 '['+' '.repeat(api.maxChars)+']'];
for(const raw of bads){map.set(api.key,raw);const client=api.create(options);assert.equal(client.load().blocked,true);await assert.rejects(client.add('Must not replace data'),e=>e.code==='unreadable');assert.equal(map.get(api.key),raw);checks++;}
map.set(api.key,saved);
const quota=api.create({...options,storage:()=>({getItem:storage.getItem,setItem(){throw new Error('quota');}})});
await assert.rejects(quota.add('Keep this in the input'),e=>e.code==='write');
ok('quota failure keeps old stored data',()=>assert.equal(map.get(api.key),saved));
const memory=api.create({...options,storage:()=>{throw Error('denied');}});
await memory.add('This visit only');ok('denied storage is explicit memory mode',()=>{assert.equal(memory.load().persistent,false);assert.equal(memory.load().items.length,1);});
const existing=first.load().items;
map.set(api.key,JSON.stringify([...existing,null]));
const partial=api.create(options);ok('partially malformed data is read-only but readable notes remain',()=>{assert.equal(partial.load().items.length,100);assert.equal(partial.load().blocked,true);});
map.set(api.key,saved);
const failLock=api.create({...options,locks:{request:()=>Promise.reject(Error('locked'))}});
await assert.rejects(failLock.add('no unsafe bypass'));ok('failed lock never writes',()=>assert.equal(map.get(api.key),saved));
const hostile='<img src=x onerror=alert(1)> & ordinary text';await first.add(hostile);
ok('note text retained literally',()=>assert.equal(first.load().items.at(-1).text,hostile));
const snapshot=first.load();snapshot.items[0].text='mutated';ok('snapshots do not leak mutable state',()=>assert.notEqual(first.load().items[0].text,'mutated'));
map.set(api.key,JSON.stringify(Array.from({length:2000},(_,n)=>({id:'limit-'+n,text:'A note',date:'2026-01-01'}))));
await assert.rejects(first.add('too many'),e=>e.code==='full');checks++;
console.log(JSON.stringify({status:'PASS',checks,coordinated_additions:100}));
}
main().catch(e=>{console.error(e);process.exit(1);});
