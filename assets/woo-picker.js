/* The three covers stay empty until a click reserves a Woo from the no-repeat deck. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const status = byId('picker-status');
  if (!status) return;
  if (!window.WooLibrary || !window.WooDeck || !window.WooAtomic) {
    status.textContent = 'The card library could not load. Reload to try again, or enjoy the reflection below.';
    return;
  }
  const entries = window.WooLibrary.entries;
  const deck = window.WooDeck.create(entries);
  const cards = [...document.querySelectorAll('#cards .card')];
  const result = byId('result');
  const sharingHost = byId('pick-sharing');
  let disposeShare = () => {};
  let selected = null;
  let busy = false;
  let historyNote = 'Choose any card. Your Woo is drawn at the moment you pick.';
  function showReady(focus) {
    selected = null;
    busy = false;
    result.hidden = true;
    result.removeAttribute('data-woo-id');
    disposeShare(); disposeShare = () => {};
    sharingHost.replaceChildren();
    byId('pick-permalink').hidden = true;
    cards.forEach(card => {
      card.disabled = false;
      card.classList.remove('revealed');
      card.querySelector('.back strong').textContent = 'A little reminder';
    });
    status.textContent = historyNote;
    if (focus) cards[0].focus();
  }
  function describeHistory(outcome) {
    let text = outcome.persistent
      ? 'This browser remembers your picks. No repeats until the collection has been explored.'
      : 'Storage is unavailable. No repeats in this open page; reloading may bring earlier Woos back.';
    if (!outcome.coordinated) text += ' Use one tab for reliable repeat protection.';
    if (outcome.legacyUnavailable) text += ' Older-tab history could not be checked. Refresh older tabs before picking there.';
    if (outcome.legacyUnreadable) text += ' Older-tab history was unreadable and could not be combined. This pick uses the current browser history. Refresh older tabs before picking there.';
    if (outcome.recovered) text = 'Your saved history was unreadable, so this pick starts a fresh history. ' + text;
    if (outcome.restarted) text = 'You explored the collection. A new round has begun, without repeating today’s picks. ' + text;
    return text;
  }
  async function reveal(index) {
    if (busy || selected) return;
    busy = true;
    cards.forEach(card => { card.disabled = true; });
    status.textContent = 'Choosing a fresh Woo…';
    try {
      const outcome = await deck.next();
      historyNote = describeHistory(outcome);
      if (outcome.exhausted) {
        busy = false;
        cards.forEach(card => { card.disabled = false; });
        status.textContent = 'You have explored all ' + deck.total + ' Woos today. Return on the next local day for a new round, without a same-day repeat.';
        return;
      }
      selected = outcome.entry;
      cards[index].querySelector('.back strong').textContent = selected.title;
      cards[index].classList.add('revealed');
      byId('woo-title').textContent = selected.title;
      byId('woo-message').textContent = selected.body;
      byId('woo-question').textContent = 'A moment to reflect: ' + selected.question;
      byId('woo-theme').textContent = selected.theme;

      result.dataset.wooId = selected.id;
      result.hidden = false;
      showSharing();
      status.textContent = historyNote;
      busy = false;
      byId('woo-title').focus({preventScroll: true});
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      result.scrollIntoView({block: 'nearest', behavior: reduce ? 'instant' : 'smooth'});
    } catch (error) {
      busy = false;
      cards.forEach(card => { card.disabled = false; });
      status.textContent = error && error.code === 'storage-unavailable'
        ? 'Saved pick history could not be opened. Your earlier history is unchanged. Reload the page to retry, or enjoy the reflection below.'
        : 'This pick could not be reserved. Please choose a card again.';
      byId('fallback-woo').hidden = false;
    }
  }
  function showSharing() {
    disposeShare(); sharingHost.replaceChildren();
    const link = byId('pick-permalink');
    link.href = 'https://woowooish.com/reflection.html?woo=p1-' + selected.id;
    link.hidden = false;
    try {
      const content = window.WooLinks.fromPick(selected);
      disposeShare = window.WooDailySharing.mount(sharingHost, content, 'pick');
      // The common panel provides Copy link and the same direct link beside the QR.
      link.hidden = true;
    } catch (_) {
      sharingHost.textContent = 'Image sharing could not load. You can copy the reflection above or open its permanent link below.';
      // Never turn a successfully reserved pick into a failed draw just because sharing failed.
    }
  }
  cards.forEach((card, index) => card.addEventListener('click', () => reveal(index)));
  byId('again').addEventListener('click', () => showReady(true));
  byId('fallback-woo').hidden = true;
  showReady(false);
})();
