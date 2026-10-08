'use strict';
// Dependency-free layout checks. Native browser interaction tests also run in CI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sharing = require('../assets/daily-share.js');
const ctx = {font: '', measureText(text) {return {width: Array.from(text).length * parseFloat(this.font.match(/([\d.]+)px/)[1]) * 0.58};}};
let count = 0, smallestBody = Infinity;
assert.equal(sharing.WIDTH, 1080); assert.equal(sharing.HEIGHT, 1350);
for (const name of fs.readdirSync(path.join(root, 'assets/doses'))) {
  if (!name.endsWith('.json')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/doses', name), 'utf8'));
  for (const dose of data.doses) {
    const result = sharing.layout(ctx, dose);
    assert(result.startY >= 292 && result.startY + result.height <= 1022.001);
    for (const [i, text] of [[0, dose.title], [1, dose.reflection], [3, dose.question]]) {
      const block = result.blocks[i]; ctx.font = block.font;
      assert.equal(block.lines.join(' ').replace(/\s/g, ''), text.replace(/\s/g, ''), 'No lost or invented text');
      for (const line of block.lines) assert(ctx.measureText(line).width <= 904, 'No horizontal clipping');
    }
    smallestBody = Math.min(smallestBody, result.blocks[1].fontSize); count++;
  }
}
assert.equal(count, 370, 'Preserve the full existing Daily Dose library');
assert(smallestBody >= 40, 'Existing reflections must stay readable in the shared image');
ctx.font = '400 46px Arial';
const unbroken = 'a'.repeat(180);
assert.equal(sharing.wrapLines(ctx, unbroken, 904).join(''), unbroken);
for (const file of ['index.html', 'daily-woo.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(html, /daily-share\.js\?v=20261008-instagram-1/);
  assert.match(html, /daily-share\.css\?v=20261008-instagram-1/);
}
const source = fs.readFileSync(path.join(root, 'assets/daily-share.js'), 'utf8');
assert(!/\bfetch\s*\(|XMLHttpRequest|html2canvas|FB\.init|access_token|innerHTML\s*=/.test(source), 'No SDK, server request, token or HTML interpolation');
assert(source.includes('navigator.share({files: [file]})'), 'Share the actual image, not merely a link');
assert(source.includes("error.name === 'AbortError'"), 'Cancel must be handled explicitly');
console.log(JSON.stringify({status: 'PASS',reflections: count,smallestBodyPx: smallestBody,scope: 'all original text retained and fits; dependency-free layout and source checks'}));
