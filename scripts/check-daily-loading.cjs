'use strict';
// Isolated DOM/network boundaries; covers timeout and stale-result failures without network access.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(process.env.WOO_DAILY_SOURCE || path.join(__dirname,'../assets/daily.js'),'utf8');
let checks=0;
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const valid=(title='Synthetic daily title')=>({teacher:'Synthetic teacher',source:'https://example.invalid/',
 doses:Array.from({length:37},()=>({title,reflection:'A synthetic ordinary reflection.',question:'What do you notice in this test?'}))});
function boot({clipboard}={}){
 let now='2026-10-08T12:00:00';let timerID=0;
 const timers=new Map(),intervals=[],requests=[],listeners={};
 class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.events={};this.hidden=false;this.disabled=false;this.value='';this.textContent='';this.isConnected=true;}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){const detach=n=>{n.isConnected=false;n.children.forEach(detach);};this.children.forEach(detach);this.children=nodes;}
  addEventListener(k,fn){this.events[k]=fn;}
  setAttribute(k,v){this[k]=v;}
  focus(){this.focused=true;}select(){this.selected=true;}
 }
 const nodes=Object.fromEntries(['daily-feature','daily-today','daily-date','daily-status','daily-retry'].map(id=>[id,new Element('div')]));
 class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}}
 const document={hidden:false,getElementById:id=>nodes[id],createElement:tag=>new Element(tag),addEventListener:(k,f)=>listeners[k]=f};
 const context={Date:Clock,document,navigator:{clipboard},AbortController,setTimeout:(fn,ms)=>{timers.set(++timerID,{fn,ms});return timerID;},clearTimeout:id=>timers.delete(id),
 fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}))};
 context.window={setInterval:fn=>intervals.push(fn),addEventListener:(k,f)=>listeners[k]=f};
 vm.runInNewContext(code,context);
 const descendants=(node)=>[node,...node.children.flatMap(descendants)];
 return {nodes,requests,timers,listeners,setNow:v=>{now=v;},tick:()=>intervals[0](),all:()=>descendants(nodes['daily-today']),
  deliver(i,data=valid(),ok=true){requests[i].resolve({ok,json:async()=>data});}};
}
async function main(){
 const timed=boot();assert.equal(timed.requests.length,1);checks++;
 const deadline=[...timed.timers.values()].find(t=>t.ms===12000);
 assert(deadline,'stalled request must have a deadline');checks++;
 deadline.fn();await flush();
 assert.match(timed.nodes['daily-status'].textContent,/taking too long/);assert.equal(timed.nodes['daily-retry'].hidden,false);checks++;
 assert.equal(timed.requests[0].options.signal.aborted,true);checks++;
 timed.nodes['daily-retry'].events.click();assert.equal(timed.requests.length,2);checks++;
 timed.deliver(0,valid('STALE'));timed.deliver(1,valid('Fresh after retry'));await flush();
 assert(timed.all().some(n=>n.textContent==='Fresh after retry'));assert(!timed.all().some(n=>n.textContent==='STALE'));checks++;
 assert.equal(timed.timers.size,0);checks++;
 const changed=boot();changed.deliver(0,valid('Yesterday'));await flush();
 assert(changed.all().some(n=>n.textContent==='Yesterday'));checks++;
 changed.setNow('2026-10-09T00:00:01');changed.tick();assert.equal(changed.nodes['daily-today'].children.length,0,'old article must not be relabeled');checks++;
 changed.deliver(1,null,false);await flush();assert.equal(changed.nodes['daily-retry'].hidden,false);assert.equal(changed.nodes['daily-today'].children.length,0);checks++;
 const midnight=boot();midnight.setNow('2026-10-09T00:00:01');midnight.deliver(0,valid('Too late'));await flush();
 assert.equal(midnight.requests.length,2,'day-change during fetch should immediately request new day');checks++;
 midnight.deliver(1,valid('New day'));await flush();assert(midnight.all().some(n=>n.textContent==='New day'));checks++;
 for(const bad of [null,{},valid(''),{...valid(),teacher:{}},{...valid(),doses:[]},valid('x'.repeat(181))]){
  const client=boot();client.deliver(0,bad);await flush();assert.equal(client.nodes['daily-retry'].hidden,false);assert.equal(client.nodes['daily-today'].children.length,0);checks++;
 }
 let finish;
 const copy=boot({clipboard:{writeText:()=>new Promise(resolve=>{finish=resolve;})}});copy.deliver(0);await flush();
 const button=copy.all().find(n=>n.tagName==='button');button.events.click();assert.equal(button.disabled,true);checks++;
 const oldStatus=copy.all().find(n=>n.className==='note-status');
 copy.setNow('2026-10-09T00:00:01');copy.tick();finish();await flush();assert.equal(oldStatus.textContent,'');checks++;
 copy.deliver(1);await flush();
 const denied=boot();denied.deliver(0);await flush();denied.all().find(n=>n.tagName==='button').events.click();await flush();
 assert.equal(denied.all().find(n=>n.tagName==='textarea').hidden,false);assert.equal(denied.all().find(n=>n.tagName==='button').disabled,false);checks++;
 console.log(JSON.stringify({status:'PASS',checks,scope:'simulated clock, DOM, requests and deadline; production loading code'}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
