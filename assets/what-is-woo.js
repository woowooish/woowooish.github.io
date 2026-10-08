/* Optional reflection controls. No submission, analytics events or persistent writing. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const required = ['woo-personal','woo-result','woo-result-text','woo-copy-status','woo-reveal','woo-copy','woo-manual-copy','woo-copy-text'];
  if (!required.every(id => get(id))) return;
  const choices = [...document.querySelectorAll('.woo-choice')];
  let chosen = '';
  let revision = 0;
  function invalidate() {
    revision += 1;
    get('woo-result').hidden = true;
    get('woo-result-text').textContent = '';
    get('woo-copy-status').textContent = '';
    get('woo-manual-copy').hidden = true;
    get('woo-copy-text').value = '';
    get('woo-copy').disabled = false;
  }
  choices.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      chosen = button.dataset.woo;
      invalidate();
      choices.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
  get('woo-personal').addEventListener('input', invalidate);
  get('woo-reveal').addEventListener('click', () => {
    const value = get('woo-personal').value.trim() || chosen;
    if (!value) {get('woo-choice-status').textContent = 'Choose an idea or write a few words first.';get('woo-personal').focus();return;}
    invalidate();get('woo-choice-status').textContent = '';
    get('woo-result-text').textContent = 'To me, Woo is ' + value.replace(/[.!?]+$/, '') + '.';
    get('woo-result').hidden = false;
    get('woo-result').focus({preventScroll:true});
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    get('woo-result').scrollIntoView({behavior: reduce ? 'instant' : 'smooth', block:'nearest'});
  });
  get('woo-copy').addEventListener('click', async () => {
    if (get('woo-result').hidden) return;
    const stamp = revision;
    const text = get('woo-result-text').textContent + '\n\nWooWooish: https://woowooish.com/what-is-woo.html';
    get('woo-copy').disabled = true;
    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {await navigator.clipboard.writeText(text);copied = true;}
    } catch (_) { /* Manual selection is always available below. */ }
    if (stamp !== revision) return;
    get('woo-copy').disabled = false;
    if (copied) get('woo-copy-status').textContent = 'Copied. Paste it somewhere you choose.';
    else {
      get('woo-copy-text').value = text;get('woo-manual-copy').hidden = false;
      get('woo-copy-text').focus({preventScroll:true});get('woo-copy-text').select();
      get('woo-copy-status').textContent = 'Your reflection is selected below. Use your device’s Copy command.';
    }
  });
  get('woo-reveal').disabled = false;
  get('woo-enhancement-help').hidden = true;
})();
