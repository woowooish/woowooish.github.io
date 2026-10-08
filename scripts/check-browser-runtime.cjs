'use strict';
/* Real Chromium with the production CSP intact, native localStorage and native Web Locks.
   Requires Node 22+ and Chrome/Chromium. No npm dependencies or live service writes.
   Serves the repository on loopback. All external test requests are intercepted locally. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const http=require('node:http'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const checks=[];
function check(name,pass){assert(pass,name);checks.push(name);console.log('PASS '+name);}
class CDP {
  constructor(socket){
    this.ws=socket;this.id=0;this.pending=new Map();this.events=new Map();
    socket.addEventListener('message',event=>{
      const value=JSON.parse(event.data);
      if(value.id){const task=this.pending.get(value.id);if(!task)return;clearTimeout(task.timer);this.pending.delete(value.id);value.error?task.reject(Error(value.error.message)):task.resolve(value.result);}
      else for(const fn of this.events.get(value.method)||[])fn(value.params);
    });
    socket.addEventListener('close',()=>{for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(Error('Browser closed'));}this.pending.clear();});
  }
  static async open(url){
    const ws=new WebSocket(url);
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(Error('DevTools connection timed out'));},10000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('DevTools connection failed'));},{once:true});});
    return new CDP(ws);
  }
  on(name,fn){if(!this.events.has(name))this.events.set(name,[]);this.events.get(name).push(fn);}
  send(method,params={}){
    return new Promise((resolve,reject)=>{const id=++this.id;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method));},25000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});
  }
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
  async wait(expression,label,timeout=16000){const end=Date.now()+timeout;while(Date.now()<end){if(await this.eval(expression))return;await delay(40);}throw Error('Browser condition timed out: '+label);}
  close(){this.ws.close();}
}
async function main(){
  if(typeof WebSocket!=='function')throw Error('Use Node 22 or newer for the built-in WebSocket client.');
  const browserPath=process.env.CHROMIUM_EXECUTABLE || ['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'}).stdout.trim()).find(Boolean);
  if(!browserPath)throw Error('Chrome/Chromium is required; checks were not run.');
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'woo-native-audit-'));
  const downloads=path.join(work,'downloads');fs.mkdirSync(downloads);
  const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.txt':'text/plain'};
  let dailyMode='normal';const hits=[];
  const server=http.createServer((req,res)=>{
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
    hits.push({pathname,method:req.method});
    if(req.method!=='GET'){res.writeHead(405).end();return;}
    let file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
    if(pathname.split('/').some(p=>p.startsWith('.'))){res.writeHead(403).end();return;}
    if(pathname.startsWith('/assets/doses/')&&dailyMode==='stall')return;
    if(pathname.startsWith('/assets/doses/')&&dailyMode==='invalid'){res.writeHead(200,{'Content-Type':'application/json'}).end('{"teacher":{},"doses":[]}');return;}
    let status=200;
    try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');}catch(_){file=path.join(root,'404.html');status=404;}
    if(!fs.existsSync(file)){file=path.join(root,'404.html');status=404;}
    res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const chrome=spawn(browserPath,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',
    '--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+path.join(work,'profile'),'about:blank'],{stdio:['ignore','ignore','pipe']});
  let debug='';chrome.stderr.on('data',chunk=>{debug+=chunk.toString();});
  const pages=[],runtimeErrors=[];let browser;
  try{
    const deadline=Date.now()+15000;while(!debug.includes('DevTools listening on')&&Date.now()<deadline&&chrome.exitCode===null)await delay(50);
    const endpoint=debug.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
    if(!endpoint)throw Error('Chrome did not start: '+debug.slice(-1500));
    const port=new URL(endpoint).port;browser=await CDP.open(endpoint);
    await browser.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    async function page(){
      const target=await browser.send('Target.createTarget',{url:'about:blank'});
      const list=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
      const entry=list.find(x=>x.id===target.targetId);assert(entry,'page target available');
      const tab=await CDP.open(entry.webSocketDebuggerUrl);pages.push(tab);
      await tab.send('Page.enable');await tab.send('Runtime.enable');await tab.send('Network.enable');
      tab.on('Runtime.exceptionThrown',e=>runtimeErrors.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
      // No external request reaches a live analytics service, even in policy tests.
      await tab.send('Fetch.enable',{patterns:[{urlPattern:'https://*'}]});
      tab.on('Fetch.requestPaused',e=>{
        const action=e.request.url.startsWith('https://gateway.umami.is/')
          ? tab.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"ok":true}').toString('base64')})
          : tab.send('Fetch.failRequest',{requestId:e.requestId,errorReason:'BlockedByClient'});
        action.catch(error=>runtimeErrors.push(error.message));
      });
      return tab;
    }
    async function go(tab,route){
      const r=await tab.send('Page.navigate',{url:origin+route});
      if(r.errorText)throw Error('Browser navigation unavailable: '+r.errorText+' (no native-page checks claimed)');
      await tab.wait(`location.href===${JSON.stringify(origin+route)} && document.readyState==='complete'`,'load '+route);
      await tab.eval('document.fonts.ready.then(()=>true)');
    }
    const tab=await page();
    const routes=['/','/explore.html','/daily-woo.html','/what-is-woo.html','/pick-your-woo.html',
      '/gratitude-jar.html','/the-art-of-noticing/','/privacy.html','/404.html','/preview.html'];
    for(const route of routes){
      await go(tab,route);
      check(route+': real document with CSP',await tab.eval(`!!document.querySelector('meta[http-equiv="Content-Security-Policy"]') && document.querySelectorAll('h1').length===1`));
      for(const width of [320,390,768,1440]){
        await tab.send('Emulation.setDeviceMetricsOverride',{width,height:920,deviceScaleFactor:1,mobile:false});
        check(route+': no overflow at '+width,await tab.eval('document.documentElement.scrollWidth<=innerWidth'));
      }
      if(route==='/'||route==='/daily-woo.html'){
        await tab.wait("!!document.querySelector('#daily-today h3')",'real Daily Dose JSON load');
        check(route+': daily data loaded',await tab.eval("document.querySelector('#daily-today h3').textContent.length>0"));
      }
      if(route==='/')check('Contact handler initializes under CSP',await tab.eval("!document.querySelector('#contact-form [type=submit]').disabled"));
      if(route==='/pick-your-woo.html')check('Picker initializes under CSP',await tab.eval("!document.querySelector('#cards .card').disabled"));
      if(route==='/gratitude-jar.html')check('Jar initializes under CSP',await tab.eval("!document.querySelector('#gratitude-form [type=submit]').disabled"));
      if(route==='/the-art-of-noticing/')check('Notebook initializes under CSP',await tab.eval("!document.getElementById('notebook-actions').hidden"));
      if(route==='/what-is-woo.html')check('What Is Woo initializes under CSP',await tab.eval("!document.getElementById('woo-reveal').disabled"));
    }
    await go(tab,'/privacy.html');
    check('Approved collection origin passes the actual CSP',await tab.eval("fetch('https://gateway.umami.is/api/send',{method:'POST',body:'SYNTHETIC'}).then(r=>r.ok).catch(()=>false)"));
    check('Unapproved external origin is blocked',await tab.eval("fetch('https://example.invalid/should-not-leave').then(()=>false).catch(()=>true)"));
    await tab.eval("window.__badInline=false;let s=document.createElement('script');s.textContent='window.__badInline=true';document.body.append(s)");
    check('Unapproved inline JavaScript remains blocked',!(await tab.eval('window.__badInline')));
    const beforePosts=hits.filter(x=>x.method!=='GET').length;
    await go(tab,'/');
    await tab.eval("window.__blockedForm=false;document.addEventListener('securitypolicyviolation',e=>{if(e.effectiveDirective==='form-action')window.__blockedForm=true});HTMLFormElement.prototype.submit.call(document.getElementById('contact-form'))");
    await tab.wait('window.__blockedForm','form-action blocks native submission');
    check('Fallback form cannot send a network submission',hits.filter(x=>x.method!=='GET').length===beforePosts);
    // Two independent pages share the browser's real storage and lock manager.
    const other=await page();await go(tab,'/pick-your-woo.html');await go(other,'/pick-your-woo.html');
    check('Native localStorage and Web Locks available',await tab.eval("isSecureContext && typeof navigator.locks.request==='function' && typeof localStorage.setItem==='function'"));
    await tab.eval("localStorage.removeItem(WooDeck.storageKey)");
    const draw="(async()=>{const deck=WooDeck.create(WooLibrary.entries);return Promise.all(Array.from({length:100},()=>deck.next().then(r=>r.entry.id)))})()";
    const results=await Promise.all([tab.eval(draw),other.eval(draw)]);
    check('200 native two-tab draws have no repeats',new Set(results.flat()).size===200);
    await go(tab,'/pick-your-woo.html');
    check('Native history survives real navigation',await tab.eval("JSON.parse(localStorage.getItem(WooDeck.storageKey)).seen.length===200"));
    await tab.eval("document.querySelector('#cards .card').click()");await tab.wait("!document.getElementById('result').hidden",'picker result');
    const first=await tab.eval("document.getElementById('result').dataset.wooId");
    await tab.eval("document.getElementById('again').click();document.querySelector('#cards .card').click()");
    await tab.wait(`!document.getElementById('result').hidden && document.getElementById('result').dataset.wooId!==${JSON.stringify(first)}`,'new same-day Woo');
    check('Repeated same-card selection gives a fresh Woo',true);
    await go(tab,'/gratitude-jar.html');await go(other,'/gratitude-jar.html');
    await tab.eval("localStorage.removeItem(WooGratitude.key)");
    const add="(async()=>{const store=WooGratitude.create();await Promise.all(Array.from({length:30},(_,i)=>store.add('SYNTHETIC note '+i)));return store.load().items.length})()";
    await Promise.all([tab.eval(add),other.eval(add)]);
    check('60 native two-tab note additions are retained',await tab.eval("JSON.parse(localStorage.getItem(WooGratitude.key)).length===60"));
    await go(tab,'/gratitude-jar.html');
    await tab.eval("document.querySelector('#entries .entry button').click()");
    check('Removal confirmation keeps the existing note',await tab.eval("!document.getElementById('jar-confirm').hidden && JSON.parse(localStorage.getItem(WooGratitude.key)).length===60"));
    await tab.eval("document.getElementById('jar-keep').click()");
    check('Cancel does not delete a note',await tab.eval("JSON.parse(localStorage.getItem(WooGratitude.key)).length===60"));
    // Empty corrupt strings must be downloadable without altering browser storage.
    await tab.eval("localStorage.setItem(WooGratitude.key,'')");await go(tab,'/gratitude-jar.html');
    check('Empty unreadable record remains exportable',await tab.eval("!document.getElementById('jar-export').disabled"));
    await tab.eval("document.getElementById('jar-export').click()");
    for(let n=0;n<100&&!fs.existsSync(path.join(downloads,'woowooish-gratitude-original.txt'));n++)await delay(50);
    check('Empty recovery file downloads intact',fs.existsSync(path.join(downloads,'woowooish-gratitude-original.txt'))&&fs.readFileSync(path.join(downloads,'woowooish-gratitude-original.txt'),'utf8')==='');
    await tab.eval("document.getElementById('thought').value='SYNTHETIC recovery draft';document.getElementById('thought').dispatchEvent(new Event('input'));document.getElementById('jar-export').click()");
    for(let n=0;n<100&&!fs.existsSync(path.join(downloads,'woowooish-gratitude-recovery.json'));n++)await delay(50);
    const recovery=JSON.parse(fs.readFileSync(path.join(downloads,'woowooish-gratitude-recovery.json'),'utf8'));
    check('Recovery backup includes exact raw data and unsaved draft',recovery.originalStorage===''&&recovery.unsavedDraft==='SYNTHETIC recovery draft');
    check('Recovery never overwrites stored original',await tab.eval("localStorage.getItem(WooGratitude.key)===''"));
    dailyMode='invalid';await go(tab,'/daily-woo.html');await tab.wait("!document.getElementById('daily-retry').hidden",'invalid data retry');
    check('Malformed daily content gives a usable retry',await tab.eval("!document.querySelector('#daily-today h3')"));
    dailyMode='normal';await tab.eval("document.getElementById('daily-retry').click()");await tab.wait("!!document.querySelector('#daily-today h3')",'retry recovers');check('Retry loads a valid reflection',true);
    dailyMode='stall';await go(tab,'/daily-woo.html');await tab.wait("!document.getElementById('daily-retry').hidden",'12-second stalled-fetch timeout',18000);
    check('Stalled request times out rather than hanging forever',await tab.eval("document.getElementById('daily-status').textContent.includes('taking too long')"));
    dailyMode='normal';
    await go(tab,'/privacy.html');await go(other,'/privacy.html');
    await tab.eval("document.getElementById('analytics-off').click()");
    await other.wait("document.getElementById('analytics-preference').textContent.includes('off in this browser')",'native storage-event opt-out');
    check('Privacy preference synchronizes across native tabs',true);
    await go(tab,'/missing-audit-page');check('Branded 404 recovery works on an actual missing route',await tab.eval("document.querySelector('h1').textContent.includes('wandered off')"));
    check('No uncaught browser exceptions',runtimeErrors.length===0);
    console.log(JSON.stringify({status:'PASS',checks:checks.length,nativeStorage:true,nativeWebLocks:true,productionCSP:true,externalRequests:'intercepted, never sent'},null,2));
    if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Native browser audit\n${checks.length} checks passed with the production CSP intact, real localStorage, 200 two-tab Woo draws and 60 two-tab jar additions. No real analytics requests or private notes were used.\n`);
  } finally {
    pages.forEach(p=>p.close());if(browser)browser.close();chrome.kill('SIGTERM');
    if(chrome.exitCode===null)await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(1500)]);
    if(chrome.exitCode===null)chrome.kill('SIGKILL');
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    fs.rmSync(work,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
