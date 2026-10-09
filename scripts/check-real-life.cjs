'use strict';
// The collection must remain unlisted and readable, with real frozen Woo matches.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'woo-for-real-life');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.html')).sort();
const catalog=require('../assets/shared/v1/woo-library.js').entries;
const expected={
  'before-a-conversation-you-have-been-avoiding.html':'original-04',
  'when-you-need-to-say-no.html':'boundaries-06',
  'when-you-keep-replaying-what-you-said.html':'room-for-feelings-13',
  'when-you-are-waiting-for-an-answer.html':'original-10',
  'when-good-news-brings-complicated-feelings.html':'room-for-feelings-01',
  'when-someone-elses-milestone-makes-you-feel-behind.html':'enoughness-09',
  'when-you-have-a-free-afternoon-but-cannot-settle.html':'rest-and-pauses-01',
  'when-the-day-does-not-go-to-plan.html':'change-05'
};
let checks=0;const check=(name,ok)=>{assert(ok,name);checks++;};
const decode=s=>s.replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
check('Exactly eight guides and a hub',JSON.stringify(files)===JSON.stringify(['index.html',...Object.keys(expected)].sort()));
const hub=fs.readFileSync(path.join(dir,'index.html'),'utf8');
for(const f of files){
 const html=fs.readFileSync(path.join(dir,f),'utf8');
 check(f+': noindex and follow',html.includes('<meta name="robots" content="noindex,follow">'));
 check(f+': no em dash',!html.includes('\u2014'));
 check(f+': no hidden content dependency',!/<(?:form|input|textarea|iframe)\b|<[^>]+\shidden(?:[=\s>])/.test(html));
 check(f+': only the unchanged privacy gate script',JSON.stringify([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]))===JSON.stringify(['/assets/site-privacy.js?v=20261008-audit-1']));
 check(f+': correct canonical',html.includes('rel="canonical" href="https://woowooish.com/woo-for-real-life/'+(f==='index.html'?'':f)+'"'));
 check(f+': one H1',(html.match(/<h1\b/g)||[]).length===1);
 check(f+': no unapproved social portrait',html.includes('og:image" content="https://woowooish.com/assets/woowooish-share-20261006.png"'));
 check(f+': preview visible',html.includes('Unlisted preview'));
 if(f==='index.html')continue;
 const id=expected[f],entry=catalog.find(e=>e.id===id);check(f+': archived entry exists',!!entry);
 check(f+': one linked Woo',(html.match(/href="\/reflection.html\?woo=/g)||[]).length===1);
 check(f+': exact permanent ID',html.includes('href="/reflection.html?woo=p1-'+id+'"'));
 check(f+': frozen title and body',decode(html).includes(entry.title)&&decode(html).includes(entry.body));
 check(f+': one optional practice',(html.match(/id="practice"/g)||[]).length===1);
 check(f+': one carry question',(html.match(/id="carry"/g)||[]).length===1);
 check(f+': linked from collection hub',hub.includes('href="/woo-for-real-life/'+f+'"'));
 const prose=html.split('<div class="prose">')[1].split('class="woo"')[0];
 check(f+': substantial static writing',prose.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length>=600);
}
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!e.name.startsWith('.')?walk(path.join(folder,e.name)):e.isFile()&&e.name.endsWith('.html')?[path.join(folder,e.name)]:[]);}
for(const f of walk(root).filter(f=>!f.startsWith(dir+path.sep))){
 const html=fs.readFileSync(f,'utf8');
 check(path.relative(root,f)+': no incoming public links',!/["'](?:https:\/\/woowooish\.com)?\/?woo-for-real-life(?:\/|["'#?])/i.test(html));
}
check('No sitemap entry',!fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('woo-for-real-life'));
check('Robots permits reading noindex',!fs.readFileSync(path.join(root,'robots.txt'),'utf8').includes('woo-for-real-life'));
check('No analytics allowlist expansion',!fs.readFileSync(path.join(root,'assets/site-privacy.js'),'utf8').includes('woo-for-real-life'));
const css=fs.readFileSync(path.join(root,'assets/real-life.css'),'utf8');
check('No remote CSS request',!/@import|url\(/.test(css));
check('Mobile, print and reduced-motion support',css.includes('@media(max-width:680px)')&&css.includes('@media print')&&css.includes('prefers-reduced-motion'));
console.log(JSON.stringify({status:'PASS',checks,pages:files.length,guides:Object.keys(expected).length,scope:'unlisted isolation, static writing, stable Woo matches, metadata, no new forms or tracking'}));
