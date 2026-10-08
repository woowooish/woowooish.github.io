'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../assets/site-privacy.js'),'utf8');
let checks=0;
function boot({host='woowooish.com',dnt='0',gpc=false,optOut=false,denied=false,embedded=false}={}){
 const scripts=[],nodes={},listeners={};const stored=new Map(optOut?[['woowooish.analytics.optout.v1','1']]:[]);
 for(const id of ['analytics-off','analytics-on','analytics-preference','analytics-controls'])nodes[id]={addEventListener(k,fn){this[k]=fn;}};
 const context={URL,Set,localStorage:{getItem:k=>{if(denied)throw Error();return stored.get(k)??null;},setItem:(k,v)=>{if(denied)throw Error();stored.set(k,v);},removeItem:k=>{if(denied)throw Error();stored.delete(k);}},
 navigator:{doNotTrack:dnt,globalPrivacyControl:gpc},location:{hostname:host,pathname:'/pick-your-woo.html',search:'?email=private@example.com',hash:'#private'},
 document:{title:'Pick Your Woo | WooWooish',referrer:'https://ref.example/private?token=secret',getElementById:id=>nodes[id],createElement:()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}}),head:{append:s=>scripts.push(s)}}};
 context.window={self:1,top:embedded?2:1,addEventListener:(k,v)=>listeners[k]=v};vm.runInNewContext(code,context);
 return {context,scripts,nodes,stored,hook:context.window.wooBeforeAnalytics,listeners};
}
for(const opts of [{dnt:'1'},{gpc:true},{optOut:true},{host:'localhost'},{host:'unknown.example'},{embedded:true}]){
 const c=boot(opts);assert.equal(c.scripts.length,0);assert.equal(c.hook('event',{}),false);checks++;
}
const c=boot();assert.equal(c.scripts.length,1);checks++;
assert.equal(c.scripts[0].attrs['data-exclude-search'],'true');assert.equal(c.scripts[0].attrs['data-exclude-hash'],'true');assert.equal(c.scripts[0].attrs['data-before-send'],'wooBeforeAnalytics');checks++;
assert.equal(c.hook('identify',{name:'private'}),false);assert.equal(c.hook('event',{name:'click',data:{note:'private'}}),false);checks++;
const filtered=c.hook('event',{url:'/?secret=yes',referrer:'https://elsewhere/private',title:'PRIVATE',data:{note:'private'},screen:'390x844',language:'en'});
assert.equal(filtered.url,'/pick-your-woo.html');assert.equal(filtered.referrer,'https://ref.example');assert.equal(filtered.title,'Pick Your Woo | WooWooish');assert.equal(filtered.data,undefined);assert.equal(filtered.name,undefined);checks++;
c.nodes['analytics-off'].click();assert.equal(c.hook('event',{}),false);assert.equal(c.stored.get('woowooish.analytics.optout.v1'),'1');checks++;
c.nodes['analytics-on'].click();assert.equal(c.scripts.length,1);assert(c.hook('event',{}));checks++;
const denied=boot({denied:true});denied.nodes['analytics-off'].click();assert.equal(denied.hook('event',{}),false);assert.match(denied.nodes['analytics-preference'].textContent,/cannot save/);checks++;
c.stored.set('woowooish.analytics.optout.v1','1');c.listeners.storage({key:'woowooish.analytics.optout.v1'});assert.equal(c.hook('event',{}),false);checks++;
console.log(JSON.stringify({status:'PASS',checks}));
