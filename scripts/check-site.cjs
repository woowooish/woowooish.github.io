'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const {createTimer} = require(path.join(root, 'assets/pause.js'));

let now = 1000;
const timer = createTimer(() => now);
assert.equal(timer.snapshot().state, 'idle');
assert.equal(timer.snapshot().remaining, 180);
timer.start(); now += 59000;
assert.equal(timer.snapshot().phase, 0);
now += 1000;
assert.equal(timer.snapshot().phase, 1);
assert.equal(timer.snapshot().remaining, 120);
timer.pause(); now += 30000;
assert.equal(timer.snapshot().remaining, 120, 'paused time must not advance');
timer.start(); now += 60000;
assert.equal(timer.snapshot().phase, 2);
now += 90000; // Simulate a background tab whose rendering was throttled.
assert.equal(timer.snapshot().state, 'complete');
assert.equal(timer.snapshot().remaining, 0);
assert.equal(timer.snapshot().elapsed, 180000);
timer.start();
assert.equal(timer.snapshot().remaining, 180, 'another pause starts from three minutes');
timer.reset();
assert.equal(timer.snapshot().state, 'idle');

const nodes = {};
function node(id) {
  return nodes[id] ??= {id, hidden:true, href:'', textContent:'', disabled:true,
    focus(){this.focused=true;}, classList:{toggle(){}},
    addEventListener(type, fn){this[type]=fn;}};
}
function form(id, values) {
  const result = node(id);
  result.elements = Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{value,focus(){}}]));
  result.reportValidity = function(){return this.valid !== false;};
  return result;
}
const newsletter = form('newsletter-form',{email:'visitor+test@example.com'});
const contact = form('contact-form',{name:'A & B',email:'visitor@example.com',message:'Hello!\nAloha & good vibes 🌊'});
const interest = {dataset:{interest:'A walk by the water'},addEventListener(type,fn){this[type]=fn;}};
let intervalFn = null;
let intervalCount = 0;
let uiNow = 0;
const context = {
  document:{getElementById:node, querySelectorAll(){return [interest];},addEventListener(){}},
  WoowooishPause:{createTimer:()=>createTimer(()=>uiNow)},
  setInterval(fn){intervalFn=fn;intervalCount++;return intervalCount;},
  clearInterval(){intervalFn=null;},
};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/site.js'),'utf8'),context);
const event = {preventDefault(){}};
newsletter.submit(event);
let draft = new URL(node('newsletter-form-draft').href);
assert.equal(draft.pathname,'woowooish@gmail.com');
assert(draft.searchParams.get('body').includes('visitor+test@example.com'));
assert.match(draft.searchParams.get('subject'),/interest list/);
assert.equal(node('newsletter-form-draft').hidden,false);
newsletter.input();
assert.equal(node('newsletter-form-draft').hidden,true, 'editing must invalidate an old draft');
contact.submit(event);
draft = new URL(node('contact-form-draft').href);
assert.equal(draft.searchParams.get('subject'),'Aloha from A & B');
assert(draft.searchParams.get('body').includes('Aloha & good vibes 🌊'));
interest.click();
assert(contact.elements.message.value.includes('a walk by the water'));
assert.match(node('contact-form-status').textContent,/no scheduled event or booking/);
assert.equal(node('contact-form-draft').hidden,true);
contact.elements.name.value='   '; contact.submit(event);
assert.match(node('contact-form-status').textContent,/Please include your name/);
newsletter.valid=false; newsletter.submit(event);
assert.equal(node('newsletter-form-draft').hidden,true);

const toggle = node('pause-toggle');
assert.equal(toggle.disabled,false);
toggle.click(); assert.equal(toggle.textContent,'Pause');
uiNow=61000; intervalFn();
assert.match(node('pause-status').textContent,/Minute two/);
assert.equal(node('pause-clock').textContent,'1:59');
toggle.click(); assert.equal(intervalFn,null);
uiNow+=30000; toggle.click();
assert.equal(node('pause-clock').textContent,'1:59');
uiNow+=120000; intervalFn();
assert.equal(node('pause-clock').textContent,'0:00');
assert.match(node('pause-status').textContent,/complete/);
assert.equal(intervalFn,null);
node('pause-reset').click();
assert.equal(node('pause-clock').textContent,'3:00');
assert.equal(node('pause-reset').hidden,true);
assert.equal(toggle.focused,true);

const markup = fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'IDs must be unique');
for (const match of markup.matchAll(/\bhref="#([^"]+)"/g)) {
  assert(ids.includes(match[1]),'broken anchor: '+match[1]);
}
for (const match of markup.matchAll(/\b(?:src|href)="(assets\/[^"?#]+)"/g)) {
  assert(fs.existsSync(path.join(root,match[1])),'missing asset: '+match[1]);
}
assert.equal((markup.match(/class="reflection-card"/g)||[]).length,4);
assert.equal((markup.match(/data-interest=/g)||[]).length,3);
assert(!/Save my spot|salt water heals|good vibes only|reel:/.test(markup),'do not restore misleading reference placeholders');
assert.equal(fs.readFileSync(path.join(root,'CNAME'),'utf8').trim(),'woowooish.com');
console.log('PASS: timer and UI transitions, throttled clock, email encoding, draft invalidation, interest actions, anchors and local assets. No email sent.');
