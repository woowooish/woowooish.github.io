'use strict';

// Use calendar days in the visitor's timezone, including across daylight saving changes.
function dailyDoseIndex(date, count) {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  const firstDay = Date.UTC(2026, 9, 5) / 86400000;
  return ((day - firstDay) % count + count) % count;
}

if (typeof module !== 'undefined' && module.exports) module.exports = {dailyDoseIndex};

if (typeof document !== 'undefined') (() => {
  const archive = document.getElementById('daily-archive');
  const feature = document.getElementById('daily-feature');
  const today = document.getElementById('daily-today');
  const dateLabel = document.getElementById('daily-date');
  const notes = [...document.querySelectorAll('.dose-note')];
  if (!archive || !feature || !today || !dateLabel || !notes.length) return;
  const entries = notes.map(note => note.closest('details'));
  let active = -1;
  let dayKey = '';

  function showToday() {
    const now = new Date();
    const key = [now.getFullYear(), now.getMonth(), now.getDate()].join('-');
    if (key === dayKey) return;
    dayKey = key;
    const index = dailyDoseIndex(now, notes.length);
    if (active !== index) {
      if (active !== -1) {
        entries[active].querySelector('.dose-today-link').remove();
        entries[active].appendChild(notes[active]);
      }
      today.appendChild(notes[index]);
      const link = document.createElement('a');
      link.className = 'small-link dose-today-link';
      link.href = '#' + notes[index].id;
      link.textContent = 'Read today’s featured reminder ↑';
      entries[index].appendChild(link);
      active = index;
    }
    dateLabel.textContent = 'Today · ' + now.toLocaleDateString(undefined, {month:'long', day:'numeric', year:'numeric'});
    feature.hidden = false;
  }

  function openLinkedDose() {
    const note = notes.find(item => '#' + item.id === window.location.hash);
    if (!note) return;
    const entry = note.closest('details');
    if (entry) {
      archive.open = true;
      entry.open = true;
    }
    note.scrollIntoView({block:'start'});
  }

  showToday();
  openLinkedDose();
  window.addEventListener('hashchange', openLinkedDose);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { showToday(); openLinkedDose(); }
  });
  // Updates a page left open overnight; no network request or visitor storage is needed.
  window.setInterval(showToday, 60000);
})();
