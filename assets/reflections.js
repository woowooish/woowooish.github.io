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
