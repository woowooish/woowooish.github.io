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
