/* Notes never leave this page except through the reader's explicit file download. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const needed = ['gratitude-form','thought','entries','glass','count','status','jar-storage','jar-export','jar-more','jar-confirm','jar-keep','jar-remove','jar-confirm-text','jar-tools','jar-loading'];
  if (!window.WooGratitude || !window.WooAtomic || !needed.every(id => get(id))) return;
  const store = WooGratitude.create();
  const input = get('thought');
  const submit = get('gratitude-form').querySelector('[type="submit"]');
  if (!submit) return;
  const status = get('status');
  let snapshot = store.load();
  let shown = 30;
  let pending = null;
  let busy = false;
  const hasRecovery = value => value.recovery !== null || value.legacyRecovery !== null;
  const recoveryLabel = value => value.legacyRecovery !== null || input.value
    ? 'Download recovery backup' : 'Download original saved data';
  function cancelRemoval(focus) {
    pending = null;
    get('jar-confirm').hidden = true;
    if (focus) input.focus({preventScroll: true});
  }
  function render() {
    snapshot = store.load();
    const notes = snapshot.items;
    get('count').textContent = notes.length + (notes.length === 1 ? ' moment' : ' moments') +
      (snapshot.unavailable ? ' shown here; saved storage is temporarily unavailable.' : snapshot.persistent ? ' saved in this browser.' : ' in this open visit, not saved across visits.');
    get('jar-storage').textContent = snapshot.unavailable
      ? 'Saved notes could not be opened. They have not been erased. Copy your draft or download a backup of the notes shown here, then reload to retry.'
      : snapshot.legacyRecovery !== null
      ? 'An older tab left data that needs attention. Both copies are unchanged. Download a recovery backup to keep them; adding and removing are paused.'
      : snapshot.blocked
      ? 'Some saved data could not be read safely. Your original storage has not been changed. Download a backup before seeking help; adding and removing are paused.'
      : snapshot.legacyUnavailable
      ? 'Saved notes are available, but older-tab storage could not be checked. Keep a backup and refresh older tabs before continuing there.'
      : snapshot.persistent
        ? 'Notes are stored on this device, not in a website account. Keep a backup: browser data can be cleared. ' +
          (snapshot.coordinated ? 'Changes are coordinated between tabs.' : 'Use one tab at a time to avoid conflicting changes.')
        : 'Browser storage is unavailable. Notes last only while this page stays open. Download a backup before leaving.';
    submit.disabled = busy || snapshot.blocked;
    get('jar-export').disabled = !notes.length && !input.value.trim() && !hasRecovery(snapshot);
    get('jar-export').textContent = hasRecovery(snapshot) ? recoveryLabel(snapshot) : 'Download a backup';
    const list = get('entries');
    list.replaceChildren();
    if (!notes.length) {
      const empty = document.createElement('p'); empty.className = 'muted';
      empty.textContent = snapshot.blocked ? 'Your saved data is being kept untouched.' : 'Your jar is ready. An ordinary moment is enough.';
      list.append(empty);
    }
    notes.slice().reverse().slice(0, shown).forEach(n => {
      const wrap = document.createElement('article'); wrap.className = 'entry';
      const time = document.createElement('time'); time.dateTime = new Date(n.date).toISOString();
      time.textContent = new Date(n.date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
      const text = document.createElement('p'); text.textContent = n.text;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove this note';
      remove.disabled = busy || snapshot.blocked;
      remove.setAttribute('aria-label', 'Remove note: ' + n.text.slice(0, 70));
      remove.addEventListener('click', () => {
        pending = n.id;
        get('jar-confirm-text').textContent = 'Remove this note? “' + n.text + '”';
        get('jar-confirm').hidden = false;
        get('jar-keep').focus();
      });
      wrap.append(time, text, remove); list.append(wrap);
    });
    get('jar-more').hidden = notes.length <= shown;
    get('glass').replaceChildren();
    const colors = ['#e5bfc0','#d4d7ee','#f1dba9','#c7d9be','#e8d2c4'];
    notes.slice(-22).forEach((_, i) => {
      const paper = document.createElement('div'); paper.className = 'note'; paper.textContent = '♡';
      paper.style.setProperty('--paper', colors[i % colors.length]);
      paper.style.setProperty('--rot', ((i * 41) % 55 - 27) + 'deg');
      paper.style.setProperty('--left', (10 + (i * 29) % 65) + '%');
      paper.style.setProperty('--bottom', (12 + (Math.floor(i / 3) * 25) % 225) + 'px');
      paper.setAttribute('aria-hidden', 'true'); get('glass').append(paper);
    });
  }
  function describe(error) {
    return ({write:'This change could not be saved. Your existing notes and the writing box have been kept. Download a backup before retrying.',
      unreadable:'Saved data needs attention. It has not been overwritten. Download the original data first.',
      full:'The jar has reached its safe storage limit. Download a backup, then remove an older note to make space.',
      changed:'That note changed in another tab. Nothing else was removed.',
      invalid:'Write between 1 and 500 characters before adding a note.'})[error && error.code] ||
      'This change could not be completed. Your writing and saved notes have been kept. Please try again.';
  }
  get('gratitude-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !input.reportValidity()) return;
    const value = input.value;
    if (!value.trim()) {status.textContent = 'A few words are enough. Please add a note first.';input.focus();return;}
    busy = true; render(); cancelRemoval(false);
    try {
      const result = await store.add(value);
      if (input.value === value) input.value = '';
      status.textContent = result.persistent ? 'Your note was saved in this browser.' : 'Added for this open visit only. Download a backup to keep it.';
    } catch (error) {await store.refresh();status.textContent = describe(error);}
    finally {busy = false; render(); input.focus({preventScroll: true});}
  });
  get('jar-keep').addEventListener('click', () => {cancelRemoval(true);status.textContent = 'Your note is unchanged.';});
  get('jar-confirm').addEventListener('keydown', event => {
    if (event.key === 'Escape' && !busy) {event.preventDefault();cancelRemoval(true);status.textContent = 'Your note is unchanged.';}
  });
  get('jar-remove').addEventListener('click', async () => {
    if (!pending || busy) return;
    const id = pending;
    busy = true; get('jar-remove').disabled = true; get('jar-keep').disabled = true; render();
    try {await store.remove(id);status.textContent = 'That note was removed. Downloaded backups are unchanged.';}
    catch (error) {await store.refresh();status.textContent = describe(error);}
    finally {busy = false;get('jar-remove').disabled = false;get('jar-keep').disabled = false;cancelRemoval(true);render();}
  });
  get('jar-export').addEventListener('click', async () => {
    const current = await store.refresh();
    const corrupt = hasRecovery(current);
    const recoveryWithDraft = corrupt && (Boolean(input.value) || current.legacyRecovery !== null);
    const raw = corrupt ? (recoveryWithDraft ? JSON.stringify({format:'woowooish-gratitude-recovery-v1',
      originalStorage:current.recovery, olderTabStorage:current.legacyRecovery, readableNotes:current.items, unsavedDraft:input.value}, null, 2) : current.recovery) : JSON.stringify({format:'woowooish-gratitude-backup-v1',
      notes:current.items,unsavedDraft:input.value,storageUnavailable:current.unavailable || !current.persistent,
      olderTabStorageChecked:current.persistent && !current.unavailable && !current.legacyUnavailable}, null, 2);
    if (typeof raw !== 'string') {status.textContent = 'There is no saved data to export yet.';return;}
    let url;
    try {
      url = URL.createObjectURL(new Blob([raw],{type:'application/json;charset=utf-8'}));
      const link = document.createElement('a');link.href = url;link.download = recoveryWithDraft ? 'woowooish-gratitude-recovery.json' : corrupt ? 'woowooish-gratitude-original.txt' : 'woowooish-gratitude-backup.json';
      document.body.append(link);link.click();link.remove();
      status.textContent = 'Backup prepared. Check your downloads and keep this private file somewhere safe. Nothing was uploaded.';
    } catch (_) {status.textContent = 'A file could not be prepared. Select and copy your notes before leaving.';}
    finally {if (url) setTimeout(() => URL.revokeObjectURL(url), 10000);}
  });
  get('jar-more').addEventListener('click', () => {shown += 30;render();status.textContent = 'Showing up to ' + shown + ' recent notes.';});
  input.addEventListener('input', () => {
    get('jar-export').disabled = !input.value.trim() && !snapshot.items.length && !hasRecovery(snapshot);
    get('jar-export').textContent = hasRecovery(snapshot) ? recoveryLabel(snapshot) : 'Download a backup';
  });
  window.addEventListener('storage', event => {
    if (event.key === WooGratitude.key || event.key === null) {cancelRemoval(false);refreshView();status.textContent = 'The jar was refreshed after another tab changed browser storage. Your draft is unchanged.';}
  });
  async function refreshView() {
    if (busy) return;
    await store.refresh(); render();
    get('jar-tools').hidden = false;
    get('jar-loading').hidden = true;
  }
  if (window.WooAtomic && WooAtomic.supported) WooAtomic.subscribe(WooGratitude.key, refreshView);
  window.addEventListener('pageshow', event => {if (event.persisted) refreshView();});
  document.addEventListener('visibilitychange', () => {if (!document.hidden) refreshView();});
  refreshView();
})();
