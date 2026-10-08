'use strict';
// Temporary CI diagnostic. Keep all assertions; add synthetic cross-tab outcomes on failure.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'check-browser-runtime.cjs');
let code=fs.readFileSync(filename,'utf8');
code=code.replace("const deck=WooDeck.create(WooLibrary.entries);return Promise.all(Array.from({length:100},()=>deck.next().then(r=>r.entry.id)))", "const deck=WooDeck.create(WooLibrary.entries,{crypto:null,random:()=>0});return Promise.all(Array.from({length:100},()=>deck.next().then(r=>({id:r.entry.id,persistent:r.persistent,coordinated:r.coordinated,seen:r.seen}))))");
code=code.replace("const results=await Promise.all([tab.eval(draw),other.eval(draw)]);",`const outcomes=await Promise.all([tab.eval(draw),other.eval(draw)]);
    console.log('DRAW_DIAGNOSTICS',JSON.stringify({first:outcomes.map(x=>x.slice(0,12)),last:outcomes.map(x=>x.slice(-3)),storage:await Promise.all([tab,other].map(p=>p.eval("({origin:location.origin,state:JSON.parse(localStorage.getItem(WooDeck.storageKey)),locks:typeof navigator.locks.request})")))}));
    const results=outcomes.map(x=>x.map(y=>y.id));`);
const audit=new Module(filename,module);audit.filename=filename;audit.paths=module.paths;audit._compile(code,filename);
