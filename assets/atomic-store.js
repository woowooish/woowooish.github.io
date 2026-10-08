/* Atomic browser-local read/modify/write. No requests, accounts or server database. */
(function (root) {
  'use strict';
  const databaseName = 'woowooish.browser-data.v1';
  const storeName = 'values';
  const keys = new Set(['woowooish.pick.history.v1', 'woowooish-gratitude-v1']);
  const listeners = new Map();
  let opening = null;
  let channel = null;
  let supported = false;
  try { supported = Boolean(root.isSecureContext && root.indexedDB && root.indexedDB.open); } catch (_) {}
  function failure(code, cause) { const e = new Error(code); e.code = code; if (cause) e.cause = cause; return e; }
  try {
    if (supported && typeof root.BroadcastChannel === 'function') {
      channel = new root.BroadcastChannel('woowooish.browser-data.changed.v1');
      channel.onmessage = event => {
        if (typeof event.data !== 'string' || !keys.has(event.data)) return;
        for (const fn of listeners.get(event.data) || []) fn();
      };
    }
  } catch (_) { /* Focus refresh still works without cross-tab notifications. */ }
  function open() {
    if (opening) return opening;
    const attempt = new Promise((resolve, reject) => {
      let settled = false;
      let request;
      const timer = setTimeout(() => finish(failure('storage-unavailable')), 6000);
      function finish(error, db) {
        if (settled) { if (db) db.close(); return; }
        settled = true; clearTimeout(timer);
        if (error) reject(error); else resolve(db);
      }
      try {
        if (!supported) throw failure('storage-unavailable');
        request = root.indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () => {
          if (settled) { request.transaction.abort(); return; }
          request.result.createObjectStore(storeName);
        };
        request.onerror = () => finish(failure('storage-unavailable', request.error));
        request.onblocked = () => finish(failure('storage-unavailable'));
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); opening = null; };
          db.onclose = () => { opening = null; };
          finish(null, db);
        };
      } catch (error) { finish(failure('storage-unavailable', error)); }
    });
    opening = attempt;
    attempt.catch(() => { if (opening === attempt) opening = null; });
    return attempt;
  }
  function reconcile(key, current, legacy, knownIds, hasProvenance) {
    if (legacy === null || legacy === current) return {raw: current, recovery: null};
    if (key === 'woowooish-gratitude-v1') {
      const validate = root.WooGratitude && root.WooGratitude.validate;
      if (!validate) return {raw: current, recovery: legacy};
      const saved = validate(current), older = validate(legacy);
      if (saved.blocked || older.blocked) return {raw: current, recovery: legacy};
      const notes = saved.items.slice();
      const present = new Map(notes.map(note => [note.id, note]));
      for (const note of older.items) {
        const existing = present.get(note.id);
        // Same ID with different writing requires recovery, never a silent overwrite.
        if (existing && (existing.text !== note.text || existing.date !== note.date)) return {raw: current, recovery: legacy};
        if (!existing && !knownIds.has(note.id)) {
          // Before deletion bookkeeping existed, an absent ID might mean a
          // deliberate removal, not a new note. Preserve both copies for recovery.
          if (!hasProvenance) return {raw: current, recovery: legacy};
          notes.push(note); present.set(note.id, note);
        }
      }
      const raw = JSON.stringify(notes);
      if (validate(raw).blocked) return {raw: current, recovery: legacy};
      older.items.forEach(note => knownIds.add(note.id));
      return {raw, recovery: null};
    }
    try {
      const parse = raw => {
        if (raw === null) return {schema:1, seen:[], today:[], day:'', last:null, cycles:0};
        if (typeof raw !== 'string' || raw.length > 3 * 1024 * 1024) throw failure('unreadable');
        const value = JSON.parse(raw);
        if (!value || value.schema !== 1 || !Array.isArray(value.seen) || !Array.isArray(value.today) || typeof value.day !== 'string' ||
            value.day.length > 32 || value.seen.length > 100000 || value.today.length > 100000) throw failure('unreadable');
        const cycles = value.cycles === undefined ? 0 : value.cycles;
        if (!Number.isSafeInteger(cycles) || cycles < 0) throw failure('unreadable');
        return {...value, cycles};
      };
      const saved = parse(current), older = parse(legacy);
      const day = new Date();
      const today = day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');
      const ids = new Set((root.WooLibrary && root.WooLibrary.entries || []).map(entry => entry.id));
      const clean = values => [...new Set(values.filter(id => ids.has(id)))];
      // Completed older rounds must not fill a newer round's unseen pool.
      // Same-day exclusions are independent of rounds and are always combined.
      const active = older.cycles > saved.cycles ? older : saved;
      const seen = older.cycles === saved.cycles ? [...saved.seen,...older.seen] : active.seen;
      return {raw: JSON.stringify({schema:1, seen:clean(seen),
        today:clean([...(saved.day === today ? saved.today : []),...(older.day === today ? older.today : [])]),
        day:today, last:ids.has(active.last) ? active.last : null, cycles:active.cycles}), recovery:null};
    } catch (_) { return {raw:current,recovery:legacy}; }
  }
  function create(key) {
    if (!keys.has(key)) throw failure('invalid-key');
    async function run(operation) {
      const db = await open();
      return new Promise((resolve, reject) => {
        let tx, raw, original, value, legacyRecovery = null, legacyUnavailable = false, changed = false, error;
        let settled = false;
        const timer = setTimeout(() => {
          error = failure('storage-unavailable');
          try { tx.abort(); } catch (_) { finish(error); }
        }, 6000);
        function finish(reason) {
          if (settled) return;
          settled = true; clearTimeout(timer);
          if (reason) reject(reason); else resolve({value, raw, legacyRecovery, legacyUnavailable, persistent: true, coordinated: true});
        }
        try {
          tx = db.transaction(storeName, 'readwrite');
          const objectStore = tx.objectStore(storeName);
          tx.onabort = () => finish(error || failure('write', tx.error));
          tx.onerror = () => { /* Aborting the transaction preserves the old value. */ };
          tx.oncomplete = () => {
            // Do not compare then delete localStorage: another tab can write
            // between those calls. Retain compatibility snapshots; reconciliation
            // and ID tombstones keep them from overwriting or resurrecting notes.
            if (changed && channel) { try { channel.postMessage(key); } catch (_) {} }
            finish();
          };
          const request = objectStore.get(key);
          request.onsuccess = () => {
            const stored = request.result;
            const history = objectStore.get(key + ':legacy-ids.v1');
            history.onsuccess = () => {
              try {
                const imported = stored === undefined;
                try { original = root.localStorage.getItem(key); }
                catch (reason) {
                  // Never invent an empty first import, but keep an already
                  // authoritative IndexedDB record usable if only legacy access fails.
                  if (imported) throw failure('storage-unavailable', reason);
                  original = null; legacyUnavailable = true;
                }
                let current = imported ? original : stored;
                if (current !== null && typeof current !== 'string') throw failure('unreadable');
                const metadata = history.result;
                if (metadata !== undefined && (!Array.isArray(metadata) || metadata.length > 100000 || metadata.some(id => typeof id !== 'string'))) throw failure('unreadable');
                const knownIds = new Set(metadata || []);
                const observe = raw => {
                  if (key !== 'woowooish-gratitude-v1' || !root.WooGratitude) return;
                  const checked = root.WooGratitude.validate(raw);
                  checked.items.forEach(note => knownIds.add(note.id));
                };
                observe(current);
                if (!imported) {
                  const merged = reconcile(key, current, original, knownIds, metadata !== undefined);
                  current = merged.raw; legacyRecovery = merged.recovery;
                }
                const result = operation(current, {legacyRecovery, legacyUnavailable});
                if (!result || typeof result.then === 'function' ||
                    (result.raw !== null && (typeof result.raw !== 'string' || (result.raw !== current && result.raw.length > 3 * 1024 * 1024)))) throw failure('invalid');
                raw = result.raw; value = result.value;
                // Remember IDs before and after changes so a stale older tab cannot
                // resurrect a note deliberately removed by this version.
                observe(raw);
                if (knownIds.size > 100000) throw failure('full');
                if (key === 'woowooish-gratitude-v1' && legacyRecovery === null && (metadata === undefined || knownIds.size !== metadata.length)) objectStore.put([...knownIds], key + ':legacy-ids.v1');
                changed = imported || raw !== stored;
                if (changed) objectStore.put(raw, key);
              } catch (reason) { error = reason; tx.abort(); }
            };
          };
        } catch (reason) { finish(failure('storage-unavailable', reason)); }
      });
    }
    return Object.freeze({run});
  }
  function subscribe(key, fn) {
    if (!keys.has(key) || typeof fn !== 'function') return () => {};
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key).delete(fn);
  }
  root.WooAtomic = Object.freeze({create, subscribe, supported, databaseName, storeName});
})(typeof globalThis !== 'undefined' ? globalThis : this);
