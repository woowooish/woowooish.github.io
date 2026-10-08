/* No-repeat draws. Only message IDs and a local date are stored, never journal text. */
(function (root) {
  'use strict';
  const KEY = 'woowooish.pick.history.v1';
  const LOCK = 'woowooish.pick.draw.v1';
  function localDay(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function randomIndex(size, cryptoSource, fallback) {
    if (!Number.isSafeInteger(size) || size < 1 || size > 0x100000000) throw new RangeError('Invalid draw size');
    if (size === 1) return 0;
    if (cryptoSource && typeof cryptoSource.getRandomValues === 'function') {
      const limit = Math.floor(0x100000000 / size) * size;
      const word = new Uint32Array(1);
      for (let attempt = 0; attempt < 128; attempt += 1) {
        try { cryptoSource.getRandomValues(word); } catch (_) { break; }
        if (word[0] < limit) return word[0] % size;
      }
    }
    const value = fallback();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random source unavailable');
    return Math.floor(value * size);
  }
  function create(entries, options = {}) {
    if (!Array.isArray(entries) || entries.length < 2) throw new Error('A library with at least two Woos is required');
    const ids = new Set(entries.map(entry => entry.id));
    if (ids.size !== entries.length || entries.some(entry => typeof entry.id !== 'string')) throw new Error('Woo IDs must be unique strings');
    const now = options.now || (() => new Date());
    const cryptoSource = Object.prototype.hasOwnProperty.call(options, 'crypto') ? options.crypto : root.crypto;
    const fallback = options.random || Math.random;
    const locks = Object.prototype.hasOwnProperty.call(options, 'locks') ? options.locks : (root.navigator && root.navigator.locks);
    const storage = options.storage || (() => root.localStorage);
    const atomic = !Object.prototype.hasOwnProperty.call(options, 'storage') && root.WooAtomic && root.WooAtomic.supported
      ? root.WooAtomic.create(KEY) : null;
    let memory = null;
    let persistent = true;
    let queue = Promise.resolve();
    let recovered = false;
    const cleanIds = list => [...new Set(list.filter(id => ids.has(id)))];
    function blank(day) { return {schema: 1, seen: [], day, today: [], last: null, cycles: 0}; }
    function normalize(raw, day) {
      if (raw === null) return blank(day);
      let saved;
      try { saved = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { recovered = true; return blank(day); }
      if (!saved || saved.schema !== 1 || !Array.isArray(saved.seen) || !Array.isArray(saved.today) ||
          saved.seen.length > 100000 || saved.today.length > 100000 || typeof saved.day !== 'string') {
        recovered = true;
        return blank(day);
      }
      return {schema: 1, seen: cleanIds(saved.seen), day, today: saved.day === day ? cleanIds(saved.today) : [],
        last: ids.has(saved.last) ? saved.last : null,
        cycles: Number.isSafeInteger(saved.cycles) && saved.cycles >= 0 ? saved.cycles : 0};
    }
    function drawNow(transactionStorage) {
      recovered = false;
      const day = localDay(now());
      let state;
      if (persistent) {
        try { state = normalize((transactionStorage || storage()).getItem(KEY), day); }
        catch (_) { persistent = false; state = normalize(memory, day); }
      } else state = normalize(memory, day);
      const today = new Set(state.today);
      const seen = new Set(state.seen);
      // A finite collection cannot offer more than its size in one local day.
      if (today.size === entries.length) {
        memory = state;
        return {entry: null, exhausted: true, persistent, coordinated: Boolean(atomic && transactionStorage), recovered, total: entries.length};
      }
      let candidates = entries.filter(entry => !seen.has(entry.id) && !today.has(entry.id));
      let restarted = false;
      if (!candidates.length) {
        state.seen = [];
        state.cycles += 1;
        restarted = true;
        candidates = entries.filter(entry => !today.has(entry.id) && entry.id !== state.last);
      }
      // A two-item library can reach this state only under unusual externally edited history.
      if (!candidates.length) candidates = entries.filter(entry => !today.has(entry.id));
      const entry = candidates[randomIndex(candidates.length, cryptoSource, fallback)];
      state.seen.push(entry.id);
      state.today.push(entry.id);
      state.last = entry.id;
      memory = state;
      // Reserve before showing the Woo, so another tab reads the updated history.
      if (persistent) {
        try { (transactionStorage || storage()).setItem(KEY, JSON.stringify(state)); }
        catch (_) { persistent = false; }
      }
      return {entry, exhausted: false, persistent, coordinated: Boolean(atomic && transactionStorage), recovered, restarted,
        total: entries.length, seen: state.seen.length, today: state.today.length};
    }
    function next() {
      const task = queue.then(() => {
        if (atomic) return atomic.run(raw => {
          let nextRaw = raw;
          const value = drawNow({getItem: () => raw, setItem: (_, encoded) => {nextRaw = encoded;}});
          value.persistent = true; value.coordinated = true;
          return {raw: nextRaw, value};
        }).then(result => result.value);
        if (locks && typeof locks.request === 'function') return locks.request(LOCK, () => drawNow());
        return drawNow();
      });
      queue = task.catch(() => {});
      return task;
    }
    return Object.freeze({next, total: entries.length});
  }
  const api = Object.freeze({create, localDay, randomIndex, storageKey: KEY, lockName: LOCK});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WooDeck = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
