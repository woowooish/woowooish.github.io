/* Random draws without replacement. No dates, tracking or network requests. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WooDeck = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const KEY = 'woowooish.pick-your-woo.history.v1';
  const LOCK = 'woowooish.pick-your-woo.draw.v1';
  const fresh = () => ({schema: 1, cycle: 1, seen: [], recent: []});

  function validateLibrary(data) {
    if (!data || data.schema !== 1 || !Array.isArray(data.entries) || data.entries.length < 2 || data.entries.length > 20000) {
      throw new Error('The Woo library has an unsupported format.');
    }
    const ids = new Set();
    const entries = data.entries.map(entry => {
      if (!entry || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || entry.id.length > 80 || ids.has(entry.id)) {
        throw new Error('Every Woo needs a unique, stable ID.');
      }
      ids.add(entry.id);
      for (const field of ['title', 'message', 'question', 'theme']) {
        if (typeof entry[field] !== 'string' || !entry[field].trim() || entry[field].length > 1000) {
          throw new Error('A Woo is missing valid content.');
        }
      }
      return Object.freeze({id: entry.id, theme: entry.theme, title: entry.title, message: entry.message, question: entry.question});
    });
    return Object.freeze(entries);
  }

  function randomBelow(n) {
    if (!Number.isInteger(n) || n < 1 || n > 0x100000000) throw new RangeError('Invalid draw size.');
    if (root.crypto && typeof root.crypto.getRandomValues === 'function') {
      const value = new Uint32Array(1);
      const limit = 0x100000000 - (0x100000000 % n);
      // Rejection, rather than biased modulo or random-sort shuffling.
      do { root.crypto.getRandomValues(value); } while (value[0] >= limit);
      return value[0] % n;
    }
    // Non-security-sensitive compatibility fallback, still selected on each click.
    return Math.floor(Math.random() * n);
  }

  function createPicker(entries, options = {}) {
    if (!Array.isArray(entries) || entries.length < 2) throw new Error('At least two Woos are required.');
    const ids = new Set(entries.map(item => item.id));
    if (ids.size !== entries.length) throw new Error('Duplicate Woo IDs.');
    const recentLimit = Math.min(32, entries.length - 1);
    const rng = options.randomBelow || randomBelow;
    let memory = fresh();
    let storage = null;
    let storageUsable = false;
    let coordinated = false;
    let queue = Promise.resolve();
    let historyRecovered = false;
    try {
      storage = Object.prototype.hasOwnProperty.call(options, 'storage') ? options.storage : root.localStorage;
      storageUsable = Boolean(storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function');
    } catch (_) { /* Keep drawing with tab-local memory. */ }

    function clean(state) {
      if (!state || state.schema !== 1 || !Number.isSafeInteger(state.cycle) || state.cycle < 1 ||
          !Array.isArray(state.seen) || !Array.isArray(state.recent) || state.seen.length > 50000 || state.recent.length > 50000) {
        throw new Error('Unreadable history.');
      }
      const unique = values => [...new Set(values.filter(value => typeof value === 'string' && ids.has(value)))];
      return {schema: 1, cycle: state.cycle, seen: unique(state.seen), recent: unique(state.recent).slice(-recentLimit)};
    }
    function read() {
      if (!storageUsable) return memory;
      try {
        const raw = storage.getItem(KEY);
        if (raw === null) return fresh();
        if (raw.length > 1000000) throw new Error('History is too large.');
        try { return clean(JSON.parse(raw)); }
        catch (_) { historyRecovered = true; return memory; }
      } catch (_) {
        storageUsable = false;
        return memory;
      }
    }
    function write(state) {
      memory = state;
      if (storageUsable) {
        try { storage.setItem(KEY, JSON.stringify(state)); }
        catch (_) { storageUsable = false; }
      }
    }
    async function exclusive(action) {
      const locks = Object.prototype.hasOwnProperty.call(options, 'locks') ? options.locks : root.navigator && root.navigator.locks;
      if (storageUsable && locks && typeof locks.request === 'function') {
        let entered = false;
        try {
          return await locks.request(LOCK, () => { entered = true; coordinated = true; return action(); });
        } catch (error) {
          // Never draw twice if a callback already ran before a lock error.
          if (entered) throw error;
        }
      }
      coordinated = false;
      return action();
    }
    function serialize(action) {
      const job = queue.then(() => exclusive(action));
      queue = job.catch(() => {});
      return job;
    }
    function snapshot() {
      return {persisted: storageUsable, coordinated, cycle: memory.cycle, remaining: entries.length - memory.seen.length,
        total: entries.length, historyRecovered};
    }
    function pick() {
      return serialize(() => {
        let state = read();
        let seen = new Set(state.seen);
        let remaining = entries.filter(entry => !seen.has(entry.id));
        if (!remaining.length) {
          state = {...state, cycle: state.cycle < Number.MAX_SAFE_INTEGER ? state.cycle + 1 : 1, seen: []};
          seen = new Set();
          remaining = entries;
        }
        // Avoid the previous round's last 32 items at the boundary where possible.
        const recent = new Set(state.recent);
        const lessRecent = remaining.filter(entry => !recent.has(entry.id));
        const candidates = lessRecent.length ? lessRecent : remaining;
        const index = rng(candidates.length);
        if (!Number.isInteger(index) || index < 0 || index >= candidates.length) throw new Error('Invalid random result.');
        const entry = candidates[index];
        // Only the revealed item is consumed. The two unchosen covers consume nothing.
        write({schema: 1, cycle: state.cycle, seen: [...seen, entry.id],
          recent: [...state.recent.filter(id => id !== entry.id), entry.id].slice(-recentLimit)});
        return {...snapshot(), entry};
      });
    }
    function reset() {
      return serialize(() => {
        memory = fresh();
        historyRecovered = false;
        let removed = !storage;
        if (storage) {
          try { storage.removeItem(KEY); removed = true; }
          catch (_) { storageUsable = false; removed = false; }
        }
        return {...snapshot(), removed};
      });
    }
    return Object.freeze({pick, reset});
  }
  return Object.freeze({KEY, LOCK, randomBelow, validateLibrary, createPicker});
});
