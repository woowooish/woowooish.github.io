'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const {dailyDoseIndex} = require(path.join(root, 'assets/daily.js'));

// The daily choice follows local calendar dates, not elapsed 24-hour periods.
for (const timezone of ['America/Los_Angeles','Pacific/Honolulu','Asia/Tokyo','UTC']) {
  const script = `const {dailyDoseIndex:i}=require('./assets/daily.js'); console.log(JSON.stringify([
    i(new Date(2026,9,5,0,1),14),i(new Date(2026,9,5,23,59),14),
    i(new Date(2026,9,6,0,1),14),i(new Date(2026,9,19),14),i(new Date(2026,9,4),14),
    i(new Date(2026,10,1,0,1),14),i(new Date(2026,10,2,0,1),14)]));`;
  const values=JSON.parse(execFileSync(process.execPath,['-e',script],{cwd:root,env:{...process.env,TZ:timezone},encoding:'utf8'}));
  assert.deepEqual(values.slice(0,5),[0,0,1,0,13]);
  assert.equal(values[6],(values[5]+1)%14,'DST does not skip or repeat a calendar day');
}
assert.equal(dailyDoseIndex(new Date(2026,11,31),14)+1,dailyDoseIndex(new Date(2027,0,1),14));

// Minimal DOM with actual reparenting: there must only ever be one copy of a note.
class Element {
  constructor(id=''){this.id=id;this.children=[];this.parent=null;this.hidden=true;this.open=false;this.className='';}
  appendChild(node){node.remove();this.children.push(node);node.parent=this;return node;}
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}}
  closest(){return this.parent?.isDetails ? this.parent : null;}
  querySelector(){return this.children.find(n=>n.className==='small-link dose-today-link');}
  scrollIntoView(){this.scrolled=true;}
}
const archive=new Element('daily-archive'), feature=new Element('daily-feature'), today=new Element('daily-today'), label=new Element('daily-date');
const entries=Array.from({length:14},()=>{const e=new Element();e.isDetails=true;return e;});
const notes=entries.map((entry,i)=>entry.appendChild(new Element('dose-'+i)));
let clock=new Date(2026,9,5,12);
class ClockDate extends Date {constructor(...args){super(...(args.length ? args : [clock.getTime()]));}}
const events={}, documentEvents={};
const document={hidden:false,getElementById(id){return ({'daily-archive':archive,'daily-feature':feature,'daily-today':today,'daily-date':label})[id];},querySelectorAll(){return notes;},createElement(){return new Element();},addEventListener(type,fn){documentEvents[type]=fn;}};
const window={location:{hash:'#dose-3'},addEventListener(type,fn){events[type]=fn;},setInterval(fn){this.tick=fn;}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/daily.js'),'utf8'),{Date:ClockDate,document,window});
assert.equal(today.children[0],notes[0]);assert.equal(feature.hidden,false);
assert(archive.open && entries[3].open && notes[3].scrolled,'direct archive links expose their full card');
const unchanged=today.children[0];window.tick();assert.equal(today.children[0],unchanged);
clock=new Date(2026,9,6,0,1);window.tick();
assert.equal(today.children.length,1);assert.equal(today.children[0],notes[1]);
assert.equal(notes[0].parent,entries[0],'yesterday returns to its original archive entry');
assert.equal(entries[0].querySelector(),undefined,'old featured link is removed');
assert.match(label.textContent,/Today/);
clock=new Date(2026,9,7,10);document.hidden=true;documentEvents.visibilitychange();
assert.equal(today.children[0],notes[1]);document.hidden=false;documentEvents.visibilitychange();
assert.equal(today.children[0],notes[2],'returning to a background tab refreshes today');
window.location.hash='#dose-2';events.hashchange();assert(notes[2].scrolled);
window.location.hash='#unrelated';events.hashchange();

const markup=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cards=[...markup.matchAll(/<article class="dose-note" id="([^"]+)">([\s\S]*?)<\/article>/g)];
assert.equal(cards.length,14);assert.equal(new Set(cards.map(c=>c[1])).size,14);
const budgets=new Map();const teachers=new Set();
for (const [,id,body] of cards) {
  const url=body.match(/class="small-link dose-source" href="([^"]+)"/)[1];
  assert.match(url,/^https:\/\/(www\.bashar\.org|blog\.artofaccomplishment\.com|www\.dhamma\.org|drjoedispenza\.com)\//);
  const quote=body.match(/<blockquote><p>“([^”]+)”/)[1];
  budgets.set(url,(budgets.get(url)||0)+quote.trim().split(/\s+/).length);
  teachers.add(body.match(/class="dose-attribution">([^<]+) · source excerpt/)[1]);
  assert.match(body,/a woowooish reflection/);assert.match(body,/class="reflection-prompt"/);
  assert.match(body,/readonly hidden aria-label=/);
}
assert.equal(teachers.size,4);
for (const [url,words] of budgets) assert(words<=25,'brief excerpt budget for '+url);
assert(markup.indexOf('id="start-here"')<markup.indexOf('id="daily-woo"'));
assert(markup.indexOf('id="daily-woo"')<markup.indexOf('id="annie"'));
assert.match(markup,/<noscript>/,'all cards remain readable in native disclosures without JavaScript');
console.log('PASS: 14 sourced cards, excerpt limits, local daily rotation across timezones/DST/year boundary, archive deep links, single-copy movement, and overnight/background refresh.');
