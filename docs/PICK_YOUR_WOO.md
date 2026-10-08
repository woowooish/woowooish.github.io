# Pick Your Woo: library and repeat protection

## Published feature

The three existing card covers, The Sunbeam, The Moonlight and The Wildflower, all draw from one shared collection. The collection contains **412 distinct Woos**: the original 12 plus 400 new, individually written reflections. Each has a stable ID, a theme, a title, a short message and a reflection question. The new writing is original WooWooish editorial, not a prediction, a quotation from a teacher or a personal account attributed to Annie.

The 400 new entries span 20 themes, with 20 entries in each: presence, rest, boundaries, feelings, self-kindness, connection, nature, curiosity, transitions, creativity, courage, simplicity, appreciation, loosening control, everyday rituals, patience, repair, belonging, delight and perspective. The original 12 remain in a Foundations group. Content is authored in full, not assembled from interchangeable sentence fragments during a visit.

## What happens when a visitor chooses

1. GitHub Pages serves the static HTML, CSS and JavaScript. The page downloads `assets/woo-library.json` once per visit. The three covers stay disabled until the library is available and validated. No Woo is chosen or recorded merely by loading the page.
2. Clicking any cover calls the picker. It reads the latest valid saved history, removes already seen IDs from the available collection and chooses randomly from the remaining eligible entries. The position of the cover does not create a separate category or a smaller pool.
3. Only the revealed Woo is added to history. The two unchosen covers do not consume messages. Choosing again resets the covers, not the history. Every subsequent reveal performs a fresh draw, including on the same calendar day. Dates, midnight and day-based seeds play no part.
4. The browser stores the seen IDs, a round counter and the 32 most recent IDs. No name, email, location, journal writing or account identifier is stored by this feature. The history is not sent to Annie or an application server.

Random selection uses the browser's `crypto.getRandomValues` with rejection sampling to avoid modulo bias. A `Math.random` compatibility fallback exists where that API is unavailable. The old random-sort shuffle is removed. Within the eligible set, the result is randomized at the time of the click, not preassigned behind the covers.

## Repeat guarantees and their limits

With intact saved history, a visitor will see all 412 distinct messages before starting a second round. At one pick per day, the first round contains 412 different daily picks. More frequent use consumes the same round more quickly; there is no daily quota or forced wait.

After the collection is exhausted, a new round begins. The engine excludes the 32 most recent IDs where possible, including at the round boundary. This prevents an immediate repeat and avoids the most recently seen messages at the start of the next round. It is not a promise that a finite collection can remain new forever.

History belongs to this browser profile and site origin, not to an identified person. Another device, browser, profile or origin has separate history. Clearing site data or deliberately resetting Woo history removes repeat protection for earlier picks. Private browsing may discard history when the private session ends. Picks from before this upgrade were not recorded and cannot be excluded retroactively.

When browser storage is blocked or becomes unwritable, the picker continues with memory in the current page and clearly explains the limitation. A reload can then repeat a previous Woo. It does not repeatedly reread stale saved history after a write failure. Corrupt history is repaired defensively, with a visible notice that older picks may repeat.

Each page serializes its own draws. When available, the Web Locks API serializes the read/draw/write operation across cooperating tabs in the same origin and browser, preventing simultaneous tabs from selecting from the same stale history. Browsers without usable Web Locks still work; the status advises picking in one tab at a time. Simultaneous tabs without that coordination cannot receive the same guarantee. Older tabs running the previous picker also cannot participate in the new history protocol.

## Storage and controls

The only persistent storage key introduced is:

`woowooish.pick-your-woo.history.v1`

Its shape is `{schema: 1, cycle: 1, seen: ["stable-id"], recent: ["stable-id"]}`. The key contains identifiers and a round counter only. This feature adds no API key, application database, paid service, account system, custom analytics event or visitor-history upload. The owner added a separate Umami page-analytics script during this work; that existing script is preserved, not removed or extended with Woo-selection tracking. Hosting infrastructure can still maintain its ordinary access/security logs; this is not a claim that the host logs no requests.

The explanatory disclosure on the page describes the behavior and limitations. Resetting history requires confirmation, initially focuses the non-destructive choice and supports Escape to cancel. Reset removes only this feature's key, not other site data. A failure to remove browser storage is reported rather than silently claiming success. The Art of Noticing notebook remains unchanged and is not connected to Woo history.

