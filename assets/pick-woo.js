/* The three covers share one library. A Woo is chosen only when a cover is clicked. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canonical = 'https://woowooish.com/pick-your-woo.html';
  const buttons = [...document.querySelectorAll('.card')];
  const names = ['The Sunbeam', 'The Moonlight', 'The Wildflower'];
  let picker;
  let selected = null;
  let busy = false;
  let revision = 0;
  let lastIndex = 0;

  function announce(text) { $('action-status').textContent = text; }
  function start(moveFocus = false) {
    revision += 1;
    selected = null;
    busy = false;
    $('result').hidden = true;
    $('copy-fallback').hidden = true;
    $('copy-text').value = '';
    $('reset-confirm').hidden = true;
    announce('');
    buttons.forEach((button, i) => {
      button.disabled = false;
      button.classList.remove('revealed');
      button.querySelector('strong').textContent = '';
      button.setAttribute('aria-label', 'Reveal ' + names[i] + ' card');
    });
    if (moveFocus) buttons[lastIndex].focus();
  }
  function historyStatus(draw) {
    let text = draw.persisted
      ? 'Repeat protection is saved in this browser. No repeat until you finish the library.'
      : 'Browser storage is unavailable. Repeat protection works in this open page only; reloading may repeat a Woo.';
    if (draw.persisted && !draw.coordinated) text += ' Pick in one tab at a time in this browser.';
    if (draw.historyRecovered) text += ' An unreadable saved history was repaired; earlier picks may repeat.';
    if (draw.cycle > 1) text += ' You are exploring a new round of the library.';
    $('history-status').textContent = text;
  }
  async function reveal(index) {
    if (!picker || busy || selected) return;
    busy = true;
    buttons.forEach(button => { button.disabled = true; });
    const current = ++revision;
    $('draw-status').textContent = 'Choosing a fresh Woo…';
    try {
      const draw = await picker.pick();
      if (current !== revision) return;
      selected = draw.entry;
      lastIndex = index;
      buttons[index].querySelector('strong').textContent = selected.title;
      buttons[index].setAttribute('aria-label', names[index] + ': ' + selected.title);
      buttons[index].classList.add('revealed');
      $('result-title').textContent = selected.title;
      $('woo-message').textContent = selected.message;
      $('woo-question').textContent = 'A moment to reflect: ' + selected.question;
      $('result').dataset.wooId = selected.id;
      $('result').hidden = false;
      $('draw-status').textContent = '';
      historyStatus(draw);
      $('result-title').focus({preventScroll: true});
      $('result').scrollIntoView({block: 'nearest', behavior: 'auto'});
    } catch (_) {
      $('draw-status').textContent = 'That draw could not finish. Please choose a card again.';
      buttons.forEach(button => { button.disabled = false; });
    } finally { busy = false; }
  }
  function wooText(entry) {
    return entry.title + '\n\n' + entry.message + '\n\nA moment to reflect: ' + entry.question + '\n\n' + canonical;
  }
  function manualCopy(text) {
    $('copy-text').value = text;
    $('copy-fallback').hidden = false;
    $('copy-text').focus();
    $('copy-text').select();
    announce('Your Woo is selected below. Use your device’s Copy command.');
  }
  async function share() {
    if (!selected) return;
    const current = revision;
    const text = wooText(selected);
    $('share').disabled = true;
    try {
      if (typeof navigator.share === 'function') {
        try { await navigator.share({title: 'A little Woo', text, url: canonical}); return; }
        catch (error) { if (error.name === 'AbortError' || current !== revision) return; }
      }
      let copied = false;
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text); copied = true;
        }
      } catch (_) { /* Accessible manual fallback below. */ }
      if (current !== revision) return;
      if (copied) announce('Your Woo was copied. Paste it wherever you would like to share it.');
      else manualCopy(text);
    } finally { $('share').disabled = false; }
  }
  function save() {
    if (!selected) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      const c = canvas.getContext('2d');
      if (!c) throw new Error('Canvas unavailable');
      c.fillStyle = '#f8f5ef'; c.fillRect(0, 0, 1080, 1350);
      c.strokeStyle = '#b8c8b9'; c.lineWidth = 3; c.strokeRect(75, 75, 930, 1200);
      c.textAlign = 'center';
      c.fillStyle = '#536958'; c.font = '30px sans-serif'; c.fillText('W O O W O O I S H', 540, 175);
      function lines(text, font, width) {
        c.font = font;
        const result = []; let line = '';
        for (const word of text.split(/\s+/)) {
          const test = line ? line + ' ' + word : word;
          if (c.measureText(test).width > width && line) { result.push(line); line = word; }
          else line = test;
        }
        result.push(line); return result;
      }
      // Fit complete messages, including the longest entries, before painting any text.
      let layout;
      for (let scale = 1; scale >= 0.65; scale -= 0.05) {
        const parts = [[selected.title, 'bold ' + Math.floor(54 * scale) + 'px Georgia', 72 * scale],
          [selected.message, Math.floor(38 * scale) + 'px Georgia', 58 * scale],
          [selected.question, 'italic ' + Math.floor(31 * scale) + 'px Georgia', 48 * scale]];
        layout = parts.map(([text, font, leading]) => ({font, leading, lines: lines(text, font, 810)}));
        const height = layout.reduce((sum, part) => sum + part.lines.length * part.leading, 0) + 100;
        if (height <= 840) break;
      }
      let y = 300;
      layout.forEach((part, i) => {
        c.font = part.font; c.fillStyle = i === 2 ? '#536958' : '#393c37';
        for (const line of part.lines) { c.fillText(line, 540, y); y += part.leading; }
        y += 50;
      });
      c.fillStyle = '#536958'; c.font = '26px sans-serif'; c.fillText('calm · peace · love', 540, 1200);
      c.font = '20px sans-serif'; c.fillText('woowooish.com/pick-your-woo.html', 540, 1240);
      const link = document.createElement('a');
      link.download = 'my-woo-' + selected.id + '.png'; link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link); link.click(); link.remove();
      announce('Your Woo image is ready. Check your browser’s downloads.');
    } catch (_) { manualCopy(wooText(selected)); }
  }
  buttons.forEach((button, i) => button.addEventListener('click', () => reveal(i)));
  $('again').addEventListener('click', () => start(true));
  $('share').addEventListener('click', share);
  $('save').addEventListener('click', save);
  $('reset-history').addEventListener('click', () => {
    $('reset-confirm').hidden = false;
    $('keep-history').focus();
  });
  $('keep-history').addEventListener('click', () => {
    $('reset-confirm').hidden = true;
    $('reset-history').focus();
  });
  $('reset-confirm').addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); $('keep-history').click(); }
  });
  $('confirm-reset').addEventListener('click', async () => {
    if (!picker || busy) return;
    busy = true; $('confirm-reset').disabled = true;
    try {
      const status = await picker.reset();
      start(true);
      $('history-status').textContent = status.removed
        ? 'Your Woo history was reset. Previously seen messages can appear again.'
        : 'This page was reset, but saved history could not be removed. Use your browser’s site-data settings to remove it.';
    } finally { busy = false; $('confirm-reset').disabled = false; }
  });
  async function init() {
    try {
      if (!globalThis.WooDeck) throw new Error('Picker did not load');
      const response = await fetch('/assets/woo-library.json?v=20261007-412', {credentials: 'omit'});
      if (!response.ok) throw new Error('Library did not load');
      const entries = WooDeck.validateLibrary(await response.json());
      picker = WooDeck.createPicker(entries);
      $('library-count').textContent = entries.length;
      $('library-info').hidden = false;
      $('picker-fallback').hidden = true;
      $('reset-history').disabled = false;
      start();
    } catch (_) {
      $('load-status').textContent = 'The cards could not load. Refresh the page to try again, or enjoy this reminder:';
    }
  }
  init();
})();
