/* Local QR encoder for short public links. QR Model 2, version 5, level L,
   byte mode, fixed mask 0, four-module quiet zone. No network or dependencies.
   Restricted to ASCII <=106 bytes. Golden matrices are checked independently. */
(function (root) {
  'use strict';
  function encode(text) {
    if (typeof text !== 'string' || !/^[\x20-\x7e]{1,106}$/.test(text)) throw new Error('Unsupported QR content');
    const bits = [], put = (value, size) => { for (let i = size - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
    put(4, 4); put(text.length, 8);
    for (const ch of text) put(ch.charCodeAt(0), 8);
    put(0, Math.min(4, 864 - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
    for (let pad = 0; data.length < 108; pad++) data.push(pad % 2 ? 0x11 : 0xec);
    function multiply(x, y) {
      let z = 0;
      for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
      return z;
    }
    const divisor = Array(26).fill(0); divisor[25] = 1;
    let power = 1;
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) { divisor[j] = multiply(divisor[j], power); if (j < 25) divisor[j] ^= divisor[j + 1]; }
      power = multiply(power, 2);
    }
    const remainder = Array(26).fill(0);
    for (const byte of data) {
      const factor = byte ^ remainder.shift(); remainder.push(0);
      for (let i = 0; i < 26; i++) remainder[i] ^= multiply(divisor[i], factor);
    }
    const codewords = data.concat(remainder), size = 37;
    const cells = Array.from({length: size}, () => Array(size).fill(false));
    const reserved = Array.from({length: size}, () => Array(size).fill(false));
    function set(x, y, value) { cells[y][x] = !!value; reserved[y][x] = true; }
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    function finder(x, y) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const xx = x + dx, yy = y + dy, distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, distance !== 2 && distance !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(30 + dx, 30 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    // Level L format bits (01), mask 0; BCH(15,5), then XOR format mask.
    const formatData = 8; let rem = formatData;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const format = ((formatData << 10) | rem) ^ 0x5412;
    const bit = i => ((format >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
    let index = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vertical = 0; vertical < size; vertical++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vertical : vertical;
        if (reserved[y][x]) continue;
        const value = index < codewords.length * 8 && ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) !== 0;
        cells[y][x] = value !== ((x + y) % 2 === 0); index++;
      }
    }
    return cells;
  }
  function draw(canvas, text) {
    const cells = encode(text), border = 4, scale = 6;
    canvas.width = canvas.height = (cells.length + border * 2) * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('QR drawing unavailable');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    cells.forEach((row, y) => row.forEach((dark, x) => { if (dark) ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale); }));
  }
  const api = Object.freeze({encode, draw});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WooQR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
