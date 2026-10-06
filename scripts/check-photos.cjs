const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/site.css'), 'utf8');
let total = 0;
for (const name of ['annie-beach-walk', 'annie-sailing', 'annie-mountain-walk']) {
  const file = `assets/${name}.webp`;
  const bytes = fs.readFileSync(path.join(root, file));
  total += bytes.length;
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  const chunks = [];
  for (let offset = 12; offset + 8 <= bytes.length;) {
    chunks.push(bytes.toString('ascii', offset, offset + 4));
    offset += 8 + bytes.readUInt32LE(offset + 4) + (bytes.readUInt32LE(offset + 4) % 2);
  }
  assert(!chunks.some(chunk => ['EXIF', 'XMP ', 'ICCP'].includes(chunk)), `${file} has metadata`);
  const tag = html.match(new RegExp(`<img[^>]+src="${file}"[^>]*>`))[0];
  assert.match(tag, /alt="[^"]+"/);
  assert.match(tag, /width="900" height="1200"/);
  assert.match(tag, /loading="lazy" decoding="async"/);
}
assert(total < 600000, 'Added photos exceed 600kB');
assert(html.includes('assets/annie-beach.webp'), 'Keep the approved hero portrait');
assert(html.includes('not a scheduled gathering'), 'Do not imply sailing is a scheduled event');
assert(!html.includes('transform: scale(1.5)'), 'Remove the enlarged About crop');
assert.match(css, /\.about-photo \{[^}]*max-width:360px;[^}]*aspect-ratio:3\/4;/);
assert(!css.includes('.about-photo {min-height:380px'));
console.log(`Photo checks passed: three lazy-loaded, metadata-free WebP images (${total} bytes); bounded About portrait and unchanged hero.`);
