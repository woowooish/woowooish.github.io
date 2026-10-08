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
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'woo-daily-share-audit-'));
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
    for(const route of ['/','/daily-woo.html']){
      await go(tab,route);
      await tab.wait("!!document.querySelector('#daily-image-save[href^=\"blob:\"]')",'PNG prepared before click');
      check(route+': image sharing ready under production CSP',true);
      for(const width of [320,390,768,1440]){
        await tab.send('Emulation.setDeviceMetricsOverride',{width,height:920,deviceScaleFactor:1,mobile:false});
        check(route+': sharing fits '+width,await tab.eval('document.documentElement.scrollWidth<=innerWidth'));
      }
    }
    const doses=fs.readdirSync(path.join(root,'assets/doses')).filter(n=>n.endsWith('.json')).flatMap(name=>{
      const data=JSON.parse(fs.readFileSync(path.join(root,'assets/doses',name),'utf8'));
      return data.doses.map(dose=>({...dose,teacher:data.teacher,date:'October 8, 2026'}));
    });
    const layouts=await tab.eval(`(()=>{
      const doses=${JSON.stringify(doses)};
      const canvas=document.createElement('canvas');
      let total=0;
      for(const format of ['post','story']) for(const dose of doses){
        const fit=WooDailySharing.drawCard(canvas,dose,'"Bricolage Grotesque", Arial, sans-serif',format);
        const ctx=canvas.getContext('2d');
        if(canvas.width!==1080 || canvas.height!==(format==='story'?1920:1350))return false;
        if(fit.startY+fit.height>1022.001 || fit.offset!==(format==='story'?220:0))return false;
        for(const block of fit.blocks){ctx.font=block.font;if(block.lines.some(line=>ctx.measureText(line).width>904))return false;}
        total++;
      }
      canvas.width=1;canvas.height=1;return total;
    })()`);
    check('All 740 Story and Post layouts fit a real brand-font canvas with safe margins',layouts===740);
    check('Story is selected and preview visible without opening help',await tab.eval("document.getElementById('daily-format-story').checked && !document.getElementById('daily-share-preview').hidden && !document.getElementById('daily-share-details').open"));
    const filename=await tab.eval("document.getElementById('daily-image-save').download");
    await tab.eval("document.getElementById('daily-image-save').click()");
    const destination=path.join(downloads,filename);
    for(let n=0;n<100&&!fs.existsSync(destination);n++)await delay(50);
    assert(fs.existsSync(destination),'actual download should reach disk');
    const image=fs.readFileSync(destination);
    check('Saved Story is a genuine 1080 x 1920 PNG',image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && image.readUInt32BE(16)===1080 && image.readUInt32BE(20)===1920);
    check('Download reveals the next Instagram step immediately',await tab.eval("!document.querySelector('.ww-daily-share-next').hidden"));
    // Format switches must use cached files, not repaint or ask the visitor to wait.
    await tab.eval("document.getElementById('daily-format-post').click();true");
    await tab.wait("document.getElementById('daily-image-save').download.endsWith('-post.png')",'cached post image');
    const postName=await tab.eval("document.getElementById('daily-image-save').download");
    await tab.eval("document.getElementById('daily-image-save').click();true");
    const postPath=path.join(downloads,postName);
    for(let n=0;n<100&&!fs.existsSync(postPath);n++)await delay(50);
    const postBytes=fs.readFileSync(postPath);
    check('One tap saves the alternate 1080 x 1350 Post PNG',postBytes.readUInt32BE(16)===1080 && postBytes.readUInt32BE(20)===1350);
    await tab.eval("document.getElementById('daily-format-story').click();true");
    const click=()=>tab.send('Runtime.evaluate',{expression:"document.getElementById('daily-instagram-share').click();true",userGesture:true,returnByValue:true});
    // Only the operating-system/app boundary is simulated. Never post to a real account.
    await tab.eval(`(()=>{
      window.__shareCalls=[];window.__mode='pending';window.__downloads=0;
      document.getElementById('daily-image-save').addEventListener('click',()=>window.__downloads++);
      Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>data.files.length===1});
      Object.defineProperty(navigator,'share',{configurable:true,value:data=>{
        window.__shareCalls.push({keys:Object.keys(data),text:data.text,length:data.files?.length,type:data.files?.[0]?.type,size:data.files?.[0]?.size,active:navigator.userActivation.isActive});
        if(window.__mode==='pending')return new Promise(resolve=>window.__finishShare=resolve);
        if(window.__mode==='abort')return Promise.reject(new DOMException('Cancelled','AbortError'));
        if(window.__mode==='denied')return Promise.reject(new DOMException('Blocked','NotAllowedError'));
        return Promise.resolve();
      }});
    })()`);
    await tab.eval("document.getElementById('daily-format-post').click();document.getElementById('daily-format-story').click();true");
    await tab.wait("!document.getElementById('daily-instagram-share').hidden && !document.getElementById('daily-instagram-share').disabled",'simulated file sharing ready');
    await click();await click();
    check('A double tap opens only one share operation',await tab.eval('__shareCalls.length===1 && document.getElementById("daily-instagram-share").disabled'));
    check('Single click sends only the prepared PNG with user activation',await tab.eval("__shareCalls[0].active && __shareCalls[0].keys.join(',')==='files' && __shareCalls[0].type==='image/png' && __shareCalls[0].size>1000 && __shareCalls[0].length===1"));
    await tab.eval('window.__finishShare()');await tab.wait('!document.getElementById("daily-instagram-share").disabled','share settled');
    check('Completion does not claim an Instagram post was published',await tab.eval("document.querySelector('.ww-daily-share-status').textContent.includes('publishing is not confirmed')"));
    for(const mode of ['abort','denied']){
      await tab.eval('window.__mode='+JSON.stringify(mode));await click();
      await tab.wait('!document.getElementById("daily-instagram-share").disabled','failure settled');
      check(mode+': honest recovery and no automatic download',await tab.eval("__downloads===0 && document.querySelector('.ww-daily-share-status').textContent.includes("+JSON.stringify(mode==='abort'?'cancelled':'could not share')+")"));
    }
    await tab.eval("Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});true");await click();
    check('No file sharing support replaces the dead-end button with a primary download',await tab.eval("document.getElementById('daily-instagram-share').hidden && document.getElementById('daily-image-save').textContent==='Save for Instagram' && document.getElementById('daily-image-save').classList.contains('ww-daily-share-primary') && __downloads===0"));
    await tab.eval("Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>{throw Error('unavailable')}});true");await click();
    check('Throwing capability detection remains recoverable',await tab.eval("!document.getElementById('daily-instagram-share').disabled"));
    await tab.eval("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}});document.querySelector('.ww-daily-share-caption').click();true");
    await tab.wait("!document.querySelector('.ww-daily-share-manual').hidden",'manual caption');
    check('Clipboard denial preserves the whole caption for manual copy',await tab.eval("document.querySelector('.ww-daily-share-manual').value.includes(document.querySelector('.ww-daily-reflection').textContent)"));
    await tab.eval("window.__mode='success';document.querySelector('.ww-daily-share-manual').hidden=true;true");
    await tab.send('Runtime.evaluate',{expression:"document.querySelector('.ww-daily-share-send').click();true",userGesture:true,returnByValue:true});
    await tab.wait('!document.querySelector(".ww-daily-share-send").disabled','text share settled');
    check('Send the words hands over the full dated reflection, not an image or changing link alone',await tab.eval("__shareCalls.at(-1).keys.join(',')==='text' && __shareCalls.at(-1).text.includes(document.querySelector('.ww-daily-reflection').textContent) && __shareCalls.at(-1).text.includes(document.querySelector('.ww-daily-question').textContent) && __shareCalls.at(-1).active"));
    await tab.eval("window.__mode='abort';true");
    await tab.send('Runtime.evaluate',{expression:"document.querySelector('.ww-daily-share-send').click();true",userGesture:true,returnByValue:true});
    await tab.wait('!document.querySelector(".ww-daily-share-send").disabled','text cancellation');
    check('Text cancellation never copies or downloads anything',await tab.eval("document.querySelector('.ww-daily-share-manual').hidden && __downloads===0"));
    await tab.eval(`(()=>{
      window.__revoked=[];const revoke=URL.revokeObjectURL.bind(URL);
      URL.revokeObjectURL=url=>{window.__revoked.push(url);revoke(url)};
      window.__oldImage=document.getElementById('daily-image-save').href;
      const next=document.getElementById('daily-current-dose').cloneNode(true);
      next.querySelector('h3').textContent='Synthetic next-day reflection';
      document.getElementById('daily-today').replaceChildren(next);
    })()`);
    await tab.wait("!!document.querySelector('#daily-image-save[href^=\"blob:\"]') && document.getElementById('daily-image-save').href!==window.__oldImage",'new day image');
    check('New daily content replaces the image and revokes the stale URL',await tab.eval("__revoked.includes(__oldImage) && document.getElementById('daily-image-save').download.includes('synthetic-next-day')"));
    await tab.eval(`(()=>{
      window.__toBlob=HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)};
      document.getElementById('daily-today').replaceChildren(document.getElementById('daily-current-dose').cloneNode(true));
    })()`);
    await tab.wait("document.getElementById('daily-instagram-share').textContent==='Try image again'",'encoding failure');
    check('Failed image encoding gives a usable retry',await tab.eval("!document.getElementById('daily-instagram-share').disabled && document.getElementById('daily-image-save').hidden"));
    await tab.eval('(()=>{HTMLCanvasElement.prototype.toBlob=window.__toBlob;})()');await click();
    await tab.wait("!!document.querySelector('#daily-image-save[href^=\"blob:\"]')",'retry recovers');
    check('Encoding retry recovers without posting or downloading',await tab.eval('__downloads===0'));
    // Pick Your Woo and immutable public permalinks share the same UI, not a second engine.
    await tab.send('Page.addScriptToEvaluateOnNewDocument',{source:`
      window.__shared=[];window.__clipboard='';window.__denyClipboard=false;window.__shareMode='ok';
      Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>!!data.files?.length});
      Object.defineProperty(navigator,'share',{configurable:true,value:data=>{
        window.__shared.push({keys:Object.keys(data),type:data.files?.[0]?.type,size:data.files?.[0]?.size,active:navigator.userActivation.isActive,text:data.text});
        return window.__shareMode==='abort' ? Promise.reject(new DOMException('cancel','AbortError')) : Promise.resolve();
      }});
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{if(window.__denyClipboard)throw Error('denied');window.__clipboard=text;}}});
    `});
    await go(tab,'/pick-your-woo.html');
    check('Picker does not expose a shareable draw before selection',await tab.eval("document.getElementById('result').hidden && !document.querySelector('#pick-sharing .ww-daily-share')"));
    await tab.eval("document.querySelector('#cards .card').click();true");
    await tab.wait("!!document.querySelector('#pick-image-save[href^=\"blob:\"]')",'picker share image ready');
    const pick=await tab.eval("({id:document.getElementById('result').dataset.wooId,title:document.getElementById('woo-title').textContent,body:document.getElementById('woo-message').textContent,question:WooLibrary.entries.find(e=>e.id===document.getElementById('result').dataset.wooId).question,url:document.querySelector('#pick-sharing .ww-daily-share-permalink').href})");
    check('Picked Woo exposes a permanent content-specific URL',pick.url==='https://woowooish.com/reflection.html?woo=p1-'+pick.id);
    await tab.send('Runtime.evaluate',{expression:"document.getElementById('pick-copy-link').click();true",userGesture:true});
    await tab.wait('__clipboard.length>0','picker link copied');
    check('Copy link copies the exact selected Woo',await tab.eval('__clipboard')===pick.url);
    await tab.send('Runtime.evaluate',{expression:"document.getElementById('pick-instagram-share').click();true",userGesture:true});
    await tab.wait("!document.getElementById('pick-instagram-share').disabled",'picker share finished');
    check('Pick uses a prepared files-only PNG during activation',await tab.eval("__shared.at(-1).keys.join(',')==='files' && __shared.at(-1).type==='image/png' && __shared.at(-1).size>1000 && __shared.at(-1).active"));
    await tab.eval("document.getElementById('pick-phone-transfer').open=true;true");
    await tab.wait("!document.querySelector('#pick-phone-transfer canvas').hidden",'local QR visible');
    check('QR opens only on request with its matching readable link',await tab.eval("document.querySelector('#pick-phone-transfer canvas').width===270 && document.querySelector('#pick-phone-transfer a').href==="+JSON.stringify(pick.url)));
    await tab.eval("window.__denyClipboard=true;document.getElementById('pick-copy-link').click();true");
    await tab.wait("!document.querySelector('#pick-sharing .ww-daily-share-link-manual').hidden",'manual link fallback');
    check('Clipboard denial preserves the exact permalink for manual copying',await tab.eval("document.querySelector('#pick-sharing .ww-daily-share-link-manual').value")==pick.url);
    for(const width of [320,390,768,1440]){
      await tab.send('Emulation.setDeviceMetricsOverride',{width,height:920,deviceScaleFactor:1,mobile:false});
      check('Picker share and QR fit '+width,await tab.eval('document.documentElement.scrollWidth<=innerWidth'));
    }
    check('All 824 Pick Story/Post layouts retain the full text',await tab.eval(`WooLibrary.entries.every(entry=>['story','post'].every(format=>{
      const canvas=document.createElement('canvas'),content=WooLinks.fromPick(entry),fit=WooDailySharing.drawCard(canvas,content,'"Bricolage Grotesque", Arial, sans-serif',format);
      const good=fit.startY+fit.height<=1022.001 && [[0,'title'],[1,'reflection'],[3,'question']].every(([i,k])=>fit.blocks[i].lines.join('').replace(/\\s/g,'')===content[k].replace(/\\s/g,''));
      canvas.width=1;canvas.height=1;return good;
    }))`));
    const pickHistory=await tab.eval("WooAtomic.create(WooDeck.storageKey).run(raw=>({raw,value:raw})).then(r=>r.value)");
    await tab.eval("localStorage.setItem('woowooish-gratitude-v1','SYNTHETIC private note sentinel');true");
    await go(tab,pick.url.replace('https://woowooish.com',''));
    await tab.wait("!document.getElementById('shared-reflection').hidden",'shared pick read');
    check('Permanent link reopens the exact picked title, body and question',await tab.eval("JSON.stringify([document.getElementById('shared-title').textContent,document.getElementById('shared-body').textContent,document.getElementById('shared-question').textContent])")===JSON.stringify([pick.title,pick.body,pick.question]));
    check('Reader loads no draw or private-note storage engine',await tab.eval("typeof WooDeck==='undefined' && typeof WooAtomic==='undefined' && typeof WooGratitude==='undefined'"));
    await tab.wait("!!document.querySelector('#shared-image-save[href^=\"blob:\"]')",'recipient can reshare');
    check('Recipient gets the same Story/Post sharing controls',await tab.eval("!!document.getElementById('shared-format-story') && !!document.getElementById('shared-format-post') && !document.getElementById('shared-copy-link').hidden"));
    for(const width of [320,390,768,1440]){
      await tab.send('Emulation.setDeviceMetricsOverride',{width,height:920,deviceScaleFactor:1,mobile:false});
      check('Shared reader fits '+width,await tab.eval('document.documentElement.scrollWidth<=innerWidth'));
    }
    await go(tab,'/pick-your-woo.html');
    check('Opening and resharing a link never consumes or resets pick history',pickHistory===await tab.eval("WooAtomic.create(WooDeck.storageKey).run(raw=>({raw,value:raw})).then(r=>r.value)"));
    check('A private note never enters the shared content or changes',await tab.eval("localStorage.getItem('woowooish-gratitude-v1')==='SYNTHETIC private note sentinel'"));
    await tab.eval("document.querySelector('#cards .card').click();true");
    await tab.wait("!!document.querySelector('#pick-image-save[href^=\"blob:\"]')",'second draw ready');
    check('Picking after opening a link still avoids the previous Woo',await tab.eval("document.getElementById('result').dataset.wooId")!==pick.id);
    await tab.eval("window.__revoked=[];const originalRevoke=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=url=>{__revoked.push(url);originalRevoke(url)};window.__oldPickURL=document.getElementById('pick-image-save').href;document.getElementById('again').click();true");
    check('Picking again discards the stale shared image and link',await tab.eval("__revoked.includes(__oldPickURL) && !document.querySelector('#pick-sharing .ww-daily-share')"));
    for(const key of ['d1-buddha-01','d1-eckhart-tolle-37','d1-joe-hudson-37']){
      const info=require('../assets/woo-links.js').parse(key),data=JSON.parse(fs.readFileSync(path.join(root,'assets/shared/v1',info.slug+'.json'))),dose=data.doses[info.index];
      await go(tab,'/reflection.html?woo='+key);
      await tab.wait("!document.getElementById('shared-reflection').hidden",'daily snapshot read');
      check(key+': fixed daily reflection independent of current date',await tab.eval("JSON.stringify([document.getElementById('shared-title').textContent,document.getElementById('shared-body').textContent,document.getElementById('shared-question').textContent])")===JSON.stringify([dose.title,dose.reflection,dose.question]));
    }
    for(const query of ['', '?woo=p1-does-not-exist-01','?woo=d1-buddha-38','?woo=d1-../../private-01','?woo=p1-original-01&woo=p1-original-02','?woo=%3Cscript%3E']){
      await go(tab,'/reflection.html'+query);
      await tab.wait("!document.getElementById('shared-status').textContent.includes('Opening')",'invalid link handled');
      check('Unknown or malformed link cannot substitute a random Woo: '+query,await tab.eval("document.getElementById('shared-reflection').hidden && !document.querySelector('#shared-sharing .ww-daily-share')"));
    }
    await go(tab,'/daily-woo.html');
    await tab.wait("!!document.querySelector('#daily-image-save[href^=\"blob:\"]')",'daily permalink available');
    const daily=await tab.eval("({url:document.querySelector('.ww-daily-share-permalink').href,title:document.querySelector('#daily-current-dose h3').textContent})");
    await go(tab,daily.url.replace('https://woowooish.com',''));
    await tab.wait("!document.getElementById('shared-reflection').hidden",'today link resolves');
    check('Current Daily Dose link resolves to precisely its displayed reflection',await tab.eval("document.getElementById('shared-title').textContent")===daily.title);

    check('No uncaught browser exceptions',runtimeErrors.length===0);
    console.log(JSON.stringify({status:'PASS',checks:checks.length,reflections:782,permanentLinks:true,productionCSP:true,nativePNG:true,nativeInstagramApp:'not tested; share boundary simulated',externalRequests:'intercepted, never sent'},null,2));
    if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Daily Dose image sharing\n${checks.length} native-browser checks passed. All 782 reflections fit both real canvas layouts; permanent links, read-only history and QR controls pass; PNG downloads are 1080 x 1920 and 1080 x 1350. Both public pages retain production CSP. The native Instagram app is not available in CI; only that sharing boundary is simulated.\n`);
  } finally {
    pages.forEach(p=>p.close());if(browser)browser.close();chrome.kill('SIGTERM');
    if(chrome.exitCode===null)await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(1500)]);
    if(chrome.exitCode===null)chrome.kill('SIGKILL');
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    try {fs.rmSync(work,{recursive:true,force:true,maxRetries:10,retryDelay:150});} catch (cleanupError) {console.warn('Temporary browser cleanup:',cleanupError.code);}
  }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
