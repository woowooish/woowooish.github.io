# Pick Your Woo: 412-entry collection and click-time draws

## What changed

The original picker contained 12 messages, selected three with a random sort before a visitor clicked, and did not keep history. The expanded picker preserves those 12 and adds 400 individually written reflections across 20 themes. Every record has a title, a short reflection and a question. These are original brand invitations, not Annie's personal testimony, source quotations, predictions or treatment claims.

The Sunbeam, Moonlight and Wildflower covers, the original cream/sage appearance, and Share/Save/Pick another controls remain. The covers are not topic filters. All three draw from the same collection. A message is not assigned to a cover at page load or reset.

## The actual architecture

This is a static GitHub Pages feature, not a new server-side service. The site sends the page, CSS and three small JavaScript assets. The browser performs selection. No live AI call, account or server database is introduced. The existing Umami page script and website ID are preserved unchanged; the new picker does not send selection history or custom draw events to it.

Files:

- `assets/woo-library.js`: the 412 records. A group prefix plus an explicit row number forms each permanent ID.
- `assets/woo-deck.js`: state validation, random selection, no-repeat exclusion, storage fallback, and same-origin lock coordination.
- `assets/woo-picker.js`: the card/result interface, accessible status messages, sharing and image export.
- `assets/woo-picker.css`: isolated picker styles, keeping the original design and adding responsive/reduced-motion behavior.
- `pick-your-woo.html`: three source-HTML cards, status/result area, fallback reflection, privacy explanation and approved portrait-free sharing metadata.

No homepage, field-guide, daily reminder, domain, font or photograph is modified.

## One draw, in order

1. A visitor clicks an enabled card. The UI immediately guards against double clicks.
2. The engine queues the draw. Where supported, a same-origin Web Lock named `woowooish.pick.draw.v1` serializes draws across tabs.
3. Inside that lock, it rereads the newest saved history. It filters out IDs already drawn in the current round and anything drawn on the visitor's current local calendar day.
4. It picks one remaining entry at click time. Web Crypto `getRandomValues` with rejection sampling supplies an unbiased index when available; `Math.random` is the fallback. Dates and cover positions are not random seeds.
5. It adds only the selected ID to history, saves before revealing, and releases the lock. The other two cards consume no messages.
6. The interface shows the title, reflection and question. Pick another resets the covers, not history, and makes no random selection until the next card click.

## Stored data and boundaries

Storage key: `woowooish.pick.history.v1`.

The JSON contains `schema`, `seen` IDs for the round, `day`, `today` IDs, `last` ID and `cycles`. It contains no name, email, journal answer, account identifier or inference about the reader. State is bounded by library size rather than accumulating a lifetime event log. It is not uploaded by this feature.

With retained storage, all 412 entries are explored before a repeat. One pick per day gives 412 days of distinct entries in that browser. No historical picks from the old 12-message implementation can be reconstructed: the old picker never recorded them.

After a round completes, a new round excludes today's IDs and the preceding pick. If all 412 are used on a single local date, further clicks report exhaustion instead of repeating. A new local day reopens the collection; the date is recomputed on every click, including after midnight in an open tab.

Different devices, browsers, profiles and origins have separate histories. Private sessions ending, cleared/evicted storage, corrupt history or manually altered clocks/data can undermine historical guarantees. Unreadable state starts a disclosed new history. When reading or writing storage fails, the current page keeps a memory-only history and shows a warning. Closing/reloading that page can then allow repeats.

Without Web Locks, ordinary one-tab operation still works and each click rereads persistent storage, but truly simultaneous independent tabs are not guaranteed collision-free. The interface advises one tab in that case. A rejected lock request is not silently bypassed. No universal forever-no-repeat promise is made for a finite collection.

## Editorial maintenance

Keep existing prefix/row-number IDs immutable and unique. The explicit numbers mean rows can be reordered without changing identity. Edit wording in place; give genuinely new entries new, unused IDs. Do not recycle a retired ID. Do not use a pipe, backtick or embedded newline inside a field in the source table. The unit checks reject duplicate IDs, titles, bodies and questions, incomplete records, markup and em dashes.

When changing the collection size, update the visible count/explanation and cache versions in the page. The engine uses the actual loaded array size. Added IDs naturally become available without clearing existing seen IDs; removed IDs are filtered from state. Keep the themes grounded and free of fabricated autobiography or medical promises.

## Verification executed for this release

- `node scripts/check-woo-deck.cjs`: 35 checks passed, including a 3,000-draw simulation across dates, rounds and recreated clients; every first-round pick unique; no same-day or consecutive repeats; blocked/quota storage; malformed state; midnight; library growth; rejection sampling; and 200 coordinated simulated-client draws.
- `python scripts/check-woo-browser.py`: 50 checks passed in local Chromium using the exact inlined production page assets. All 412 messages were selected through the UI without repeats. All 412 export text layouts stayed within the image border. One actual PNG download was validated. Seven initial screen widths and five longest-message widths were checked. Sharing success, denial, cancellation and stale results, rapid clicks, daily exhaustion, no-JavaScript fallback and reduced motion were exercised.
- All four original Node suites passed: `check-site.cjs`, `check-reflections.cjs`, `check-daily.cjs`, `check-photos.cjs`.
- New JavaScript syntax checks passed. Desktop and phone screenshots were visually inspected.

Important test boundary: this container blocks browser navigation, even to localhost. The browser suite therefore renders offline and supplies simulated storage/lock platform boundaries. Its reload checks recreate the page while retaining that simulated storage. Coordination is also independently exercised using two engine clients sharing a simulated lock manager. These are not claims of an every-browser test, a formal accessibility audit or a native multi-tab integration test. The real deployed site needs a separate live-browser smoke check after publication.

Test outputs are written to a temporary directory (or `WOO_TEST_OUTPUT`), not the repository. Existing analytics requests are blocked during local testing. No contact/newsletter form is submitted. Only synthetic history and public library text are used.
