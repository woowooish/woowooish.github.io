'use strict';

// Original WooWooish writing, inspired by teaching themes, never attributed quotations.
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
  let activeController = null;
  const requestTimeoutMs = 12000;

  function localDayKey(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  async function copyQuestion(question, feedback, manualField, button) {
    if (button.disabled) return;
    const serial = requestSerial;
    const isCurrent = () => serial === requestSerial && manualField.isConnected;
    button.disabled = true;
    feedback.textContent = '';
    manualField.value = question;
    manualField.hidden = true;
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard access unavailable');
      }
      await navigator.clipboard.writeText(question);
      if (isCurrent()) feedback.textContent = 'Your question is copied. Carry it into the day. 🤍';
    } catch (_) {
      if (!isCurrent()) return;
      manualField.hidden = false;
      manualField.focus();
      manualField.select();
      feedback.textContent = 'Select Copy on your device to save the question.';
    } finally {
      if (isCurrent()) button.disabled = false;
    }
  }

  function renderDose(data, dose, selected) {
    const note = makeElement('article', 'dose-note ww-daily-note');
    note.id = 'daily-current-dose';
    note.setAttribute('data-reflection-key', 'd1-' + selected.slug + '-' + String(selected.entryIndex + 1).padStart(2, '0'));

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
    copy.addEventListener('click', () => copyQuestion(dose.question, feedback, manualField, copy));
    practiceSide.append(
      copy, feedback, manualField,
      makeElement('p', 'ww-daily-return', 'A different dose appears tomorrow. Come back for a little more Woo. 🤍')
    );

    note.append(thoughtSide, practiceSide);
    today.replaceChildren(note);
  }

  function validDoseData(data, entryIndex) {
    const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (!data || !text(data.teacher, 120) || !Array.isArray(data.doses) || data.doses.length !== WOO_DOSES_PER_TEACHER) return false;
    const dose = data.doses[entryIndex];
    return dose && text(dose.title, 180) && text(dose.reflection, 1600) && text(dose.question, 600);
  }

  async function showToday() {
    const now = new Date();
    const key = localDayKey(now);
    if (key === renderedDay || key === pendingDay) return;
    pendingDay = key;
    const serial = ++requestSerial;
    if (activeController) activeController.abort();
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    activeController = controller;
    const selected = dailyDoseSelection(now);
    let timeout;
    let timedOut = false;
    // Do not relabel yesterday's article as today's while a new request is pending.
    today.replaceChildren();
    dateLabel.textContent = 'Today · ' + now.toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    feature.hidden = false;
    status.textContent = 'Finding today’s little Woo…';
    if (retry) retry.hidden = true;

    try {
      const deadline = new Promise((_, reject) => {
        timeout = setTimeout(() => {
          timedOut = true;
          if (controller) controller.abort();
          reject(new Error('Daily request timed out'));
        }, requestTimeoutMs);
      });
      const load = async () => {
        // Request only today's teacher, never any visitor-entered information.
        const options = {credentials: 'omit'};
        if (controller) options.signal = controller.signal;
        const response = await fetch('/assets/doses/' + selected.slug + '.json', options);
        if (!response.ok) throw new Error('Daily request failed');
        const data = await response.json();
        if (!validDoseData(data, selected.entryIndex)) throw new Error('Daily dose data is incomplete');
        return data;
      };
      // Also bounds response-body parsing and browsers without AbortController.
      const data = await Promise.race([load(), deadline]);
      if (serial !== requestSerial || key !== localDayKey(new Date())) return;
      renderDose(data, data.doses[selected.entryIndex], selected);
      status.textContent = '';
      renderedDay = key;
    } catch (_) {
      if (serial !== requestSerial) return;
      status.textContent = timedOut
        ? 'Today’s Woo is taking too long to load. Check your connection, then try again.'
        : 'Today’s Woo couldn’t load. Please check your connection and try again.';
      if (retry) retry.hidden = false;
    } finally {
      clearTimeout(timeout);
      if (serial === requestSerial) {
        pendingDay = '';
        activeController = null;
        if (key !== localDayKey(new Date())) showToday();
      }
    }
  }

  if (retry) retry.addEventListener('click', showToday);
  showToday();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) showToday();
  });
  window.addEventListener('pageshow', event => {if (event.persisted) showToday();});
  // A visitor who leaves the page open overnight sees tomorrow's dose after midnight.
  window.setInterval(showToday, 60000);
})();
