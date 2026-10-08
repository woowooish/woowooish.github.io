/* Read-only permalink reader. Uses frozen public v1 content, never the draw engine. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const status = byId('shared-status'), article = byId('shared-reflection'), retry = byId('shared-retry');
  const host = byId('shared-sharing');
  if (!status || !article || !retry || !host) return;
  let serial = 0, controller = null, dispose = () => {}, reloadNeeded = false;
  function valid(content) {
    return content && ['title', 'reflection', 'question', 'date', 'collection'].every(k => typeof content[k] === 'string' && content[k].trim()) &&
      content.title.length <= 180 && content.reflection.length <= 1600 && content.question.length <= 600 && content.date.length <= 160;
  }
  async function load() {
    const stamp = ++serial;
    if (controller) controller.abort();
    controller = typeof AbortController === 'function' ? new AbortController() : null;
    const ownController = controller;
    dispose(); dispose = () => {}; host.replaceChildren();
    article.hidden = true; retry.hidden = true; reloadNeeded = false;
    status.textContent = 'Opening the Woo you were sent…';
    if (!window.WooLinks) {
      reloadNeeded = true; status.textContent = 'Shared links could not load. Reload the page to try again.';
      retry.textContent = 'Reload page'; retry.hidden = false; return;
    }
    const params = new URLSearchParams(location.search);
    const descriptor = location.search.length <= 600 && params.getAll('woo').length === 1 && window.WooLinks && window.WooLinks.parse(params.get('woo'));
    if (!descriptor) {
      status.textContent = 'This reflection link is incomplete or not recognized. Ask the sender to copy it again, or choose your own Woo below.';
      return;
    }
    let timeout;
    try {
      let content;
      if (descriptor.kind === 'pick') {
        if (!window.WooLibrary || !Array.isArray(window.WooLibrary.entries)) {
          reloadNeeded = true; throw new Error('Snapshot did not load');
        }
        const entry = window.WooLibrary.entries.find(item => item.id === descriptor.id);
        if (!entry) {
          status.textContent = 'This reflection could not be found. Check the link with the sender, or choose your own Woo below.';
          return;
        }
        content = window.WooLinks.fromPick(entry);
      } else {
        // Only a known teacher slug, never an arbitrary URL from the query string.
        const options = {credentials: 'omit'};
        if (ownController) options.signal = ownController.signal;
        const request = async () => {
          const response = await fetch('/assets/shared/v1/' + descriptor.slug + '.json', options);
          if (!response.ok) throw new Error('Snapshot unavailable');
          const data = await response.json();
          if (!data || !Array.isArray(data.doses) || data.doses.length !== 37 || typeof data.teacher !== 'string' || data.teacher.length > 120) throw new Error('Invalid snapshot');
          return window.WooLinks.fromDaily(data, descriptor.index, descriptor.slug);
        };
        const deadline = new Promise((_, reject) => {
          timeout = setTimeout(() => { if (ownController) ownController.abort(); reject(new Error('Snapshot timed out')); }, 12000);
        });
        content = await Promise.race([request(), deadline]);
      }
      if (stamp !== serial) return;
      if (!valid(content) || content.key !== descriptor.key) throw new Error('Incomplete reflection');
      byId('shared-title').textContent = content.title;
      byId('shared-body').textContent = content.reflection;
      byId('shared-question').textContent = content.question;
      byId('shared-credit').textContent = content.teacher
        ? 'Original WooWooish reflection, inspired by ' + content.teacher + '. Not a quotation or endorsement.'
        : 'Original WooWooish reflection · ' + content.date;
      const link = byId('shared-direct-link');
      link.href = window.WooLinks.urlFor(content.key);
      article.setAttribute('data-reflection-key', content.key);
      article.hidden = false; status.textContent = '';
      document.title = content.title + ' | WooWooish';
      try { dispose = window.WooDailySharing.mount(host, content, 'shared'); }
      catch (_) { host.textContent = 'Image sharing could not load. You can still read the reflection and copy its link from your address bar.'; }
    } catch (_) {
      if (stamp !== serial) return;
      status.textContent = 'This Woo could not load. Check your connection and try again. The link still points to the same reflection.';
      retry.textContent = reloadNeeded ? 'Reload page' : 'Try again'; retry.hidden = false;
    } finally {
      clearTimeout(timeout);
      if (stamp === serial) controller = null;
    }
  }
  retry.addEventListener('click', () => { if (reloadNeeded) location.reload(); else load(); });
  window.addEventListener('popstate', load);
  load();
})();