Share uses native browser sharing where available, then clipboard copying, then a labelled selectable text field. It shares the selected Woo and the canonical page URL, not private history or arbitrary URL query parameters. An obsolete asynchronous copy result cannot restore stale feedback after another selection. Save prepares a 1080 by 1350 PNG, fitting complete title, message and question, with an accessible text fallback when canvas is unavailable.

## Files

- `pick-your-woo.html`: existing three-card presentation, source fallback, result and privacy/repeat explanation.
- `assets/pick-woo.css`: supplemental styles preserving the existing sage/cream and arched-card design.
- `assets/woo-library.json`: editable, versioned source collection.
- `assets/woo-deck.js`: independently testable selection, history, recovery and coordination logic.
- `assets/pick-woo.js`: library loading, accessible reveal, sharing, saving and reset controls.
- `scripts/check-woo.cjs`: Node content and selection-engine regression checks.
- `scripts/check-woo-browser.py`: focused offline Chromium UI and layout checks.

The homepage, Daily Woo archive, forms, existing photo/font assets, Art of Noticing and unrelated scripts are not changed. Approved portrait-free sharing metadata is preserved for the new page metadata.

## Editing the collection

Add fully authored entries to the JSON file and use a new stable ID for each genuinely new Woo. Keep an existing ID when making a minor correction to the same entry. Never recycle a retired ID for different content. The selection engine preserves recognized seen IDs when the library grows or changes order and ignores removed IDs. New IDs become eligible without clearing a reader's existing history.

Run the content checks before publishing. The checked-in tests currently assert 412 entries and 21 themes to catch accidental truncation; update those intended counts deliberately when expanding the library. Titles, messages and questions have uniqueness and length checks. Keep questions useful and specific. Do not inflate the library through trivial rewrites or claims of guaranteed spiritual, medical or personal outcomes.

Bump the library version and the corresponding asset query strings in the page and loader after edits. Deploy the JSON and its caller together in one tested commit, through a pull request. A cached page already open in a visitor's tab continues using the version it loaded until refreshed; it does not silently replace its content mid-visit.

## Executed verification for this release

The Node suite passed **60 checks**, including at least **8,028 simulated draws**, complete-library rounds, round boundaries, extreme deterministic random inputs, history reload, quota failures, invalid history, resets, reordered/expanded/retired IDs, random-number rejection sampling and serialized concurrent draws. Concurrent-tab scenarios use an explicit shared-storage/mutex test adapter; they are not a native multi-browser integration audit.

The focused Chromium suite passed **71 checks**. It exercises actual production HTML/CSS/JavaScript with explicit offline adapters for fetching the library, local storage and Web Locks. It checks repeated same-day selections, one consumed message per reveal, rapid-click handling, recovery, sharing/copy fallbacks, resets, keyboard focus, missing-library/no-JavaScript fallbacks and reduced motion. All 412 card titles fit the tested widths of 320, 360, 390, 560, 768, 1024 and 1440 pixels. Twelve of the longest entries were saved to PNG and checked for complete text and dimensions. Desktop, phone and saved-image screenshots were visually reviewed.

The browser environment used for these checks cannot navigate normally, so these results must not be represented as tests of native localStorage durability, native browser-tab coordination, every browser or the live website. The owner-added page-analytics script is checked for preservation but not executed in the offline suite. A separate live visitor check is performed after deployment and recorded in the pull request with its own observed results and limitations.

All four existing Node suites also passed: `check-site.cjs`, `check-reflections.cjs`, `check-daily.cjs` and `check-photos.cjs`. Both new JavaScript files pass `node --check`; the diff passes `git diff --check`. The unrelated Python Art of Noticing suite is not part of this release's executed checks.

Run from the repository root:

```
node scripts/check-woo.cjs
python scripts/check-woo-browser.py
node scripts/check-site.cjs
node scripts/check-reflections.cjs
node scripts/check-daily.cjs
node scripts/check-photos.cjs
```

The Python suite requires Beautiful Soup, Playwright, Pillow and a Chromium installation. `CHROMIUM_EXECUTABLE` selects an alternate browser path; `WOO_TEST_OUTPUT` selects an output directory. Test output is not visitor data. The website itself has no install or build dependency.
