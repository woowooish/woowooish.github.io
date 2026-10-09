# WooWooish security and functional review

Baseline: `549588295d20afd02e568b09c573c37b77986e75`. Review performed after the addition of the 24-path What's Your Woo chooser, not merely against the earlier sharing release.

## Assessment

The inspected application is a static site. Its principal risks are unsafe browser rendering, loss or disclosure of browser-local writing, misleading sharing or saving states, third-party JavaScript, and changes reaching production without passing checks. It has no application login, server-side database, payment handler or secret-bearing backend in the reviewed source.

A confirmed privacy regression and several functional/accessibility defects were found in the newly added chooser and repaired. No credential-format match or executable DOM interpolation was found in the reviewed current browser code after repair. That is a scoped source-review result, not proof that every possible vulnerability, historical secret or third-party problem is absent.

The account/deployment controls below remain separate owner actions. Do not describe the whole service as guaranteed secure, or treat a successful test run as a penetration-test certification.

## Confirmed defects and repairs

### 1. Direct analytics bypass in the new chooser

The baseline `whats-your-woo.html` inserted the external Umami script directly. It therefore bypassed the site's established opt-out, DNT/GPC, domain/route, query and fragment filtering gate. The same release failed the existing whole-site quality job while the independent Pages deployment succeeded.

Repair: remove direct tracker injection and include the existing fail-closed privacy gate. The gate's allowlist is deliberately unchanged, so this chooser does not load the tracker. No selection-event reporting is added. A source contract rejects direct external scripts, and a native browser assertion checks the actual chooser document.

### 2. Copying produced literal backslash characters

The baseline joined reflection sections with escaped backslash-n sequences, rather than actual paragraph breaks. Its failure message offered no way to recover when clipboard permission was denied.

Repair: copy real paragraphs; on denied or unavailable clipboard access, reveal a labelled, selectable field containing the complete reflection and practice. Repeated clicks are guarded. A revision counter prevents late clipboard completion or failure from restoring an older result after navigation.

### 3. Keyboard, reduced-motion and initialization gaps

The baseline hid focused controls without moving focus to the next step and always requested smooth scrolling. Category buttons appeared usable even without the script. The page had no skip link or useful no-JavaScript explanation.

Repair: move focus to the follow-up heading or result title; restore the actual previous choice on Back; respect reduced-motion preference; disable source buttons until handlers are ready; provide a loading/recovery message, static no-JavaScript reflection, skip link and accessible manual-copy field. The result's text is assigned with textContent, not HTML interpolation. All six categories and all 24 published paths are retained unchanged.

### 4. Page and test coverage gaps

The chooser lacked canonical/share metadata and a sitemap entry. The native smoke suite's fixed page list could omit later additions, even though the structural checker found them.

Repair: restore the approved portrait-free social metadata, canonical URL and sitemap entry. The new standalone `scripts/check-review-runtime.cjs` discovers all root HTML entry points and retains the field guide route. The original native suites are unchanged. Add explicit tests for every chooser path, navigation focus, actual copied paragraphs, denied clipboard recovery, double taps, stale completion and reduced motion. Existing tests are retained.

### 5. Deployment verification did not cover binary assets

The earlier exact-byte verifier covered HTML, scripts, stylesheets, public JSON and snapshots, but not the actual image/font bytes.

Repair: include all site PNG, WebP, SVG and WOFF2 assets in the same bounded, exact-byte public comparison. Add a separate read-only transport observation script for canonical HTTPS, HTTP redirection, the www entry and hosting response headers. Missing owner-managed headers are reported as unresolved observations, not silently counted as repairs.

## Functional scope

- All 12 HTML entry points, local links, anchors, duplicate IDs, required metadata, local assets, CSP placement and script loading.
- Homepage contact and newsletter controls: prepare drafts only, safe encoding, input edits invalidate old drafts, clipboard/manual fallback, no actual email or subscription submission.
- Three-minute pause and motion controls, including elapsed-time and UI-state regression tests.
- What Is Woo and the Art of Noticing: page-only writing, text rendering, prompt controls, copy/download, confirmation before clearing, and no inclusion of private writing in guide sharing.
- What's Your Woo: six categories and all 24 results, copy/recovery, keyboard focus, reduced motion, narrow-screen layout and initialization failure messaging.
- Pick Your Woo: 412 entries, no-repeat state, repeated card choice, deterministic and native random-source concurrent draws, storage denial and reload history.
- Gratitude Jar: adding, reloading, cancelling removal, committed removal, native two-tab updates, old-tab reconciliation, corrupt/empty records, exact recovery export, quota/denied storage and preservation of unsaved drafts.
- Daily Dose: 370 entries, date rotation across eight time zones, DST/midnight cases, stalled and invalid responses, retries and stale-result rejection.
- Sharing: both image dimensions, 1,564 public-reflection layouts, actual PNG downloads, files-only and text-only payloads, cancellation, denied capability, caption/link fallback, stale-image disposal, read-only recipient behavior and QR controls.
- Permanent links: 782 mappings, archived catalog hashes, rejection of unknown/duplicate/malformed keys, and no extra draw or note mutation from a reader visit.

