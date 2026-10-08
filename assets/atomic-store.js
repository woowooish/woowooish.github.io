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
  function create(key) {
    if (!keys.has(key)) throw failure('invalid-key');
    async function run(operation) {
      const db = await open();
      return new Promise((resolve, reject) => {
        let tx, raw, original, value, changed = false, imported = false, error;
        let settled = false;
        const timer = setTimeout(() => {
          error = failure('storage-unavailable');
          try { tx.abort(); } catch (_) { finish(error); }
        }, 6000);
        function finish(reason) {
          if (settled) return;
          settled = true; clearTimeout(timer);
          if (reason) reject(reason); else resolve({value, raw, persistent: true, coordinated: true});
        }
        try {
          tx = db.transaction(storeName, 'readwrite');
          const objectStore = tx.objectStore(storeName);
          tx.onabort = () => finish(error || failure('write', tx.error));
          tx.onerror = () => { /* Aborting the transaction preserves the old value. */ };
          tx.oncomplete = () => {
            // Remove only the exact old value that was successfully imported. Never
            // erase a later write made by an old open tab during the upgrade.
            if (imported && original !== null) {
              try { if (root.localStorage.getItem(key) === original) root.localStorage.removeItem(key); } catch (_) {}
            }
            if (changed && channel) { try { channel.postMessage(key); } catch (_) {} }
            finish();
          };
          const request = objectStore.get(key);
          request.onsuccess = () => {
            try {
              imported = request.result === undefined;
              // Import the existing exact JSON once, within the exclusive transaction.
              original = imported ? root.localStorage.getItem(key) : request.result;
              if (original !== null && typeof original !== 'string') throw failure('unreadable');
              const result = operation(original);
              if (!result || typeof result.then === 'function' ||
                  (result.raw !== null && (typeof result.raw !== 'string' || (result.raw !== original && result.raw.length > 3 * 1024 * 1024)))) throw failure('invalid');
              raw = result.raw; value = result.value;
              changed = imported || raw !== original;
              if (changed) objectStore.put(raw, key);
            } catch (reason) { error = reason; tx.abort(); }
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
