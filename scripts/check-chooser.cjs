'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),chooser=require('../assets/whats-your-woo.js');
const seen=new Set();let entries=0;
assert.equal(Object.keys(chooser.paths).length,6);
assert.deepEqual(Object.keys(chooser.paths),Object.keys(chooser.labels));
for(const [category,paths] of Object.entries(chooser.paths)){
  assert.equal(paths.length,4);
  assert.equal(typeof chooser.labels[category],'string');
  for(const row of paths){
    assert.equal(row.length,5);
    for(const value of row)assert(typeof value==='string'&&value.trim().length>0&&value.length<=1600);
    assert(!seen.has(row[1]),'Distinct reflection titles');seen.add(row[1]);entries++;
  }
}
const js=fs.readFileSync(path.join(root,'assets/whats-your-woo.js'),'utf8');
assert(!/innerHTML|outerHTML|insertAdjacentHTML|eval\s*\(|new Function|\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|indexedDB/.test(js),'Chooser must remain text-rendered and page-only');
assert(js.includes("join('\\n\\n')"),'Real paragraph breaks in copied text');
assert(!js.includes("join('\\\\n\\\\n')"),'Never copy literal backslash letters');
assert(js.includes('stamp !== revision'),'Ignore stale asynchronous copy completion');
const html=fs.readFileSync(path.join(root,'whats-your-woo.html'),'utf8');
assert(!/<script[^>]+src="https?:/i.test(html),'No direct third-party tracker bypass');
assert(html.includes('/assets/site-privacy.js?v='),'Use the existing fail-closed privacy gate');
assert(html.includes('wyw-manual-copy')&&html.includes('<noscript>'),'Manual copy and no-JavaScript recovery');
assert.equal((html.match(/type="button" disabled class="wyw-choice"/g)||[]).length,6,'Source controls are disabled until initialized');
console.log(JSON.stringify({status:'PASS',categories:6,reflections:entries,scope:'Chooser content, privacy and recovery source contracts'}));
