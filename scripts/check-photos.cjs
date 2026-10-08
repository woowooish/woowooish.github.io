const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/site.css'), 'utf8');
let total = 0;
for (const name of ['annie-beach-walk-clean', 'annie-sailing', 'annie-mountain-walk']) {
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
assert(html.includes('assets/annie-beach-walk-clean.webp'), 'Keep the approved Our Story portrait');
assert(html.includes('id="annie"'), 'Keep the Our Story section');
assert(html.includes('not a scheduled gathering'), 'Do not imply sailing is a scheduled event');
assert(!html.includes('transform: scale(1.5)'), 'Remove the enlarged About crop');
assert.match(css, /\.about-layout \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);[^}]*align-items:stretch;/);
assert.match(css, /\.about-photo img \{[^}]*position:absolute;[^}]*object-fit:cover;/);
assert.match(css, /@media\(max-width:960px\) \{\s*\.about-layout \{grid-template-columns:1fr;\}\s*\.about-photo \{aspect-ratio:3\/4;\}/);
assert(!css.includes('.about-photo{max-width:360px'), 'About photo should fill its equal-size desktop card');
assert(!css.includes('.about-photo {min-height:380px'));
console.log(`Photo checks passed: three lazy-loaded, metadata-free WebP images (${total} bytes); equal-size desktop About cards, responsive portrait and preserved Our Story imagery.`);
