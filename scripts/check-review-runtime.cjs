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
    const routes=['/',...fs.readdirSync(root).filter(name=>name.endsWith('.html')&&name!=='index.html').sort().map(name=>'/'+name),'/the-art-of-noticing/',...fs.readdirSync(path.join(root,'woo-for-real-life')).filter(name=>name.endsWith('.html')).sort().map(name=>'/woo-for-real-life/'+name)];
    for(const route of routes){
      if(route==='/gratitude-jar.html') await tab.eval("localStorage.setItem('woowooish-gratitude-v1',JSON.stringify([{id:'preexisting-note',text:'SYNTHETIC migrated note',date:'2026-01-01'}]))");
      await go(tab,route);
      check(route+': actual HTML entry loads with CSP',await tab.eval("document.querySelectorAll('h1').length===1 && !!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')"));
      for(const width of [320,390,768,1440]){
        await tab.send('Emulation.setDeviceMetricsOverride',{width,height:920,deviceScaleFactor:1,mobile:false});
        check(route+': no horizontal overflow at '+width,await tab.eval('document.documentElement.scrollWidth<=innerWidth'));
      }
    }
    // All unlisted guides remain static, off the tracker allowlist and usable without JS.
    const guideFiles=fs.readdirSync(path.join(root,'woo-for-real-life')).filter(name=>name.endsWith('.html')).sort();
    for(const name of guideFiles){
      const route='/woo-for-real-life/'+name;
      await go(tab,route);
      check(route+': noindex preview',await tab.eval("document.querySelector('meta[name=robots]').content==='noindex,follow'"));
      check(route+': no injected tracker',await tab.eval("!document.querySelector('script[src*=\"cloud.umami.is\"]')"));
      check(route+': visible writing and no input collection',await tab.eval("document.querySelector('main').innerText.length>2000 && !document.querySelector('form,input,textarea')"));
      const storedBefore=await tab.eval('JSON.stringify({...localStorage})');
      if(name!=='index.html'){
        await tab.eval("document.querySelector('a[href=\"#practice\"]').click()");
        check(route+': practice navigation works',await tab.eval("location.hash==='#practice' && !!document.getElementById('practice')"));
        await tab.eval("document.querySelector('details summary').click()");
        check(route+': native optional disclosure works',await tab.eval("document.querySelector('details').open"));
        check(route+': no storage changed by reading',storedBefore===await tab.eval('JSON.stringify({...localStorage})'));
      }
      await tab.send('Emulation.setScriptExecutionDisabled',{value:true});
      await go(tab,route);
      check(route+': full text without JavaScript',await tab.eval("document.querySelector('main').innerText.length>2000"));
      await tab.send('Emulation.setScriptExecutionDisabled',{value:false});
    }
    // The reflection chooser was added after the original fixed-route suite.
    const chooser=require('../assets/whats-your-woo.js');
    await go(tab,'/whats-your-woo.html');
    check('Chooser loads through the privacy gate without a direct tracker',await tab.eval("typeof wooBeforeAnalytics==='function' && !document.querySelector('script[src*=\"cloud.umami.is\"]')"));
    check('Chooser controls initialize and fallback hides',await tab.eval("document.getElementById('wyw-loading').hidden && [...document.querySelectorAll('[data-woo]')].every(b=>!b.disabled)"));
    await tab.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await tab.eval("window.__scrolls=[];Element.prototype.scrollIntoView=function(options){window.__scrolls.push(options)}");
    for(const [category,entries] of Object.entries(chooser.paths)){
      await tab.eval(`document.querySelector('[data-woo="${category}"]').click()`);
      check(category+': follow-up receives keyboard focus',await tab.eval("document.activeElement.id==='wyw-follow-title' && document.getElementById('wyw-choices').hidden"));
      for(let i=0;i<entries.length;i++){
        await tab.eval(`document.querySelectorAll('#wyw-follow-options button')[${i}].click()`);
        const expected=entries[i];
        const actual=await tab.eval("['wyw-title','wyw-reflection','wyw-question','wyw-practice'].map(id=>document.getElementById(id).textContent)");
        check(category+'/'+i+': all original words and focus retained',JSON.stringify(actual)===JSON.stringify(expected.slice(1)) && await tab.eval("document.activeElement.id==='wyw-title' && !document.getElementById('wyw-result').hidden"));
        await tab.eval("document.getElementById('wyw-another').click()");
      }
      await tab.eval("document.getElementById('wyw-back').click()");
      check(category+': Back returns focus to original category',await tab.eval(`document.activeElement.dataset.woo===${JSON.stringify(category)}`));
    }
    check('Chooser respects reduced motion',await tab.eval("__scrolls.length>24 && __scrolls.every(o=>o.behavior==='instant')"));
    await tab.eval("document.querySelector('[data-woo=peace]').click();document.querySelector('#wyw-follow-options button').click();window.__copies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{__copies.push(text);return Promise.resolve()}}});document.getElementById('wyw-copy').click()");
    await tab.wait("!document.getElementById('wyw-copy').disabled",'chooser copy completion');
    check('Copy uses real paragraph breaks, not backslash letters',await tab.eval("__copies[0].includes(String.fromCharCode(92,110))===false && __copies[0].includes(String.fromCharCode(10,10))"));
    await tab.eval("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('SYNTHETIC denied'))}});document.getElementById('wyw-copy').click()");
    await tab.wait("!document.getElementById('wyw-manual-copy').hidden",'chooser manual copy');
    check('Denied copy exposes selectable original words',await tab.eval("document.activeElement.id==='wyw-manual-copy' && document.getElementById('wyw-manual-copy').value===__copies[0]"));
    await tab.eval("window.__copyCalls=0;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{__copyCalls++;return new Promise((resolve,reject)=>{window.__rejectCopy=reject})}}});document.getElementById('wyw-copy').click();document.getElementById('wyw-copy').click();document.getElementById('wyw-another').click();document.querySelectorAll('#wyw-follow-options button')[1].click();window.__rejectCopy(Error('SYNTHETIC late denial'))");
    await tab.wait("!document.getElementById('wyw-copy').disabled",'chooser changed during copy');
    check('Double tap and late clipboard rejection do not restore stale content',await tab.eval("__copyCalls===1 && document.getElementById('wyw-manual-copy').hidden && document.getElementById('wyw-status').textContent===''"));
    await tab.send('Emulation.setDeviceMetricsOverride',{width:320,height:920,deviceScaleFactor:1,mobile:false});
    check('Revealed chooser fits narrow screens',await tab.eval('document.documentElement.scrollWidth<=innerWidth'));
    // Non-executing, synthetic markup exercises text rendering with real CSP intact.
    await go(tab,'/what-is-woo.html');
    const marker='<img src=x onerror="window.__reviewExecuted=true">';
    await tab.eval(`window.__reviewExecuted=false;document.getElementById('woo-personal').value=${JSON.stringify(marker)};document.getElementById('woo-reveal').click()`);
    check('Personal reflection renders markup as text, not executable HTML',await tab.eval(`!window.__reviewExecuted && !document.querySelector('#woo-result-text img') && document.getElementById('woo-result-text').textContent.includes(${JSON.stringify(marker)})`));
    // All malicious or malformed link inputs must stay on the recovery path.
    for(const query of ['?woo='+encodeURIComponent(marker),'?woo=__proto__','?woo=d1-../../outside-01','?woo=p1-original-01&woo=p1-original-02']){
      await go(tab,'/reflection.html'+query);
      check('Untrusted permalink rejected: '+query.slice(0,55),await tab.eval("document.getElementById('shared-reflection').hidden && !document.querySelector('#shared-status img') && document.getElementById('shared-status').textContent.includes('not recognized')"));
    }
    await go(tab,'/gratitude-jar.html');
    await tab.wait("document.getElementById('jar-loading').hidden",'jar ready for synthetic markup');
    await tab.eval(`document.getElementById('thought').value=${JSON.stringify(marker)};document.getElementById('gratitude-form').requestSubmit()`);
    await tab.wait("document.querySelectorAll('#entries .entry').length===2",'synthetic note saved');
    check('Saved note renders markup as plain text',await tab.eval(`!document.querySelector('#entries img') && [...document.querySelectorAll('#entries .entry p')].some(p=>p.textContent===${JSON.stringify(marker)})`));
    // Remove just the synthetic test record so pre-existing regression counts stay exact.
    await tab.eval(`(async()=>{const s=WooGratitude.create();const state=await s.refresh();const note=state.items.find(n=>n.text===${JSON.stringify(marker)});await s.remove(note.id)})()`);
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
    check('No uncaught browser exceptions',runtimeErrors.length===0);
    const evidence={status:'PASS',checks:checks.length,htmlPages:routes.length,chooserPaths:24,productionCSP:true,nativeNoteStorage:true,scope:'All pages, chooser interactions, plain-text rendering and rejected links. Clipboard boundaries simulated; external requests intercepted.'};
    fs.mkdirSync(path.join(root,'audit-evidence'),{recursive:true});
    fs.writeFileSync(path.join(root,'audit-evidence/review-runtime.json'),JSON.stringify(evidence,null,2)+'\n');
    console.log(JSON.stringify(evidence,null,2));
    if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Comprehensive review browser checks\n${checks.length} checks passed across ${routes.length} HTML entry points and 24 chooser paths, including production CSP and native note rendering. Clipboard is simulated.\n`);
  } finally {
    pages.forEach(p=>p.close());if(browser)browser.close();chrome.kill('SIGTERM');
    if(chrome.exitCode===null)await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(1500)]);
    if(chrome.exitCode===null)chrome.kill('SIGKILL');
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    try {fs.rmSync(work,{recursive:true,force:true,maxRetries:10,retryDelay:150});} catch (cleanupError) {console.warn('Temporary browser cleanup:',cleanupError.code);}
  }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
