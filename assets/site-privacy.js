/* Minimal pageview analytics with explicit browser preference and payload filtering. */
(() => {
  'use strict';
  const key = 'woowooish.analytics.optout.v1';
  const allowedHosts = new Set(['woowooish.com','www.woowooish.com']);
  let optedOut = false;
  let loaded = false;
  let saving = true;
  try {optedOut = localStorage.getItem(key) === '1';} catch (_) {saving = false;}
  const browserSaysNo = () => navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const canTrack = () => allowedHosts.has(location.hostname) && window.self === window.top && !browserSaysNo() && !optedOut;
  window.wooBeforeAnalytics = (type, payload) => {
    if (!canTrack() || type !== 'event' || !payload || payload.name) return false;
    // Never forward arbitrary properties or visitor-entered text. Referrer keeps only its origin.
    let referrer = '';
    try {if (document.referrer) referrer = new URL(document.referrer).origin;} catch (_) {}
    return {website:'77cbb298-6ccc-4ae1-b912-6e398efc6956',hostname:location.hostname,
      screen:payload.screen,language:payload.language,title:document.title,url:location.pathname,referrer};
  };
  function loadTracker() {
    if (loaded || !canTrack()) return;
    loaded = true;
    const script = document.createElement('script');
    script.src = 'https://cloud.umami.is/script.js';
    script.defer = true;
    script.setAttribute('data-website-id','77cbb298-6ccc-4ae1-b912-6e398efc6956');
    script.setAttribute('data-domains','woowooish.com,www.woowooish.com');
    script.setAttribute('data-exclude-search','true');script.setAttribute('data-exclude-hash','true');
    script.setAttribute('data-do-not-track','true');script.setAttribute('data-before-send','wooBeforeAnalytics');
    script.referrerPolicy = 'no-referrer';
    document.head.append(script);
  }
  function renderPreference() {
    const status = document.getElementById('analytics-preference');
    if (!status) return;
    status.textContent = browserSaysNo() ? 'Pageview analytics is off because your browser requests it.' : optedOut
      ? 'Pageview analytics is off in this browser.' : 'Pageview analytics is allowed on the live site in this browser.';
    if (!saving) status.textContent += ' This browser cannot save the preference across visits.';
    document.getElementById('analytics-off').disabled = optedOut || browserSaysNo();
    document.getElementById('analytics-on').disabled = !optedOut || browserSaysNo();
    document.getElementById('analytics-controls').hidden = false;
  }
  function setPreference(value) {
    optedOut = value;
    try {if (value) localStorage.setItem(key,'1');else localStorage.removeItem(key);saving = true;}
    catch (_) {saving = false;}
    renderPreference();
    loadTracker();
  }
  const off = document.getElementById('analytics-off'), on = document.getElementById('analytics-on');
  if (off && on) {off.addEventListener('click', () => setPreference(true));on.addEventListener('click', () => setPreference(false));}
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      try {optedOut = localStorage.getItem(key) === '1';} catch (_) {saving = false;}
      renderPreference();
    }
  });
  renderPreference();loadTracker();
})();