All private-data tests use synthetic notes in isolated browser profiles. No visitor's existing notes are read, changed or deleted. No real email, Instagram post or paid service purchase is made.

## Security verification

The current-source guardrails check executable URL schemes, opener isolation, local/deferred HTML scripts, dangerous browser rendering sinks and known credential formats. The scan covers current HTML, browser scripts and public JSON, not complete Git history or private account stores. The public analytics website identifier is not an API secret.

Production CSP blocks unapproved inline JavaScript, eval, network destinations and native form submission. The native suite also tests synthetic HTML-like input in personal reflections and saved notes, plus malformed permalink inputs. Frozen shared content and the random-selection/storage engines are not edited by this repair.

Workflow review retains immutable Action commit pins, a read-only contents token and non-persisted checkout credentials. It does not introduce pull_request_target or credentials into tests. New source checks and the six existing release-verifier regressions run in CI. Native browser tests must pass before this review branch is merged.

## Evidence and limits

Local results before publication: 499 structural checks across 12 pages; all existing Node source/state suites; all 782 permalink contracts; 24 chooser content contracts; six release-verifier regressions; 92 whole-site offline Chromium checks; the existing full 412-pick offline browser suite; and a separate 68-check chooser fixture. A new standalone native browser suite covers the new entry point and security probes without changing the existing suites.

The local sandbox blocks browser navigation with ERR_BLOCKED_BY_ADMINISTRATOR. Offline fixtures inline local assets and simulate platform boundaries; they are not represented as native cross-tab or production-CSP evidence. GitHub's existing native Chromium job runs exact repository pages with CSP intact. Its actual results, along with the exact release SHA and public-file verification, must be read from the associated run, not inferred from this document's existence.

The final public transport and deployment observations are retained in `transport-verification.json` and `live-verification.json` for the release. A successful HTTPS fetch verifies a trusted certificate chain and matching hostname at that time; it is not an exhaustive TLS cipher audit.

## Remaining owner actions

### Protect production changes

At the inspected baseline, main reported protected=false and the ruleset collection was empty. The newly added chooser had already deployed despite a failed structural job. This is a confirmed release-control gap, not just a hypothetical recommendation.

Require pull requests, appropriate review and passing Static and state-machine checks plus Browser policy and native cross-tab checks. Block force pushes and deletion. Do not make the post-deployment Public release byte verification a pre-merge requirement, because it runs only on main. Consider making deployment depend on successful tests instead of independent branch-based Pages publication. Repository administration and Pages configuration are not changed in this code repair.

### Configure hosting response headers

The live transport artifact records which headers are actually observed. HTML meta CSP cannot enforce frame-ancestors. Framing protection must be configured at the hosting/edge layer and must preserve the site's intentional same-origin preview iframe. Also review nosniff, HSTS, referrer and browser-permission policies. Adding ineffective meta tags would not repair these controls. Domain and hosting changes are not made here.

### Review account and third-party trust

Privately confirm MFA, recovery methods and least-privilege collaborator access for GitHub, domain/DNS and any hosting or analytics accounts. These private settings were not inspected; their absence is not alleged.

The allowed analytics script remains third-party code on the origin. The pageview filter limits ordinary reporting but cannot guarantee what a compromised vendor script would do. Browser-local notes are not encrypted by this site, and same-origin scripts can technically access them. Keep appropriate private backups; do not treat this site as a secure vault. An explicit change to analytics architecture would be a separate decision.

### Complete physical-device acceptance

Physical iPhone/Android QR scanning and native Instagram composer behavior were not tested. Verify both image formats, the target app offered by the share menu, cancellation, iPhone Files/Photos fallback and links opened inside social apps. No script can certify a post was published from the browser share promise alone.

## Primary references

- OWASP HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- MDN frame-ancestors and meta-policy limitations: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
- GitHub Pages HTTPS controls: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
