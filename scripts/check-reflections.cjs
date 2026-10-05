'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'assets/reflections.js'), 'utf8');

function setup(hash = '#reflection-wonder', clipboard) {
  const field = {hidden: true, focus(){this.focused=true;}, select(){this.selected=true;}, setSelectionRange(start,end){this.selection=[start,end];}};
  const status = {textContent: ''};
  const details = {open:false};
  const buttons = ['question','link'].map(copyNote => ({hidden:true,dataset:{copyNote},addEventListener(type,fn){this[type]=fn;}}));
  const note = {id:'reflection-wonder',querySelector(selector){return ({details,'.note-copy':field,'.note-status':status,'.reflection-prompt':{textContent:'  What is one thing you noticed today?  '}})[selector];},querySelectorAll(){return buttons;},scrollIntoView(){this.scrolled=true;}};
  const window = {location:{hash},addEventListener(type,fn){this[type]=fn;}};
  const context = {window,navigator:{clipboard},document:{querySelectorAll(){return [note];}}};
  vm.runInNewContext(code,context);
  return {note,details,field,status,buttons,window,context};
}

(async () => {
  const linked = setup();
  assert(linked.details.open, 'a saved reflection link opens its full text on page load');
  assert(linked.note.scrolled);
  assert(linked.buttons.every(button=>!button.hidden));
  const unrelated = setup('#contact');
  assert.equal(unrelated.details.open,false,'unrelated anchors do not open a reflection');
  unrelated.window.location.hash='#reflection-wonder';
  unrelated.window.hashchange();
  assert(unrelated.details.open,'in-page entry paths open their destination reflection');
  let copied;
  const success = setup('',{async writeText(value){copied=value;}});
  await success.buttons[0].click();
  assert.equal(copied,'What is one thing you noticed today?');
  assert.match(success.status.textContent,/Question copied/);
  assert(success.field.hidden);
  await success.buttons[1].click();
  assert.equal(copied,'https://woowooish.com/#reflection-wonder');
  assert.match(success.status.textContent,/Link copied/);
  await linked.buttons[1].click();
  assert.equal(linked.field.value,'https://woowooish.com/#reflection-wonder');
  assert.equal(linked.field.hidden,false,'no clipboard API uses manual selection');
  assert(linked.field.focused && linked.field.selected);
  const denied = setup('',{async writeText(){throw Error('NotAllowedError');}});
  await denied.buttons[0].click();
  assert.equal(denied.field.hidden,false,'denied permission uses manual selection');
  assert.match(denied.status.textContent,/Text selected/);
  // Resolving an earlier copy must not replace the later action's status or value.
  const pending=[];
  const race=setup('',{writeText(){return new Promise(resolve=>pending.push(resolve));}});
  const oldCopy=race.buttons[0].click();
  const newCopy=race.buttons[1].click();
  pending[1](); await newCopy;
  pending[0](); await oldCopy;
  assert.match(race.status.textContent,/Link copied/);
  assert.equal(race.field.value,'https://woowooish.com/#reflection-wonder');
  // With no notes the enhancement must safely exit (for reuse on other pages).
  vm.runInNewContext(code,{document:{querySelectorAll(){return [];}}});
  const markup=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.equal((markup.match(/class="start-path"/g)||[]).length,3);
  assert.equal((markup.match(/class="featured-note"/g)||[]).length,1);
  assert.equal((markup.match(/data-copy-note="question"/g)||[]).length,5);
  assert.equal((markup.match(/data-copy-note="link"/g)||[]).length,5);
  assert.match(markup,/remembering what’s already within/);
  assert.match(markup,/aerospace by day/);
  assert.match(markup,/Life doesn’t have to be perfect/);
  console.log('PASS: reflection deep links, entry routes, question/link copy, unavailable and denied clipboard, concurrent copy handling, and Annie brand content.');
})().catch(error=>{console.error(error);process.exitCode=1;});
