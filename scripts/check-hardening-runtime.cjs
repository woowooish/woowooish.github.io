'use strict';
/* Full-hardening regression cases using native Chromium storage. Synthetic data only. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const failures=[];let count=0;function check(name,value){assert(value,name);console.log('PASS '+name);count++;}
class Tab{
 constructor(ws){this.ws=ws;this.i=0;this.pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.t);this.pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);});}
 static async open(url){const ws=new WebSocket(url);await new Promise((ok,no)=>{const t=setTimeout(()=>no(Error('CDP connection timeout')),10000);ws.addEventListener('open',()=>{clearTimeout(t);ok();},{once:true});ws.addEventListener('error',()=>{clearTimeout(t);no(Error('CDP connection failed'));},{once:true});});return new Tab(ws);}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.i,t=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method));},20000);this.pending.set(id,{resolve,reject,t});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 async wait(expression){for(let n=0;n<250;n++){if(await this.eval(expression))return;await sleep(40);}throw Error('Condition timed out: '+expression);}
 close(){for(const p of this.pending.values())clearTimeout(p.t);this.ws.close();}
}
async function main(){
 const exe=process.env.CHROMIUM_EXECUTABLE||['google-chrome','google-chrome-stable','chromium'].map(n=>spawnSync('which',[n],{encoding:'utf8'}).stdout.trim()).find(Boolean);assert(exe,'Chrome required');
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'woo-legacy-'));const downloads=path.join(work,'downloads');fs.mkdirSync(downloads);
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp'};
 const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}let file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const chrome=spawn(exe,['--headless=new','--no-sandbox','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+path.join(work,'profile'),'about:blank'],{stdio:['ignore','ignore','pipe']});let log='';chrome.stderr.on('data',c=>log+=c);
 let browser;const tabs=[];
 try{
  for(let n=0;n<300&&!log.includes('DevTools listening on');n++)await sleep(40);
  const endpoint=log.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];assert(endpoint,'Chrome started');browser=await Tab.open(endpoint);const port=new URL(endpoint).port;
  await browser.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  async function tab(){const target=await browser.send('Target.createTarget',{url:'about:blank'});const list=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();const t=await Tab.open(list.find(x=>x.id===target.targetId).webSocketDebuggerUrl);tabs.push(t);await t.send('Page.enable');await t.send('Network.enable');await t.send('Network.setBlockedURLs',{urls:['https://*']});return t;}
  async function go(t,route){const r=await t.send('Page.navigate',{url:origin+route});assert(!r.errorText,r.errorText);await t.wait(`location.href===${JSON.stringify(origin+route)}&&document.readyState==='complete'`);}

  const older=await tab(),current=await tab();await go(older,'/privacy.html');
  const jarKey='woowooish-gratitude-v1',wooKey='woowooish.pick.history.v1';
  const note=(id,text='SYNTHETIC '+id)=>({id,text,date:'2026-01-01T00:00:00.000Z'});
  async function scenario(name,run){try{await run();}catch(e){failures.push({name,error:e.message});console.error('FAIL '+name+': '+e.message);}}
  async function raw(key,value){
    await current.eval(`(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('woowooish.browser-data.v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('values');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});try{await new Promise((ok,no)=>{const tx=db.transaction('values','readwrite'),s=tx.objectStore('values');${value===undefined?`s.delete(${JSON.stringify(key)})`:`s.put(${JSON.stringify(value)},${JSON.stringify(key)})`};s.delete(${JSON.stringify(key+':legacy-ids.v1')});tx.oncomplete=ok;tx.onabort=()=>no(tx.error)})}finally{db.close()}})()`);
  }
  async function legacy(key,value){await older.eval(value===null?`localStorage.removeItem(${JSON.stringify(key)})`:`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(value)})`);}
  async function openJar(){await go(current,'/gratitude-jar.html');await current.wait("document.getElementById('jar-loading').hidden");}
  async function readRaw(key){return current.eval(`(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('woowooish.browser-data.v1',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});try{return await new Promise((ok,no)=>{const r=db.transaction('values').objectStore('values').get(${JSON.stringify(key)});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}finally{db.close()}})()`);}
  async function download(name){const f=path.join(downloads,name);if(fs.existsSync(f))fs.unlinkSync(f);await current.eval("document.getElementById('jar-export').click()");for(let n=0;n<160&&!fs.existsSync(f);n++)await sleep(40);assert(fs.existsSync(f),'Recovery file was downloaded');return JSON.parse(fs.readFileSync(f,'utf8'));}

  await scenario('Cycle generations cannot pollute one another',async()=>{
    await go(current,'/pick-your-woo.html');const ids=await current.eval('WooLibrary.entries.map(e=>e.id)');
    const state=(cycles,seen)=>({schema:1,cycles,seen,today:[],day:'2000-01-01',last:seen.at(-1)||null});
    await raw(wooKey,JSON.stringify(state(3,ids.slice(0,2))));await legacy(wooKey,JSON.stringify(state(2,ids)));
    const next=await current.eval('WooDeck.create(WooLibrary.entries,{crypto:null,random:()=>0}).next().then(r=>r.entry.id)');
    let saved=JSON.parse(await readRaw(wooKey));
    check('An older completed round cannot exhaust the active round',saved.cycles===3&&saved.seen.length===3&&next===ids[2]);
    await raw(wooKey,JSON.stringify(state(2,ids)));await legacy(wooKey,JSON.stringify(state(3,ids.slice(0,2))));
    await current.eval('WooDeck.create(WooLibrary.entries,{crypto:null,random:()=>0}).next()');saved=JSON.parse(await readRaw(wooKey));
    check('A later legacy round advances rather than contaminates history',saved.cycles===3&&saved.seen.length===3&&saved.seen[2]===ids[2]);
    const day=await current.eval('WooDeck.localDay(new Date())');
    await raw(wooKey,JSON.stringify({...state(3,ids.slice(0,2)),day,today:[ids[0]]}));
    await legacy(wooKey,JSON.stringify({...state(2,ids),day,today:[ids[2]]}));
    const todayPick=await current.eval('WooDeck.create(WooLibrary.entries,{crypto:null,random:()=>0}).next().then(r=>r.entry.id)');
    check('Same-day exclusions survive even across different generations',todayPick===ids[3]);
    await legacy(wooKey,null);
  });

  await scenario('Authoritative storage survives legacy-access denial',async()=>{
    await legacy(jarKey,null);await openJar();await raw(jarKey,JSON.stringify([note('kept')]));
    await current.eval(`window.originalStorageGet=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===${JSON.stringify(jarKey)})throw new DOMException('SYNTHETIC legacy denial','SecurityError');return window.originalStorageGet.call(this,k)}`);
    try{
      const before=await current.eval('WooGratitude.create().refresh()');
      check('Readable IndexedDB notes remain available when legacy lookup fails',!before.unavailable&&before.items.length===1&&before.items[0].id==='kept');
      check('Incomplete older-tab inspection is disclosed',before.legacyUnavailable===true);
      const added=await current.eval("WooGratitude.create().add('SYNTHETIC added despite legacy denial')");
      check('Native note writes still commit under legacy-access denial',added.persistent&&added.items.length===2);
      await raw(jarKey,undefined);
      check('An unreadable first migration does not invent an empty saved jar',(await current.eval('WooGratitude.create().refresh()')).unavailable);
      check('An unreadable first migration leaves the key absent',(await readRaw(jarKey))===undefined);
    }finally{await current.eval('Storage.prototype.getItem=window.originalStorageGet');}
  });

  await scenario('Empty current jar exposes exact older-tab recovery bytes',async()=>{
    await legacy(jarKey,null);await openJar();await raw(jarKey,null);
    const damaged='{SYNTHETIC malformed older-tab JSON';await legacy(jarKey,damaged);await openJar();
    check('An empty current jar still enables legacy recovery export',await current.eval("!document.getElementById('jar-export').disabled"));
    let backup=await download('woowooish-gratitude-recovery.json');
    check('Recovery contains the exact legacy bytes and explicit null current record',backup.olderTabStorage===damaged&&backup.originalStorage===null);
    await current.eval("document.getElementById('thought').value='SYNTHETIC draft';document.getElementById('thought').dispatchEvent(new Event('input'))");
    backup=await download('woowooish-gratitude-recovery.json');
    check('Recovery preserves an unsaved draft alongside both sources',backup.unsavedDraft==='SYNTHETIC draft'&&backup.olderTabStorage===damaged);
    check('Recovery leaves original data untouched',(await readRaw(jarKey))===null&&await older.eval(`localStorage.getItem(${JSON.stringify(jarKey)})===${JSON.stringify(damaged)}`));
    await legacy(jarKey,null);
    const unblocked=await current.eval("WooGratitude.create().add('SYNTHETIC safe after recovery')");
    check('Resolved recovery does not leave stale blocked-state metadata',!unblocked.blocked&&unblocked.legacyRecovery===null&&unblocked.items.length===1);
  });

  await scenario('Legacy cleanup cannot erase a concurrent older-tab write',async()=>{
    await legacy(jarKey,null);await go(current,'/pick-your-woo.html');
    await current.eval("new Promise((ok,no)=>{const s=document.createElement('script');s.src='/assets/gratitude-store.js';s.onload=ok;s.onerror=()=>no(Error('Store fixture load failed'));document.head.append(s)})");
    await raw(jarKey,undefined);
    const before=JSON.stringify([note('before')]),late=JSON.stringify([note('before'),note('during-cleanup')]);
    await legacy(jarKey,before);
    // A deterministic interleaving of two synchronous Storage calls. The second
    // read returns the old value while a new write has already replaced it.
    await current.eval(`window.cleanupReads=0;window.raceInjected=false;window.originalStorageGet=Storage.prototype.getItem;Storage.prototype.getItem=function(k){const value=window.originalStorageGet.call(this,k);if(k===${JSON.stringify(jarKey)}&&++window.cleanupReads===2){this.setItem(k,${JSON.stringify(late)});window.raceInjected=true;}return value;}`);
    try{
      await current.eval('WooGratitude.create().refresh()');
      check('No compare-then-remove cleanup can discard the intervening write',await current.eval(`!window.raceInjected||window.originalStorageGet.call(localStorage,${JSON.stringify(jarKey)})===${JSON.stringify(late)}`));
    }finally{await current.eval('Storage.prototype.getItem=window.originalStorageGet');}
    await legacy(jarKey,late);
    const merged=await current.eval('WooGratitude.create().refresh()');
    check('The late record remains recoverable after reconciliation',merged.items.length===2&&merged.items.some(n=>n.id==='during-cleanup'));
    await current.eval("WooGratitude.create().remove('before')");
    const reread=await current.eval('WooGratitude.create().refresh()');
    check('Retained compatibility snapshots cannot resurrect removed notes',reread.items.length===1&&reread.items[0].id==='during-cleanup');
    await legacy(jarKey,null);
  });

  await scenario('Untrusted note text remains inert',async()=>{
    await legacy(jarKey,null);await openJar();
    const payload='<img src=x onerror="window.__wooXSS=true"><script>window.__wooXSS=true</script>';
    await raw(jarKey,JSON.stringify([note('hostile-text',payload)]));await openJar();
    check('Markup-looking note text is rendered literally',await current.eval(`document.querySelector('#entries .entry p').textContent===${JSON.stringify(payload)}`));
    check('Stored text cannot create executable DOM elements',await current.eval("!window.__wooXSS&&document.querySelectorAll('#entries img,#entries script').length===0"));
    check('Recovery retains the production security policy',await current.eval("!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')"));
  });
  console.log(JSON.stringify({status:failures.length?'FAIL':'PASS',checks:count,failures,nativeIndexedDB:true,syntheticDataOnly:true},null,2));
  if(failures.length)throw Error(failures.length+' full-hardening scenarios failed');
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Full-hardening regression\n${count} native assertions passed: generation boundaries, blocked legacy storage, null-current recovery, compare/delete race, safe text rendering. Synthetic records only.\n`);
 }finally{
  tabs.forEach(t=>t.close());if(browser)browser.close();chrome.kill('SIGTERM');await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(1000)]);if(chrome.exitCode===null)chrome.kill('SIGKILL');server.closeAllConnections();await new Promise(r=>server.close(r));try{fs.rmSync(work,{recursive:true,force:true,maxRetries:10,retryDelay:150});}catch(_){}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
