'use strict';
/* Native two-tab upgrade regression. Synthetic data only; no external requests. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let count=0;function check(name,value){assert(value,name);console.log('PASS '+name);count++;
}
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
  const initial={id:'before-upgrade',text:'SYNTHETIC original',date:'2026-01-01'};
  const late1={id:'late-one',text:'SYNTHETIC older-tab addition',date:'2026-01-02'};
  const late2={id:'late-two',text:'SYNTHETIC second addition',date:'2026-01-03'};
  async function putLegacy(key, raw) {
    const receiving = await current.eval(`location.origin===${JSON.stringify(origin)}`);
    if (receiving) await current.eval(`(()=>{
      window.__legacyDelivered=false;
      const receive=event=>{
        if(event.key===${JSON.stringify(key)} && event.newValue===${JSON.stringify(raw)}){
          window.__legacyDelivered=true;window.removeEventListener('storage',receive);
        }
      };
      window.addEventListener('storage',receive);
    })()`);
    await older.eval(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(raw)})`);
    if (receiving) {
      // Storage events cross renderer task queues. Synchronize delivery, not the
      // application result; a broken reconciliation still fails the checks below.
      const matches=`localStorage.getItem(${JSON.stringify(key)})===${JSON.stringify(raw)}`;
      const immediate=await current.eval(matches);
      console.log('Legacy snapshot immediately visible in receiving tab: '+immediate);
      await current.wait(`window.__legacyDelivered && (${matches})`);
    }
  }
  const putOld=notes=>putLegacy('woowooish-gratitude-v1',JSON.stringify(notes));
  await putOld([initial]);await go(current,'/gratitude-jar.html');await current.wait("document.getElementById('jar-loading').hidden");
  check('Original note migrates on first open',await current.eval("WooGratitude.create().refresh().then(s=>s.items.length===1&&s.items[0].id==='before-upgrade')"));
  await putOld([initial,late1]);
  const later=await current.eval("WooGratitude.create().refresh()");
  console.log(JSON.stringify({boundary:'legacy addition after delivery',ids:later.items.map(n=>n.id),blocked:later.blocked,unavailable:later.unavailable,persistent:later.persistent}));
  check('A later legacy-tab addition is reconciled, not hidden',later.items.length===2&&later.items.some(n=>n.id==='late-one'));
  await current.eval("WooGratitude.create().remove('before-upgrade')");
  await putOld([initial,late1,late2]);
  const afterRemoval=await current.eval("WooGratitude.create().refresh()");
  console.log(JSON.stringify({boundary:'stale snapshot after delivery',ids:afterRemoval.items.map(n=>n.id),blocked:afterRemoval.blocked,unavailable:afterRemoval.unavailable,persistent:afterRemoval.persistent}));
  check('Stale old-tab snapshot cannot resurrect a removed note',afterRemoval.items.length===2&&!afterRemoval.items.some(n=>n.id==='before-upgrade')&&afterRemoval.items.some(n=>n.id==='late-two'));
  await go(current,'/gratitude-jar.html');await current.wait("document.getElementById('jar-loading').hidden");
  check('Reconciled additions survive a real reload',await current.eval("document.querySelectorAll('#entries .entry').length===2"));
  const conflicting=[{...late1,text:'SYNTHETIC conflicting older edit'},late2];const legacyRaw=JSON.stringify(conflicting);
  await putOld(conflicting);
  check('Conflicting duplicate ID preserves both copies',await current.eval(`WooGratitude.create().refresh().then(s=>s.blocked&&s.legacyRecovery===${JSON.stringify(legacyRaw)}&&s.items.find(n=>n.id==='late-one').text==='SYNTHETIC older-tab addition')`));
  check('Conflicting state blocks destructive mutation',await current.eval("WooGratitude.create().add('SYNTHETIC must not save').then(()=>false,e=>e.code==='unreadable')"));
  await go(current,'/gratitude-jar.html');await current.wait("document.getElementById('jar-loading').hidden");
  await current.eval("document.getElementById('thought').value='SYNTHETIC pending draft';document.getElementById('thought').dispatchEvent(new Event('input'));document.getElementById('jar-export').click()");
  const file=path.join(downloads,'woowooish-gratitude-recovery.json');for(let n=0;n<100&&!fs.existsSync(file);n++)await sleep(50);
  const backup=JSON.parse(fs.readFileSync(file,'utf8'));
  check('Recovery file includes authoritative notes, older-tab bytes and draft',backup.olderTabStorage===legacyRaw&&JSON.parse(backup.originalStorage).length===2&&backup.unsavedDraft==='SYNTHETIC pending draft');
  check('Unresolved older-tab bytes were not discarded',await older.eval(`localStorage.getItem('woowooish-gratitude-v1')===${JSON.stringify(legacyRaw)}`));
  await older.eval("localStorage.removeItem('woowooish-gratitude-v1')");
  await go(current,'/pick-your-woo.html');
  const first=await current.eval("WooDeck.create(WooLibrary.entries).next().then(r=>r.entry.id)");
  const nextID=await current.eval(`WooLibrary.entries.find(e=>e.id!==${JSON.stringify(first)}).id`);
  const day=await current.eval('WooDeck.localDay(new Date())');
  await putLegacy('woowooish.pick.history.v1',JSON.stringify({schema:1,seen:[first,nextID],today:[first,nextID],day,last:nextID,cycles:0}));
  const next=await current.eval("WooDeck.create(WooLibrary.entries,{crypto:null,random:()=>0}).next().then(r=>r.entry.id)");
  check('Late old-tab Woo selection is excluded from the next draw',next!==first&&next!==nextID);
  check('Merged pick history retains all three IDs',await current.eval("WooAtomic.create(WooDeck.storageKey).run(raw=>({raw,value:JSON.parse(raw).seen.length})).then(r=>r.value===3)"));
  check('Production CSP remained present',await current.eval("!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')"));
  console.log(JSON.stringify({status:'PASS',checks:count,nativeIndexedDB:true,nativeTwoTabs:true,syntheticDataOnly:true},null,2));
 }finally{
  tabs.forEach(t=>t.close());if(browser)browser.close();chrome.kill('SIGTERM');await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(1000)]);if(chrome.exitCode===null)chrome.kill('SIGKILL');server.closeAllConnections();await new Promise(r=>server.close(r));try{fs.rmSync(work,{recursive:true,force:true,maxRetries:10,retryDelay:150});}catch(_){}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
