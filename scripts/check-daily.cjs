'use strict';
// Current 370-reflection Daily Dose algorithm and content integrity regression.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {dailyDoseIndex,dailyDoseSelection,WOO_DAILY_COUNT,WOO_DAILY_TEACHERS}=require('../assets/daily.js');
assert.equal(WOO_DAILY_COUNT,370);
assert.equal(WOO_DAILY_TEACHERS.length,10);
const slugs=new Set(WOO_DAILY_TEACHERS);
assert.equal(slugs.size,10);
const seenTitles=new Set();
let records=0;
const collections={};
for(const slug of slugs){
 const filename=path.join(root,'assets','doses',slug+'.json');
 const data=JSON.parse(fs.readFileSync(filename,'utf8'));
 assert.equal(typeof data.teacher,'string',slug+' teacher');
 assert.equal(data.doses.length,37,slug+' must have 37 reflections');
 assert(data.source?.startsWith('https://'),slug+' must link inspiration source');
 for(const dose of data.doses){
  assert(['title','reflection','question'].every(k=>typeof dose[k]==='string'&&dose[k].trim().length>8),slug+' complete reflection');
  assert(!seenTitles.has(dose.title),slug+' duplicated title: '+dose.title);
  seenTitles.add(dose.title);records++;
 }
 collections[slug]=data;
}
assert.equal(records,370);
for(let n=0;n<370*2;n++){
 const d=new Date(2026,9,5+n,12);
 const s=dailyDoseSelection(d);
 assert.equal(s.index,n%370,'deterministic 370-day cycle');
 assert.equal(s.slug,WOO_DAILY_TEACHERS[n%10],'teacher rotation');
 assert.equal(s.entryIndex,Math.floor((n%370)/10),'teacher entry order');
 assert(collections[s.slug].doses[s.entryIndex],'selection must exist');
}
assert.equal(dailyDoseIndex(new Date(2026,9,5,12)),0);
assert.equal((dailyDoseIndex(new Date(2026,10,1,12))+1)%370,dailyDoseIndex(new Date(2026,10,2,12)));
for(let d=0;d<100;d++){
 const start=new Date(2026,2,1+d,12);
 const after=new Date(start.getFullYear(),start.getMonth(),start.getDate()+1,12);
 assert.equal((dailyDoseIndex(start)+1)%370,dailyDoseIndex(after),'DST calendar continuity');
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const daily=fs.readFileSync(path.join(root,'daily-woo.html'),'utf8');
assert(home.includes('id="daily-feature"')&&home.includes('id="daily-status"'),'homepage integration exists');
assert(daily.includes('id="daily-feature"')&&daily.includes('id="daily-status"'),'dedicated page integration exists');
assert(home.includes('assets/daily.js')&&daily.includes('/assets/daily.js'),'both experiences share deterministic engine');
console.log('Daily Dose checks PASS:',records,'distinct original records, 740 deterministic daily assignments, DST continuity, and two page integrations');

// UTC-only CI cannot exercise local-day and daylight-saving regressions.
const {spawnSync}=require('node:child_process');
const zones=['UTC','America/Los_Angeles','America/New_York','Pacific/Honolulu',
 'Europe/Berlin','Australia/Lord_Howe','Pacific/Auckland','Asia/Kathmandu'];
const testSource=`
const assert=require('node:assert/strict');
const {dailyDoseIndex}=require('./assets/daily.js');
let assertions=0;
for(let day=0;day<740;day++){
 const date=new Date(2026,0,1+day,12);
 const y=date.getFullYear(),m=date.getMonth(),d=date.getDate();
 const expected=((Date.UTC(y,m,d)/86400000-Date.UTC(2026,9,5)/86400000)%370+370)%370;
 for(const [h,min,sec] of [[0,0,0],[1,59,59],[2,30,0],[12,0,0],[23,59,59]]){
  assert.equal(dailyDoseIndex(new Date(y,m,d,h,min,sec)),expected,'same local calendar day in '+process.env.TZ);assertions++;
 }
 assert.equal(dailyDoseIndex(new Date(y,m,d+1,0,0,0)),(expected+1)%370,'local midnight increments once');assertions++;
}
if(['America/Los_Angeles','America/New_York','Europe/Berlin','Australia/Lord_Howe','Pacific/Auckland'].includes(process.env.TZ)){
 assert.notEqual(new Date(2026,0,15).getTimezoneOffset(),new Date(2026,6,15).getTimezoneOffset(),'this zone must actually exercise DST');assertions++;
}
console.log(JSON.stringify({timezone:process.env.TZ,assertions}));
`;
for(const zone of zones){
 const run=spawnSync(process.execPath,['-e',testSource],{cwd:root,env:{...process.env,TZ:zone},encoding:'utf8',timeout:20000});
 assert.equal(run.status,0,zone+': '+run.stderr);
 console.log(run.stdout.trim());
}
console.log('Daily local-calendar matrix PASS:',zones.length,'timezones, 740 dates per timezone, near-midnight and DST cases');
