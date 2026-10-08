# WooWooish: whole-site quality and hardening review

Review date: October 7, 2026, America/Los_Angeles.
Baseline commit: `025617ff0417f20ec9cb4212b22bbd1f5cebf2de`.
Baseline tree: `eb4c67f81283223dbdb431fb16e97f3903af0cd8`.

## Scope and verdict

This pass reviews the homepage, What Is Woo, Pick Your Woo, Gratitude Jar, The art of noticing, the device preview, and shared scripts and deployment practices. It improves source-level security, protection against accidental data loss, accessibility, privacy transparency and maintenance. The brand, original photographs, fonts, long-form guide and 412-entry library are preserved.

The baseline is a useful static site with several uneven failure paths, not an account-based application. The most important improvements concern what happens when JavaScript, storage, permissions or links fail. This is a scoped engineering review, not a penetration test, formal accessibility certification, legal compliance opinion, account-security audit or guarantee that no defects remain.

The previously prepared social-sharing upgrade is separate and is not included in this release. This pass does not retry the blocked social-sharing write or change its publication status.

## Findings and implemented remedies

### High priority: form fallback could expose entered details in a URL

The original homepage forms had named inputs but no explicit submission method. Their intended email-draft behavior depended on JavaScript canceling the browser's normal submission. A script failure could leave a GET submission path. That is undesirable for names, email addresses and messages, even on a static site.

Both forms now have explicit POST fallbacks, and submit controls are disabled in source HTML until the event handlers are initialized. A site-wide Content Security Policy also sets `form-action 'none'`. Normal operation still prepares an email draft for review; it does not send email or create a newsletter subscription. Contact email links remain available without JavaScript. Missing form elements no longer prevent unrelated page initialization at the existing handler attachment points.

### High priority: protect the Gratitude Jar from loss and misleading saving claims

The old jar loaded a saved array and rewrote its in-memory copy. Its malformed-data filtering could silently drop entries on a later save. It had no backup download or confirmation before deletion, and a failed save could clear the writing box despite the note not being persisted.

The replacement keeps the existing storage key and array format. It validates IDs, text and dates, detects duplicate IDs, and bounds the collection to 2,000 notes and two million-plus stored characters (2 * 1024 * 1024). Unreadable or partially invalid data is left untouched and becomes read-only. A visitor can download the original saved data rather than have it silently repaired or replaced.

Successful writes are serialized and reread the latest saved state inside a Web Lock when the browser supports it. Lock failures are not bypassed. Without that platform support the interface advises one tab. A storage write failure preserves the original saved notes and the current draft. If storage cannot be read at all, the jar explicitly uses temporary page memory instead of claiming durable saving.

Removing a note requires confirmation, with Keep my note focused first and Escape available to cancel. A storage event cancels stale removal confirmation and refreshes notes without discarding the draft. Notes render as text, not HTML. The list initially renders 30 entries with Show more, while the illustration stays bounded to 22 decorative notes.

The explicit backup download includes readable saved notes and the unsaved draft. It is a private JSON file that the reader must keep safely. There is no automatic upload, cloud sync, encryption or automatic backup import. Restoration from a backup remains a manual support/development operation. No existing visitor data was accessed during this review.

### High priority: make analytics boundaries explicit

Direct Umami script tags are replaced with one first-party loader using the existing website ID. It loads only on the intended production hostnames, not inside preview frames. Do Not Track, Global Privacy Control and a browser-local opt-out can prevent loading.

The before-send hook accepts pageview-shaped events only and rejects named/custom events. It forwards a small allowlist: website, hostname, screen, language, page title, pathname and referring origin. It strips query strings and fragments and does not forward arbitrary payload properties, input values, journal text or Woo history. Opt-out stops later callbacks but is not a deletion request for older reports or hosting logs.

The new Privacy & browser data page explains each feature's storage behavior, email drafts, sharing, hosting, third-party scripts, backups and browser controls. It explicitly warns that browser-local storage is not an encrypted vault and can be accessible to someone sharing the browser profile or to trusted scripts on the origin. Analytics dashboard receipt and provider-side retention were not audited.

### Medium priority: consistent defensive browser policy

All eight HTML pages receive a meta Content Security Policy early in the head. Executable scripts are limited to the same origin and the existing Umami script host. Inline JavaScript and eval are not enabled. Embedded objects, base-URL replacement and direct form submissions are disallowed. Image blobs/data URLs remain allowed for existing image features. Inline styles remain allowed to preserve the site's current design.

Executable code from the two newer inline-script pages is moved into first-party assets. A shared referrer policy reduces cross-origin referring information. This is defense in depth, not complete isolation: trusted first-party scripts and the allowed analytics script still require trust. Header-only protections such as `frame-ancestors` are not claimed to work through a meta tag.

### Medium priority: What Is Woo state and copy behavior

The optional chooser uses native buttons with explicit pressed states and a source-HTML disabled/loading fallback. Editing the custom definition or choosing another idea invalidates the old result and copy preview. Delayed clipboard completion cannot restore a stale result. A denied clipboard request exposes a labeled selectable field instead of silently failing. User wording is inserted as plain text.

Copy now explains that writing is not deliberately saved or sent, but the browser may retain form text. The introductory copy separates personal interpretation from scientific evidence. No new personal testimony, qualifications or health-outcome claims are attributed to Annie.

