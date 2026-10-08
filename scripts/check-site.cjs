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
const documentClasses = new Set();
function node(id) {
  return nodes[id] ??= {id, hidden:true, href:'', textContent:'', disabled:true,
    attributes:{},focus(){this.focused=true;},select(){this.selected=true;},setSelectionRange(start,end){this.selection=[start,end];},setAttribute(name,value){this.attributes[name]=value;},classList:{toggle(){}},
    addEventListener(type, fn){this[type]=fn;}};
}
function form(id, values) {
  const result = node(id);
  const controls = Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{value,focus(){}}]));
  result.elements = {namedItem(name){return controls[name] ?? null;}};
  result.reportValidity = function(){return this.valid !== false;};
  return result;
}
const newsletter = form('newsletter-form',{email:'visitor+test@example.com'});
const contact = form('contact-form',{name:'A & B',email:'visitor@example.com',message:'Hello!\nAloha & good vibes 🌊'});
const interest = {dataset:{interest:'A walk by the water'},addEventListener(type,fn){this[type]=fn;}};
let intervalFn = null;
let intervalCount = 0;
let uiNow = 0;
const reducedMotion = {matches:false,addEventListener(type,fn){this[type]=fn;}};
const context = {
  navigator:{},
  matchMedia(){return reducedMotion;},
  document:{documentElement:{classList:{toggle(name,on){if(on)documentClasses.add(name);else documentClasses.delete(name);}}},getElementById:node, querySelectorAll(){return [interest];},addEventListener(){}},
  WoowooishPause:{createTimer:()=>createTimer(()=>uiNow)},
  setInterval(fn){intervalFn=fn;intervalCount++;return intervalCount;},
  clearInterval(){intervalFn=null;},
};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/site.js'),'utf8'),context);
const motion = node('motion-toggle');
assert.equal(motion.hidden,false);
assert.equal(motion.attributes['aria-pressed'],'false');
assert.equal(motion.textContent,'Pause moving decorations');
assert.equal(documentClasses.has('motion-paused'),false);
motion.click();
assert.equal(motion.attributes['aria-pressed'],'true');
assert.equal(motion.textContent,'Play moving decorations');
assert.equal(documentClasses.has('motion-paused'),true);
motion.click();
assert.equal(documentClasses.has('motion-paused'),false);
reducedMotion.matches=true; reducedMotion.change();
assert.equal(motion.hidden,true,'system reduced motion makes the redundant control unnecessary');
assert.equal(documentClasses.has('motion-paused'),true,'system reduced motion always stops decoration');
reducedMotion.matches=false; reducedMotion.change();
assert.equal(motion.hidden,false);
assert.equal(documentClasses.has('motion-paused'),false);
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
assert(contact.elements.namedItem('message').value.includes('a walk by the water'));
assert.match(node('contact-form-status').textContent,/no scheduled event or booking/);
assert.equal(node('contact-form-draft').hidden,true);
contact.elements.namedItem('name').value='   '; contact.submit(event);
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
assert.equal((markup.match(/id="motion-toggle"/g)||[]).length,1);
assert.equal((markup.match(/class="both-and-practice"/g)||[]).length,1);
assert.equal((markup.match(/class="both-and-step"/g)||[]).length,3);
assert.match(markup,/More than one thing/);
assert.match(markup,/WooWooish grew from that curiosity/,'The current Our Story section should preserve Annie’s new origin wording');
for (const fieldId of ['newsletter-form-email','contact-form-name','contact-form-email','contact-form-message']) {
  assert(markup.includes(`for="${fieldId}"`),`missing explicit label for ${fieldId}`);
}
assert.equal((markup.match(/class="form-field"/g)||[]).length,3);
assert(!/Save my spot|salt water heals|good vibes only|reel:/.test(markup),'do not restore misleading reference placeholders');
assert.equal(fs.readFileSync(path.join(root,'CNAME'),'utf8').trim(),'woowooish.com');
async function checkCopyFallbacks() {
  newsletter.valid = true;
  newsletter.submit(event);
  const field = node('newsletter-form-copy-text');
  const panel = node('newsletter-form-copy');
  const button = node('newsletter-form-copy-button');
  assert.match(field.value,/To: woowooish@gmail.com\nSubject: Join the Tide/);
  assert.equal(panel.hidden,false);
  assert.equal(button.textContent,'Select draft to copy');
  await button.click();
  assert.equal(field.selected,true,'manual selection works without Clipboard API');
  assert.deepEqual(field.selection,[0,field.value.length]);
  assert.match(node('newsletter-form-status').textContent,/Draft selected/);
  let copiedText = '';
  context.navigator.clipboard = {async writeText(value){copiedText=value;}};
  newsletter.submit(event);
  assert.equal(button.textContent,'Copy draft');
  await button.click();
  assert.equal(copiedText,field.value);
  assert.match(node('newsletter-form-status').textContent,/Draft copied/);
  context.navigator.clipboard.writeText = async () => {throw Error('NotAllowedError');};
  await button.click();
  assert.match(node('newsletter-form-status').textContent,/Draft selected/,'denied clipboard permission must use manual copy');
  assert.equal(button.disabled,false);
  let finishCopy;
  context.navigator.clipboard.writeText = () => new Promise(resolve=>{finishCopy=resolve;});
  const pendingCopy = button.click();
  newsletter.input();
  finishCopy(); await pendingCopy;
  assert.equal(panel.hidden,true);
  assert.equal(field.value,'');
  assert.equal(node('newsletter-form-status').textContent,'','an old copy result must not restore stale status after editing');
  contact.elements.namedItem('name').value='A & B';
  contact.elements.namedItem('message').value='<script>alert("hello")</script>\nAloha 🌊';
  contact.submit(event);
  assert(node('contact-form-copy-text').value.includes('<script>alert("hello")</script>'),'draft content stays plain text');
  interest.click();
  assert.equal(node('contact-form-copy').hidden,true);
  assert.equal(node('contact-form-copy-text').value,'');
  assert.equal((markup.match(/class="draft-copy"/g)||[]).length,2);
  assert.equal((markup.match(/id="(?:newsletter|contact)-form-copy-text"[^>]*\breadonly/g)||[]).length,2);
}
checkCopyFallbacks().then(()=>{
  console.log('PASS: brand purpose, both-and practice, labelled forms, motion preference and control, timer and UI transitions, email drafts, manual and clipboard copy, interest actions, anchors and local assets. No email sent.');
}).catch(error=>{console.error(error);process.exitCode=1;});
