'use strict';
// Dependency-free contract checks for permanent IDs, immutable snapshots and local QR.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const links = require('../assets/woo-links.js'), qr = require('../assets/woo-qr.js');
const live = require('../assets/woo-library.js'), archive = require('../assets/shared/v1/woo-library.js');
const sharing = require('../assets/daily-share.js');
const manifest = require('./shared-v1-manifest.json');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
for (const [file, sha] of Object.entries(manifest)) assert.equal(hash(fs.readFileSync(path.join(root, 'assets/shared/v1', file))), sha, 'Never overwrite a published snapshot: '+file);
assert.deepEqual(live, archive, 'Current picks must keep the v1 contract or introduce an explicit new snapshot version');
const keys = new Set(); let count = 0;
const ctx = {font:'', measureText(text) { return {width:Array.from(text).length * Number(this.font.match(/([\d.]+)px/)[1]) * 0.6}; }};
function check(content) {
  assert(content && links.parse(content.key));
  assert(!keys.has(content.key)); keys.add(content.key);
  const url = links.urlFor(content.key);
  assert(url.startsWith('https://woowooish.com/reflection.html?woo='));
  assert.equal(new URL(url).searchParams.get('woo'), content.key);
  assert(url.length <= 106); assert.equal(qr.encode(url).length, 37);
  const fit = sharing.layout(ctx, content);
  assert(fit.startY + fit.height <= 1022.001);
  for (const [i, key] of [[0,'title'],[1,'reflection'],[3,'question']]) {
    assert.equal(fit.blocks[i].lines.join('').replace(/\s/g,''), content[key].replace(/\s/g,''));
  }
  count++;
}
for (const entry of archive.entries) check(links.fromPick(entry));
for (const slug of links.teachers) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/shared/v1', slug+'.json')));
  assert.deepEqual(data, JSON.parse(fs.readFileSync(path.join(root,'assets/doses',slug+'.json'))), 'Current Daily Dose needs an explicit version for changed writing');
  for (let i=0;i<37;i++) {
    const content = links.fromDaily(data,i,slug); check(content);
    const route=links.parse(content.key); assert.equal(route.slug,slug);assert.equal(route.index,i);
  }
}
assert.equal(count,782);
for (const value of [null,{},'', 'p2-original-01','d1-jesus-00','d1-jesus-38','d1-unknown-01','d1-../../buddha-01','p1-<script>-01','p1-original-01/','javascript:alert(1)','p1-original-01?x=y','x'.repeat(1000)]) assert.equal(links.parse(value),null);
for (const test of require('./qr-golden.json')) {
  const flat = qr.encode(test.url).flat().map(Number).join('');
  assert.equal(hash(flat),test.sha256,'QR must match independent Model 2 reference matrix');
}
assert.throws(()=>qr.encode('x'.repeat(107))); assert.throws(()=>qr.encode('🤍'));
const reader=fs.readFileSync(path.join(root,'assets/shared-reflection.js'),'utf8');
assert(!/WooDeck|WooAtomic|localStorage|indexedDB|innerHTML|eval\(/.test(reader),'Reader must not draw, access history, or interpolate HTML');
const html=fs.readFileSync(path.join(root,'reflection.html'),'utf8');
assert(!/woo-deck|woo-picker|atomic-store|gratitude-store/.test(html),'No storage engine on shared page');
console.log(JSON.stringify({status:'PASS',permanentLinks:count,pickSnapshots:412,dailySnapshots:370,qrGoldenMatrices:require('./qr-golden.json').length,scope:'stable versioned keys, immutable public snapshots, text retention and QR reference parity'}));
