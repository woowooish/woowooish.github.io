'use strict';

// Original WooWooish writing, inspired by teaching themes — never attributed quotations.
// The 370 doses form one complete, deterministic cycle: one per local calendar day.
const WOO_DAILY_TEACHERS = Object.freeze([
  'buddha', 'jesus', 'eckhart-tolle', 'rupert-spira', 'joe-dispenza',
  'sadhguru', 'bashar', 'shaman-durek', 'sn-goenka', 'joe-hudson'
]);
const WOO_DOSES_PER_TEACHER = 37;
const WOO_DAILY_COUNT = WOO_DAILY_TEACHERS.length * WOO_DOSES_PER_TEACHER;
const WOO_FIRST_DAY_UTC = Date.UTC(2026, 9, 5) / 86400000;

function dailyDoseIndex(date, count = WOO_DAILY_COUNT) {
  // Convert the visitor's local calendar date to a day number.
  // This avoids 23/25-hour daylight-saving days changing the rotation.
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  return ((day - WOO_FIRST_DAY_UTC) % count + count) % count;
}

function dailyDoseSelection(date) {
  const index = dailyDoseIndex(date);
  return {
    index,
    slug: WOO_DAILY_TEACHERS[index % WOO_DAILY_TEACHERS.length],
    entryIndex: Math.floor(index / WOO_DAILY_TEACHERS.length)
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {dailyDoseIndex, dailyDoseSelection, WOO_DAILY_COUNT, WOO_DAILY_TEACHERS};
}

if (typeof document !== 'undefined') (() => {
  const feature = document.getElementById('daily-feature');
  const today = document.getElementById('daily-today');
  const dateLabel = document.getElementById('daily-date');
  const status = document.getElementById('daily-status');
  const retry = document.getElementById('daily-retry');
  if (!feature || !today || !dateLabel || !status) return;

  let renderedDay = '';
  let pendingDay = '';
  let requestSerial = 0;

  function localDayKey(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  async function copyQuestion(question, feedback, manualField) {
    feedback.textContent = '';
    manualField.value = question;
    manualField.hidden = true;
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard access unavailable');
      }
      await navigator.clipboard.writeText(question);
      feedback.textContent = 'Your question is copied. Carry it into the day. 🤍';
    } catch (_) {
      manualField.hidden = false;
      manualField.focus();
      manualField.select();
      feedback.textContent = 'Select Copy on your device to save the question.';
    }
  }

  function renderDose(data, dose) {
    const note = makeElement('article', 'dose-note ww-daily-note');
    note.id = 'daily-current-dose';

    const thoughtSide = makeElement('div', 'dose-quote-side');
    thoughtSide.append(
      makeElement('span', 'section-label', 'a little thought for today'),
      makeElement('h3', '', dose.title),
      makeElement('p', 'ww-daily-reflection', dose.reflection)
    );
    thoughtSide.append(makeElement('p', 'dose-attribution', 'Inspired by ' + data.teacher));
    if (typeof data.source === 'string' && data.source.startsWith('https://')) {
      const source = makeElement('a', 'small-link dose-source', 'Explore the inspiration ↗');
      source.href = data.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      thoughtSide.append(source);
    }

    const practiceSide = makeElement('div', 'dose-reflection-side');
    practiceSide.append(
      makeElement('span', 'section-label', 'an invitation to reflect'),
      makeElement('h4', 'ww-daily-reflect-heading', 'A question for today'),
      makeElement('p', 'reflection-prompt ww-daily-question', dose.question)
    );
    const copy = makeElement('button', 'ww-daily-copy', 'Copy today’s question ↗');
    copy.type = 'button';
    const feedback = makeElement('p', 'note-status');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    const manualField = makeElement('textarea', 'note-copy');
    manualField.readOnly = true;
    manualField.rows = 3;
    manualField.hidden = true;
    manualField.setAttribute('aria-label', 'Select this question to copy it');
    copy.addEventListener('click', () => copyQuestion(dose.question, feedback, manualField));
    practiceSide.append(
      copy, feedback, manualField,
      makeElement('p', 'ww-daily-return', 'A different dose appears tomorrow. Come back for a little more Woo. 🤍')
    );

    note.append(thoughtSide, practiceSide);
    today.replaceChildren(note);
  }

  async function showToday() {
    const now = new Date();
    const key = localDayKey(now);
    if (key === renderedDay || key === pendingDay) return;
    pendingDay = key;
    const serial = ++requestSerial;
    const selected = dailyDoseSelection(now);
    dateLabel.textContent = 'Today · ' + now.toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    feature.hidden = false;
    status.textContent = 'Finding today’s little Woo…';
    if (retry) retry.hidden = true;

    try {
      // Load only today's teacher's file, not an on-page collection of all doses.
      const response = await fetch('/assets/doses/' + selected.slug + '.json');
      if (!response.ok) throw new Error('The daily dose could not be loaded');
      const data = await response.json();
      const dose = Array.isArray(data.doses) ? data.doses[selected.entryIndex] : undefined;
      if (!data.teacher || !dose ||
          typeof dose.title !== 'string' ||
          typeof dose.reflection !== 'string' ||
          typeof dose.question !== 'string') {
        throw new Error('Daily dose data is incomplete');
      }
      if (serial !== requestSerial || key !== localDayKey(new Date())) return;
      renderDose(data, dose);
      status.textContent = '';
      pendingDay = '';
      renderedDay = key;
    } catch (_) {
      if (serial !== requestSerial) return;
      pendingDay = '';
      status.textContent = 'Today’s Woo couldn’t load. Please check your connection and try again.';
      if (retry) retry.hidden = false;
    }
  }

  if (retry) retry.addEventListener('click', showToday);
  showToday();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) showToday();
  });
  // A visitor who leaves the page open overnight sees tomorrow's dose after midnight.
  window.setInterval(showToday, 60000);
})();
