/* Browser-local notes with bounded validation and serialized, read-before-write changes. */
(function (root) {
  'use strict';
  const key = 'woowooish-gratitude-v1';
  const lockName = 'woowooish.gratitude.write.v1';
  const maxNotes = 2000;
  const maxChars = 2 * 1024 * 1024;
  function error(code) { const value = new Error(code); value.code = code; return value; }
  function validate(raw) {
    if (raw === null) return {items: [], blocked: false};
    if (typeof raw !== 'string' || raw.length > maxChars) return {items: [], blocked: true};
    let list;
    try { list = JSON.parse(raw); } catch (_) { return {items: [], blocked: true}; }
    if (!Array.isArray(list) || list.length > maxNotes) return {items: [], blocked: true};
    const ids = new Set();
    const items = [];
    let blocked = false;
    for (const n of list) {
      if (!n || typeof n !== 'object' || typeof n.id !== 'string' || !n.id || n.id.length > 120 || ids.has(n.id) ||
          typeof n.text !== 'string' || !n.text.trim() || n.text.length > 500 || typeof n.date !== 'string' ||
          n.date.length > 40 || !Number.isFinite(Date.parse(n.date))) { blocked = true; continue; }
      ids.add(n.id);
      items.push({id: n.id, text: n.text, date: n.date});
    }
    return {items, blocked};
  }
  function create(options = {}) {
    const storage = options.storage || (() => root.localStorage);
    const atomic = !Object.prototype.hasOwnProperty.call(options, 'storage') && root.WooAtomic && root.WooAtomic.supported
      ? root.WooAtomic.create(key) : null;
    let transactionStorage = null;
    let unavailable = Boolean(atomic);
    const locks = Object.prototype.hasOwnProperty.call(options, 'locks') ? options.locks : (root.navigator && root.navigator.locks);
    const now = options.now || (() => new Date());
    const makeId = options.makeId || (() => root.crypto && typeof root.crypto.randomUUID === 'function'
      ? root.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
    let memory = [];
    let persistent = true;
    let queue = Promise.resolve();
    let recovery = null;
    let legacyRecovery = null;
    let legacyUnavailable = false;
    let blocked = false;
    function load() {
      if (persistent && (!atomic || transactionStorage)) {
        let raw;
        try { raw = (transactionStorage || storage()).getItem(key); }
        catch (_) { persistent = false; }
        if (persistent) {
          const checked = validate(raw);
          memory = checked.items;
          blocked = checked.blocked;
          recovery = blocked ? raw : null;
        }
      }
      return {items: memory.map(n => ({...n})), persistent: persistent && !unavailable, blocked: blocked || unavailable, recovery, legacyRecovery, legacyUnavailable, unavailable,
        coordinated: Boolean(atomic), maxNotes};
    }
    function change(kind, value) {
      const task = queue.then(() => {
        const perform = () => {
          const current = load();
          if (current.blocked) throw error('unreadable');
          let next = current.items;
          if (kind === 'add') {
            if (typeof value !== 'string' || !value.trim() || value.length > 500) throw error('invalid');
            if (next.length >= maxNotes) throw error('full');
            const id = makeId();
            if (typeof id !== 'string' || !id || id.length > 120 || next.some(n => n.id === id)) throw error('id');
            next = [...next, {id, text: value.trim(), date: now().toISOString()}];
          } else if (kind === 'remove') {
            if (!next.some(n => n.id === value)) throw error('changed');
            next = next.filter(n => n.id !== value);
          } else throw error('invalid');
          const encoded = JSON.stringify(next);
          if (encoded.length > maxChars) throw error('full');
          if (persistent) {
            try { (transactionStorage || storage()).setItem(key, encoded); }
            catch (_) { throw error('write'); }
          }
          memory = next;
          return load();
        };
        if (atomic) {
          const previous = {memory, persistent, blocked, recovery, legacyRecovery, legacyUnavailable, unavailable};
          return atomic.run((raw, status) => {
            if (status.legacyRecovery !== null) throw error('unreadable');
            legacyRecovery = null; legacyUnavailable = status.legacyUnavailable;
            let nextRaw = raw;
            transactionStorage = {getItem: () => nextRaw, setItem: (_, encoded) => {nextRaw = encoded;}};
            unavailable = false; persistent = true;
            try { const value = perform(); return {raw: nextRaw, value}; }
            finally { transactionStorage = null; }
          }).then(result => result.value).catch(reason => {
            ({memory, persistent, blocked, recovery, legacyRecovery, legacyUnavailable, unavailable} = previous);
            throw reason;
          });
        }
        // Failed lock requests are not silently bypassed.
        return locks && typeof locks.request === 'function' ? locks.request(lockName, perform) : perform();
      });
      queue = task.catch(() => {});
      return task;
    }
    async function refresh() {
      if (!atomic) return load();
      try {
        const result = await atomic.run(raw => ({raw, value: validate(raw)}));
        memory = result.value.items; legacyRecovery = result.legacyRecovery; legacyUnavailable = result.legacyUnavailable;
        blocked = result.value.blocked || legacyRecovery !== null;
        recovery = blocked ? result.raw : null; unavailable = false; persistent = true;
      } catch (_) { unavailable = true; }
      return load();
    }
    return Object.freeze({load, refresh, add: text => change('add', text), remove: id => change('remove', id)});
  }
  const api = Object.freeze({create, validate, key, lockName, maxNotes, maxChars});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WooGratitude = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
