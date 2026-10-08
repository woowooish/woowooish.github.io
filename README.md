# WooWooish

A static website for small pauses, ordinary wonder and reflection. GitHub Pages publishes `main` from the repository root at `https://woowooish.com`. Keep `CNAME` and `.nojekyll` intact. The visitor-facing site has no package-install or build requirement, user account, live AI call or server-side application database.

## Current experiences

- `index.html`: the centered Find Your Woo homepage, four experience choices, written and timed pauses, reflections, Our Story and email-draft forms.
- `explore.html`: a directory of the experiences.
- `pick-your-woo.html`: 412 original reflections, drawn at click time. `assets/woo-library.js` holds permanent IDs; `assets/woo-deck.js` handles browser-local history and atomic browser transactions where available. All three covers use the same unseen pool. Preserve IDs and storage keys when editing.
- `daily-woo.html`: the same daily reflection shown on the homepage. `assets/daily.js` selects one of 370 original entries in `assets/doses/*.json` according to the local calendar date. Ten collections contain 37 entries each. There is no public archive picker. A failed or stalled request gives a retry; the selected content is not an attributed quotation or endorsement.
- `gratitude-jar.html`: browser-local notes, explicit removal confirmation, backup downloads, and read-only recovery when saved data is malformed. The JSON format remains compatible; `assets/atomic-store.js` imports old localStorage records into the browser-only IndexedDB database once. No server database is added.
- `the-art-of-noticing/`: a long-form field guide with nine invitations and a page-only notebook. Its copy/download tools do not automatically save writing between visits.
- `what-is-woo.html`: introductory writing and a page-only reflection chooser.
- `privacy.html`, `404.html`, `preview.html`: data controls, branded recovery and a noindex layout preview.

## Privacy and safe behavior

Contact and Tide forms prepare an email draft. Nothing is sent or subscribed automatically. Source submit buttons stay disabled until the draft handlers attach. The HTML policy blocks native form submission.

`assets/site-privacy.js` controls the existing Umami integration. It restricts reporting to known production pages, respects DNT/GPC and the saved opt-out, excludes queries/fragments and visitor writing, and keeps analytics off when a preference is unreadable. Only the current `https://gateway.umami.is` collection origin is permitted by `connect-src`; the tracker script comes from `https://cloud.umami.is`. There is no ad-blocker bypass. This is not a claim that third-party scripts are incapable of reading page data; the public privacy notice states the limits.

Browser storage is not encrypted or synced by this site. A backup is a private local file. Test with synthetic notes in a fresh browser profile, never a visitor's existing records. Unknown or malformed saved data must not be silently overwritten.

The early meta Content Security Policy is duplicated across HTML entry points and checked automatically. It disallows inline JavaScript and eval while retaining existing inline design styles. Meta policy cannot substitute for response-header controls such as `frame-ancestors` or account security. Do not add ineffective meta tags claiming those controls exist.

## Editing and checking

Preserve the current layout, approved portraits, fonts and portrait-free sharing card. Follow `docs/BRAND_GUIDE.md`; do not invent Annie's history, qualifications, testimonials or first-person experiences. Earlier review documents are historical snapshots, not a specification to restore the old homepage or 14-entry archive.

For local viewing, run `python3 -m http.server 8000` from the repository and open the loopback address. Update asset query versions on every referencing page when changing a browser script or stylesheet.

Run the dependency-free source and state checks:

```sh
python3 scripts/check-quality.py
for file in assets/*.js; do node --check "$file"; done
for test in scripts/check-site.cjs scripts/check-reflections.cjs scripts/check-photos.cjs scripts/check-woo-deck.cjs scripts/check-gratitude.cjs scripts/check-privacy.cjs scripts/check-daily.cjs scripts/check-daily-loading.cjs; do node "$test"; done
```

Run `node scripts/check-browser-runtime.cjs` with Node 22+ and Chrome/Chromium. It serves exact repository files on loopback, retains production CSP, uses native browser storage/locks, and intercepts all external requests. It uses no npm dependencies. An unavailable browser or navigation restriction fails the test rather than claiming success.

The optional Python browser suites require Playwright, BeautifulSoup and Chromium. They inline local assets and simulate platform boundaries for sandbox compatibility. They complement, not replace, the native browser job.

## Publishing

The read-only Site quality checks workflow runs source/state and native-browser jobs. Confirm both pass before merging. Then verify the Pages deployment for the exact merge commit and smoke-test the public site. This workflow does not automatically protect `main` or make Pages wait for checks. Required reviews/status checks and hosting response headers are separate owner-level controls. Roll back with a reviewed revert, not a reset over another contributor's work.

The separately prepared social-sharing upgrade is not part of the hardening releases unless an explicitly reviewed later change introduces it.
