/* Pageview-only analytics. Unreadable privacy preferences always fail closed. */
(() => {
  'use strict';
  const key = 'woowooish.analytics.optout.v1';
  const allowedHosts = new Set(['woowooish.com', 'www.woowooish.com']);
  const routes = new Set(['/', '/explore.html', '/daily-woo.html', '/what-is-woo.html',
    '/pick-your-woo.html', '/gratitude-jar.html', '/the-art-of-noticing/', '/privacy.html']);
  const pagePath = () => ({'/index.html':'/', '/the-art-of-noticing/index.html':'/the-art-of-noticing/'})[location.pathname] || location.pathname;
  const pageTitle = document.title;
  let optedOut = true;
  let preferenceKnown = false;
  let loaded = false;
  let saving = true;
  let trackerFailed = false;
  function readPreference() {
    try {
      const raw = localStorage.getItem(key);
      saving = true;
      preferenceKnown = raw === null || raw === '1';
      optedOut = raw !== null;
    } catch (_) {
      saving = false;
      preferenceKnown = false;
      optedOut = true;
    }
  }
  readPreference();
  const browserSaysNo = () => navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const canTrack = () => allowedHosts.has(location.hostname) && routes.has(pagePath()) &&
    window.self === window.top && !browserSaysNo() && preferenceKnown && !optedOut;
  window.wooBeforeAnalytics = (type, payload) => {
    if (!canTrack() || type !== 'event' || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.name) return false;
    let referrer = '';
    try {
      const url = new URL(document.referrer);
      if (url.protocol === 'https:' || url.protocol === 'http:') referrer = url.origin;
    } catch (_) { /* Empty or opaque referrers remain empty. */ }
    const filtered = {website:'77cbb298-6ccc-4ae1-b912-6e398efc6956', hostname:location.hostname,
      title:pageTitle, url:pagePath(), referrer};
    // Copy only bounded scalars, never objects or arbitrary payload fields.
    if (typeof payload.screen === 'string' && /^\d{1,5}x\d{1,5}$/.test(payload.screen)) filtered.screen = payload.screen;
    if (typeof payload.language === 'string' && payload.language.length <= 35 && /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/i.test(payload.language)) filtered.language = payload.language;
    return filtered;
  };
  function loadTracker() {
    if (loaded || !canTrack()) return;
    loaded = true;
    const script = document.createElement('script');
    script.src = 'https://cloud.umami.is/script.js';
    script.defer = true;
    script.setAttribute('data-website-id','77cbb298-6ccc-4ae1-b912-6e398efc6956');
    // Pin the collection origin, not a moving implicit vendor default.
    script.setAttribute('data-host-url','https://gateway.umami.is');
    script.setAttribute('data-domains','woowooish.com,www.woowooish.com');
    script.setAttribute('data-exclude-search','true');
    script.setAttribute('data-exclude-hash','true');
    script.setAttribute('data-do-not-track','true');
    script.setAttribute('data-before-send','wooBeforeAnalytics');
    script.referrerPolicy = 'no-referrer';
    script.onerror = () => {trackerFailed = true; renderPreference();};
    document.head.append(script);
  }
  function renderPreference() {
    const status = document.getElementById('analytics-preference');
    const off = document.getElementById('analytics-off');
    const on = document.getElementById('analytics-on');
    const controls = document.getElementById('analytics-controls');
    if (!status || !off || !on || !controls) return;
    status.textContent = browserSaysNo() ? 'Pageview analytics is off because your browser requests it.' : !preferenceKnown
      ? 'Your saved privacy choice could not be read. Pageview analytics stays off unless you explicitly allow it.' : optedOut
        ? 'Pageview analytics is off in this browser.' : 'Pageview analytics is allowed on the live site in this browser.';
    if (!saving) status.textContent += ' This browser cannot save the preference across visits.';
    if (trackerFailed && !optedOut && preferenceKnown) status.textContent += ' The tracker could not load. A network error or content blocker may be preventing it.';
    off.disabled = (preferenceKnown && optedOut) || browserSaysNo();
    on.disabled = (preferenceKnown && !optedOut) || browserSaysNo();
    controls.hidden = false;
  }
  function setPreference(value) {
    optedOut = value;
    preferenceKnown = true;
    try {if (value) localStorage.setItem(key,'1'); else localStorage.removeItem(key); saving = true;}
    catch (_) {saving = false;}
    renderPreference();
    loadTracker();
  }
  const off = document.getElementById('analytics-off'), on = document.getElementById('analytics-on');
  if (off && on) {
    off.addEventListener('click', () => setPreference(true));
    on.addEventListener('click', () => setPreference(false));
  }
  function refreshPreference() {readPreference(); renderPreference(); loadTracker();}
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) refreshPreference();
  });
  // A restored tab must not reuse an opt-in from before another tab opted out.
  window.addEventListener('pageshow', event => {if (event.persisted) refreshPreference();});
  renderPreference();
  loadTracker();
})();
