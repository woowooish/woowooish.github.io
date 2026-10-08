/* Optional, local-only enhancements. The writing and all nine prompts remain in HTML. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const required = ['setting-controls', 'invitation-label', 'invitation-title', 'invitation-body', 'invitation-question', 'another-invitation', 'observed', 'felt', 'wondering', 'notebook-actions', 'copy-note', 'save-note', 'clear-note', 'note-status', 'manual-copy', 'copy-text', 'share-guide', 'share-status', 'share-fallback', 'share-url'];
  if (!required.every(id => get(id))) return;
  const guideUrl = 'https://woowooish.com/the-art-of-noticing/';
  const invitations = {
    home: [
      ['Meet an ordinary object.', 'Choose a cup, a key, a folded shirt or something else nearby. Notice one detail you usually skip: its weight, a worn edge, the way the light meets it. You do not have to find a deeper meaning. Let the detail be enough.', 'What was here before you thought to look?'],
      ['Find a patch of light.', 'Look at light on a wall or an object, not directly at the sun. Notice the shape of it, the edges, and where it meets a shadow. There is no perfect way to look. A passing glance is a place to begin.', 'What changes while you are here?'],
      ['Let one sound arrive.', 'Notice a nearby sound without needing to identify every sound around you. A kettle, a passing car, a bird, the room itself. No need to make the surroundings quieter. Use another sense if listening is not comfortable or available.', 'What happens when you do not have to search for something special?']
    ],
    outside: [
      ['Look at the in-between.', 'From a safe, comfortable place, notice the space between branches, buildings or clouds. You can stay seated. There is no distance to cover and no destination to reach.', 'What comes into view when you look at the gaps?'],
      ['Notice a small change.', 'Stay still somewhere comfortable. Watch a shadow, a leaf or the surface of water from a safe distance. Let the scene set its own pace. Nothing dramatic has to happen.', 'What is moving without needing you to move it?'],
      ['Leave the photograph untaken.', 'Give one small scene a moment before reaching for your phone. Notice a detail you might not be able to capture. You can still take a photograph afterward; this is not a rule against remembering.', 'What would you remember without a photograph?']
    ],
    company: [
      ['Ask a smaller question.', 'Try asking someone: “What is one small thing you noticed today?” Leave room for an ordinary answer, or no answer. Listen without needing to turn it into advice or a story of your own.', 'What would you have missed without asking?'],
      ['Notice an act of care.', 'Look for something concrete, not a hidden message: a held door, a checked-in text, a cup made for someone. There is no need to rank it or repay it immediately. A specific thank-you is one option.', 'What did that action make room for?'],
      ['Let a moment be unfilled.', 'With someone comfortable with a little quiet, let a pause stay a pause. No need to manufacture intimacy or turn silence into an exercise. Simply leave a little room.', 'What does company look like without performing?']
    ]
  };
  const settingNames = {home: 'AT HOME', outside: 'OUTSIDE', company: 'WITH SOMEONE'};
  const positions = {home: 0, outside: 0, company: 0};
  let setting = 'home';
  function showInvitation() {
    const index = positions[setting];
    const [title, body, question] = invitations[setting][index];
    get('invitation-label').textContent = settingNames[setting] + ' · INVITATION ' + (index + 1) + ' OF ' + invitations[setting].length;
    get('invitation-title').textContent = title;
    get('invitation-body').textContent = body;
    get('invitation-question').textContent = question;
    for (const button of document.querySelectorAll('[data-setting]')) button.setAttribute('aria-pressed', String(button.dataset.setting === setting));
  }
  for (const button of document.querySelectorAll('[data-setting]')) {
    button.addEventListener('click', () => {
      if (!Object.prototype.hasOwnProperty.call(invitations, button.dataset.setting)) return;
      setting = button.dataset.setting;
      showInvitation();
    });
  }
  get('another-invitation').addEventListener('click', () => {
    positions[setting] = (positions[setting] + 1) % invitations[setting].length;
    showInvitation();
  });

  const fields = ['observed', 'felt', 'wondering'].map(get);
  let noteRevision = 0;
  function discardCopyPreview() {
    noteRevision += 1;
    get('manual-copy').hidden = true;
    get('copy-text').value = '';
    get('note-status').textContent = '';
  }
  fields.forEach(field => field.addEventListener('input', discardCopyPreview));
  function assembleNote() {
    if (!fields.some(field => field.value.trim())) {
      get('note-status').textContent = 'Add a few words in any field first. There is no need to fill them all.';
      fields[0].focus({preventScroll: true});
      return null;
    }
    return 'WOOWOOISH / ORDINARY WONDER\nA field note to myself\n\n' +
      'SOMETHING I NOTICED\n' + fields[0].value.trim() + '\n\n' +
      'WHAT IT BROUGHT UP\n' + fields[1].value.trim() + '\n\n' +
      'A QUESTION I AM LEAVING OPEN\n' + fields[2].value.trim() + '\n\n' +
      'Inspired by The art of noticing\n' + guideUrl + '\n';
  }
  async function writeClipboard(text) {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* Manual selection is the fallback, never silent failure. */ }
    return false;
  }
  get('copy-note').addEventListener('click', async () => {
    const text = assembleNote();
    if (text === null) return;
    const revision = noteRevision;
    const button = get('copy-note');
    button.disabled = true;
    const copied = await writeClipboard(text);
    button.disabled = false;
    if (revision !== noteRevision) return;
    if (copied) {
      get('manual-copy').hidden = true;
      get('copy-text').value = '';
      get('note-status').textContent = 'Note copied. Paste it somewhere you would like to keep it.';
    } else {
      const field = get('copy-text');
      field.value = text;
      get('manual-copy').hidden = false;
      field.focus({preventScroll: true});
      field.select();
      field.setSelectionRange(0, text.length);
      get('note-status').textContent = 'Your note is selected below. Use your device’s Copy command to keep it.';
    }
  });
  get('save-note').addEventListener('click', () => {
    const text = assembleNote();
    if (text === null) return;
    let url;
    try {
      url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'woowooish-field-note.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      get('note-status').textContent = 'Text file prepared. Check your browser’s downloads. Your note was not sent to the website.';
    } catch (_) {
      get('note-status').textContent = 'This browser could not prepare the file. Use Copy my note, or select the writing yourself.';
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  });
  get('clear-note').addEventListener('click', () => {
    fields.forEach(field => { field.value = ''; });
    discardCopyPreview();
    get('note-status').textContent = 'Fields cleared. Copies and downloaded files are unchanged.';
    fields[0].focus({preventScroll: true});
  });
  get('share-guide').addEventListener('click', async () => {
    const button = get('share-guide');
    button.disabled = true;
    const copied = await writeClipboard(guideUrl);
    button.disabled = false;
    get('share-fallback').hidden = copied;
    if (copied) {
      get('share-status').textContent = 'Guide link copied. Your field note is not included.';
    } else {
      get('share-url').value = guideUrl;
      get('share-url').focus({preventScroll: true});
      get('share-url').select();
      get('share-status').textContent = 'Link selected below. Use your device’s Copy command. Your field note is not included.';
    }
  });
  // Expose controls only after all handlers have been installed successfully.
  ['setting-controls', 'another-invitation', 'notebook-actions', 'share-guide'].forEach(id => { get(id).hidden = false; });
})();
