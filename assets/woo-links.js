/* Versioned public reflection links. Never include draws, notes or visitor identifiers. */
(function (root) {
  'use strict';
  const ORIGIN = 'https://woowooish.com';
  const teachers = Object.freeze(['buddha', 'jesus', 'eckhart-tolle', 'rupert-spira', 'joe-dispenza',
    'sadhguru', 'bashar', 'shaman-durek', 'sn-goenka', 'joe-hudson']);
  function parse(key) {
    if (typeof key !== 'string' || key.length > 90) return null;
    if (/^p1-[a-z]+(?:-[a-z]+)*-\d{2}$/.test(key)) return {kind: 'pick', id: key.slice(3), key};
    const match = /^d1-([a-z]+(?:-[a-z]+)*)-(\d{2})$/.exec(key);
    if (!match || !teachers.includes(match[1])) return null;
    const index = Number(match[2]) - 1;
    return index >= 0 && index < 37 ? {kind: 'daily', slug: match[1], index, key} : null;
  }
  function urlFor(key) { return parse(key) ? ORIGIN + '/reflection.html?woo=' + key : ''; }
  function pickKey(entry) { return entry && parse('p1-' + entry.id) ? 'p1-' + entry.id : ''; }
  function dailyKey(slug, index) {
    const key = 'd1-' + slug + '-' + String(index + 1).padStart(2, '0');
    return Number.isInteger(index) && parse(key) ? key : '';
  }
  function fromPick(entry) {
    if (!entry || !['title', 'body', 'question', 'theme'].every(k => typeof entry[k] === 'string')) return null;
    return {key: pickKey(entry), title: entry.title, reflection: entry.body, question: entry.question,
      teacher: '', date: entry.theme, collection: 'PICK YOUR WOO'};
  }
  function fromDaily(data, index, slug) {
    const dose = data && Array.isArray(data.doses) && data.doses[index];
    if (!dose || typeof data.teacher !== 'string' || !['title', 'reflection', 'question'].every(k => typeof dose[k] === 'string')) return null;
    return {key: dailyKey(slug, index), title: dose.title, reflection: dose.reflection, question: dose.question,
      teacher: data.teacher, date: 'A reflection to return to', collection: 'DAILY DOSE OF WOO'};
  }
  const api = Object.freeze({ORIGIN, teachers, parse, urlFor, pickKey, dailyKey, fromPick, fromDaily});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WooLinks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
