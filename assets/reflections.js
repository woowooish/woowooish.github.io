'use strict';

// Reflections stay readable without this optional copy and deep-link enhancement.
(() => {
  const notes = [...document.querySelectorAll('.reflection-card, .featured-note, .dose-note')];
  if (!notes.length) return;

  function openLinkedReflection() {
    const note = notes.find(item => '#' + item.id === window.location.hash);
    if (!note) return;
    const details = note.querySelector('details');
    if (details && !details.open) {
      details.open = true;
      note.scrollIntoView({block: 'start'});
    }
  }

  for (const note of notes) {
    const status = note.querySelector('.note-status');
    const field = note.querySelector('.note-copy');
    let revision = 0;
    for (const button of note.querySelectorAll('[data-copy-note]')) {
      button.hidden = false;
      button.addEventListener('click', async () => {
        const currentRevision = ++revision;
        const isLink = button.dataset.copyNote === 'link';
        const text = isLink
          ? 'https://woowooish.com/#' + note.id
          : note.querySelector('.reflection-prompt').textContent.trim();
        // Set only plain text; a failed clipboard request still leaves a usable copy field.
        field.value = text;
        field.hidden = true;
        status.textContent = '';
        let copied = false;
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            copied = true;
          }
        } catch (_) { /* Manual selection remains available. */ }
        if (revision !== currentRevision) return;
        if (copied) {
          status.textContent = isLink ? 'Link copied. Keep it or share it with someone.' : 'Question copied. Take it into your day.';
        } else {
          field.hidden = false;
          field.focus({preventScroll: true});
          field.select();
          field.setSelectionRange(0, text.length);
          status.textContent = 'Text selected below. Use your device’s Copy command.';
        }
      });
    }
  }
  window.addEventListener('hashchange', openLinkedReflection);
  openLinkedReflection();
})();

// A small, independent discovery card. The existing homepage HTML stays untouched.
(() => {
  // The optional discovery card also tolerates partial, non-browser DOM hosts.
  if (typeof document.getElementById !== 'function') return;
  const start = document.getElementById('start-here');
  if (!start || document.getElementById('noticing-feature')) return;
  const feature = document.createElement('section');
  feature.id = 'noticing-feature';
  feature.setAttribute('aria-labelledby', 'noticing-feature-heading');
  feature.style.cssText = 'background:#edf7f8;padding:24px clamp(16px,4vw,48px) 48px;color:#052453;';
  const panel = document.createElement('div');
  panel.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;background:#052453;color:#f7fcfc;border-radius:24px;padding:clamp(26px,4vw,48px);';
  const copy = document.createElement('div');
  copy.style.cssText = 'flex:1 1 300px;min-width:0;';
  const label = document.createElement('p');
  label.textContent = 'FIELD GUIDE 01 · EVERYDAY WONDER';
  label.style.cssText = 'font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.04em;color:#9bdee0;line-height:1.7;margin:0 0 16px;';
  const title = document.createElement('h2');
  title.id = 'noticing-feature-heading';
  title.textContent = 'The art of noticing.';
  title.style.cssText = 'font-size:clamp(34px,4.5vw,56px);line-height:1.05;letter-spacing:-.04em;margin:0 0 16px;font-weight:800;';
  const description = document.createElement('p');
  description.textContent = 'A little less searching. A little more here. Explore thoughtful reflections, nine small invitations and a field notebook for ordinary wonder.';
  description.style.cssText = 'font-size:17px;line-height:1.65;max-width:35em;margin:0;color:#d3e8ee;';
  const link = document.createElement('a');
  link.href = '/the-art-of-noticing/';
  link.textContent = 'Open the field guide ↗';
  link.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-height:48px;background:#9bdee0;color:#052453;border-radius:999px;padding:17px 25px;font-size:15px;font-weight:700;line-height:1.4;text-decoration:none;';
  copy.append(label, title, description);
  panel.append(copy, link);
  feature.append(panel);
  start.insertAdjacentElement('afterend', feature);
})();