### Medium priority: navigation, missing pages and accessibility

A source-HTML footer links the public features and privacy information consistently. It remains available without JavaScript. Missing routes receive a branded 404 page with working root-relative recovery links rather than GitHub's generic error screen. The sitemap now includes all six public canonical routes.

Shared styles add clear focus indicators, comfortable targets on the new controls, reliable hidden states, mobile navigation adjustments and reduced-motion behavior. Missing skip links and sharing metadata are supplied. Approved portrait-free sharing artwork is preserved. These improvements are not a claim of full WCAG conformance or exhaustive assistive-technology testing.

### Medium priority: repeatable regression checks

A read-only GitHub Actions workflow runs on pull requests, pushes to main and manual dispatch. It pins checkout to a verified commit, disables credential persistence, uses a timeout and runs script syntax, whole-site structural checks, existing regression suites, jar tests and privacy tests. It requires no production credentials and performs no deployments or external form submissions.

A workflow is not a branch-protection rule. At review, main was unprotected. The repository owner should require the quality check and pull-request review before merging. The ordinary Pages workflow remains separate and is not made dependent on the new checks by this change alone.

## Executed verification

| Check | Result |
| --- | --- |
| Whole-site source, local assets, anchors, metadata, policy and form fallback | 329 checks passed across 8 HTML pages |
| New whole-site Chromium suite | 86 checks passed |
| Existing Pick Your Woo browser suite | 50 checks passed |
| Existing Art of Noticing browser suite | 91 checks passed |
| Gratitude store tests | 23 grouped checks passed, including 100 coordinated simulated-client additions |
| Analytics boundary tests | 14 grouped checks passed |
| Existing Woo deck suite | 35 checks passed |
| Existing check-site, check-reflections, check-daily and check-photos | All four suites passed |
| Browser JavaScript syntax and git diff whitespace | Passed |

The browser work includes source-HTML/no-JavaScript behavior, seven pages at four widths from 320 to 1440 pixels, literal-text handling, denied and successful clipboard paths, old-result invalidation, quota failures, corrupt-data preservation, backups, confirmation/cancel behavior, note pagination and picker history. Existing picker coverage also exercises all 412 entries and image layouts. The original tests are retained; two offline fixtures only remove the new policy while inlining assets so they can execute under the test harness.

Local browser navigation is blocked in this environment, including localhost. The suites therefore inline the exact CSS, JavaScript and local image/font bytes, and simulate storage/lock platform boundaries. A separate isolated Chromium policy probe confirms inline-script blocking. These tests do not prove native multi-tab locking, every mobile browser, authenticated social posting, live-origin header enforcement or analytics receipt.

Desktop/mobile screenshots of the new privacy and jar states were visually reviewed. The baseline live browser review checked the actual public navigation, two different picker draws, and the generic missing-page response. It did not submit contact/newsletter forms or create/delete visitor notes. Post-publication observations belong in the pull request's deployment record and should be distinguished from the local test results above.

## Owner-level follow-through

1. Require reviewed pull requests and the Site quality checks result on main. Disable force pushes and branch deletion for the publishing branch where appropriate. This release does not change repository permissions or rules.
2. Verify GitHub Pages Enforce HTTPS, domain ownership, DNS, account two-factor authentication/passkeys, recovery codes and collaborator access from the owner account. These private/admin settings were not audited or changed.
3. Review response-header controls at the hosting/CDN layer before adding header-only CSP protections, HSTS or Permissions-Policy. Do not place unsupported header-only directives in HTML and assume they are enforced.
4. Verify an allowed pageview inside the private Umami dashboard, then verify opt-out and privacy-signal behavior on real devices. No provider account access or dashboard measurement was used here.
5. Keep a small real-device check for iOS Safari, Android Chrome, keyboard navigation and a screen reader. Native app sharing remains a separate project. Keep downloaded note backups outside the browser before clearing site data.
6. Revisit the small-print contrast, print output and remaining long-page navigation in a dedicated accessibility/design pass. This release improves common paths but does not claim every contrast pair or printed page was audited.

## Maintenance and rollback

Runtime remains static HTML, CSS and JavaScript with no new server or live AI call. Shared source policies, privacy loader and new feature assets should be versioned together. Bump changed asset query versions. Keep the jar key and valid existing note IDs compatible; never recycle Woo IDs.

The main source files are `assets/gratitude-store.js`, `assets/gratitude.js`, `assets/what-is-woo.js`, `assets/site-privacy.js` and `assets/site-support.css`, with the corresponding HTML pages. Run the new source tests and all existing Node suites before merging future edits. Browser suites require Python, BeautifulSoup, Playwright and Chromium; production does not require these packages.

Rollback should revert this release's merge commit rather than reset main over other people's changes. That reverts code, not browser notes, downloads or already-sent emails. Retain this report and the test outputs as the release evidence.

## Technical references consulted

- Umami official tracker configuration and before-send attributes: https://umami.is/docs/tracker-configuration
- GitHub official Pages HTTPS instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- MDN Content-Security-Policy frame-ancestors: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
- Repository brand rules: `docs/BRAND_GUIDE.md`.

The runtime privacy copy describes the implemented behavior rather than making a legal compliance claim. The repository README contains earlier milestone descriptions; this report and the feature-specific docs describe the updated behavior.
