/* The three covers stay empty until a click reserves a Woo from the no-repeat deck. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const status = byId('picker-status');
  if (!status) return;
  if (!window.WooLibrary || !window.WooDeck || !window.WooAtomic) {
    status.textContent = 'The card library could not load. Reload to try again, or enjoy the reflection below.';
    return;
  }
  const entries = window.WooLibrary.entries;
  const deck = window.WooDeck.create(entries);
  const cards = [...document.querySelectorAll('#cards .card')];
  const result = byId('result');
  const actionStatus = byId('action-status');
  const canonical = 'https://woowooish.com/pick-your-woo.html';
  let selected = null;
  let busy = false;
  let revision = 0;
  let historyNote = 'Choose any card. Your Woo is drawn at the moment you pick.';
  function showReady(focus) {
    revision += 1;
    selected = null;
    busy = false;
    result.hidden = true;
    result.removeAttribute('data-woo-id');
    byId('manual-copy').hidden = true;
    byId('copy-text').value = '';
    actionStatus.textContent = '';
    cards.forEach(card => {
      card.disabled = false;
      card.classList.remove('revealed');
      card.querySelector('.back strong').textContent = 'A little reminder';
    });
    status.textContent = historyNote;
    if (focus) cards[0].focus();
  }
  function describeHistory(outcome) {
    let text = outcome.persistent
      ? 'This browser remembers your picks. No repeats until the collection has been explored.'
      : 'Storage is unavailable. No repeats in this open page; reloading may bring earlier Woos back.';
    if (!outcome.coordinated) text += ' Use one tab for reliable repeat protection.';
    if (outcome.legacyUnavailable) text += ' Older-tab history could not be checked. Refresh older tabs before picking there.';
    if (outcome.legacyUnreadable) text += ' Older-tab history was unreadable and could not be combined. This pick uses the current browser history. Refresh older tabs before picking there.';
    if (outcome.recovered) text = 'Your saved history was unreadable, so this pick starts a fresh history. ' + text;
    if (outcome.restarted) text = 'You explored the collection. A new round has begun, without repeating today’s picks. ' + text;
    return text;
  }
  async function reveal(index) {
    if (busy || selected) return;
    busy = true;
    cards.forEach(card => { card.disabled = true; });
    status.textContent = 'Choosing a fresh Woo…';
    try {
      const outcome = await deck.next();
      historyNote = describeHistory(outcome);
      if (outcome.exhausted) {
        busy = false;
        cards.forEach(card => { card.disabled = false; });
        status.textContent = 'You have explored all ' + deck.total + ' Woos today. Return on the next local day for a new round, without a same-day repeat.';
        return;
      }
      selected = outcome.entry;
      revision += 1;
      cards[index].querySelector('.back strong').textContent = selected.title;
      cards[index].classList.add('revealed');
      byId('woo-title').textContent = selected.title;
      byId('woo-message').textContent = selected.body;
      byId('woo-question').textContent = 'A moment to reflect: ' + selected.question;
      byId('woo-theme').textContent = selected.theme;
      byId('share').disabled = false;
      byId('save').disabled = false;
      result.dataset.wooId = selected.id;
      result.hidden = false;
      status.textContent = historyNote;
      busy = false;
      byId('woo-title').focus({preventScroll: true});
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      result.scrollIntoView({block: 'nearest', behavior: reduce ? 'instant' : 'smooth'});
    } catch (error) {
      busy = false;
      cards.forEach(card => { card.disabled = false; });
      status.textContent = error && error.code === 'storage-unavailable'
        ? 'Saved pick history could not be opened. Your earlier history is unchanged. Reload the page to retry, or enjoy the reflection below.'
        : 'This pick could not be reserved. Please choose a card again.';
      byId('fallback-woo').hidden = false;
    }
  }
  function wooText(entry) {
    return entry.title + '\n\n' + entry.body + '\n\nA moment to reflect: ' + entry.question + '\n\n' + canonical;
  }
  async function share() {
    if (!selected) return;
    const stamp = revision;
    const text = wooText(selected);
    const button = byId('share');
    button.disabled = true;
    byId('manual-copy').hidden = true;
    actionStatus.textContent = '';
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({title: 'A little Woo', text, url: canonical});
          if (stamp === revision) actionStatus.textContent = 'Share action completed.';
          return;
        } catch (error) {
          if (error.name === 'AbortError') {
            if (stamp === revision) actionStatus.textContent = 'Sharing cancelled. Your Woo is still here.';
            return;
          }
        }
      }
      if (stamp !== revision) return;
      let copied = false;
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (_) { /* A labelled manual-copy field remains available. */ }
      if (stamp !== revision) return;
      if (copied) actionStatus.textContent = 'Your Woo is copied. Paste it wherever you would like to share it.';
      else {
        byId('copy-text').value = text;
        byId('manual-copy').hidden = false;
        byId('copy-text').focus({preventScroll: true});
        byId('copy-text').select();
        actionStatus.textContent = 'Your Woo is selected below. Use your device’s Copy command.';
      }
    } finally {
      if (stamp === revision) button.disabled = false;
    }
  }
  function linesFor(context, text, width, font) {
    context.font = font;
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      const proposed = line ? line + ' ' + word : word;
      if (line && context.measureText(proposed).width > width) { lines.push(line); line = word; }
      else line = proposed;
    }
    if (line) lines.push(line);
    return lines;
  }
  function imageFor(entry) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image drawing unavailable');
    context.fillStyle = '#f8f5ef'; context.fillRect(0, 0, 1080, 1350);
    context.strokeStyle = '#b8c8b9'; context.lineWidth = 3; context.strokeRect(75, 75, 930, 1200);
    context.textAlign = 'center'; context.fillStyle = '#516957'; context.font = '30px sans-serif';
    context.fillText('W O O W O O I S H', 540, 195);
    let layout;
    for (let scale = 1; scale >= 0.6; scale -= 0.05) {
      const parts = [
        {text: entry.title, font: 'bold ' + Math.round(58 * scale) + 'px Georgia', line: 76 * scale, color: '#393c37'},
        {text: entry.body, font: Math.round(39 * scale) + 'px Georgia', line: 60 * scale, color: '#393c37'},
        {text: entry.question, font: 'italic ' + Math.round(32 * scale) + 'px Georgia', line: 49 * scale, color: '#516957'}
      ];
      parts.forEach(part => { part.lines = linesFor(context, part.text, 800, part.font); });
      const height = parts.reduce((sum, part) => sum + part.lines.length * part.line, 0) + 130;
      if (height <= 790) { layout = {parts, height}; break; }
    }
    if (!layout) throw new Error('Woo is too long for this image layout');
    let y = 285 + (790 - layout.height) / 2;
    layout.parts.forEach((part, index) => {
      context.font = part.font; context.fillStyle = part.color;
      part.lines.forEach(line => { context.fillText(line, 540, y); y += part.line; });
      if (index < 2) y += 65;
    });
    context.fillStyle = '#516957'; context.font = '28px sans-serif';
    context.fillText('calm · peace · love', 540, 1170);
    context.font = '22px sans-serif'; context.fillText('woowooish.com', 540, 1220);
    return canvas;
  }
  async function save() {
    if (!selected) return;
    const stamp = revision;
    const entry = selected;
    const button = byId('save');
    button.disabled = true;
    try {
      const canvas = imageFor(entry);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Empty image')), 'image/png'));
      if (stamp !== revision) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'my-woo-' + entry.id + '.png'; link.href = url;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      actionStatus.textContent = 'Your image is ready. Check your browser’s downloads.';
    } catch (_) {
      if (stamp === revision) actionStatus.textContent = 'The image could not be prepared. Use Share my Woo to copy the words instead.';
    } finally { if (stamp === revision) button.disabled = false; }
  }
  cards.forEach((card, index) => card.addEventListener('click', () => reveal(index)));
  byId('again').addEventListener('click', () => showReady(true));
  byId('share').addEventListener('click', share);
  byId('save').addEventListener('click', save);
  byId('fallback-woo').hidden = true;
  showReady(false);
})();
