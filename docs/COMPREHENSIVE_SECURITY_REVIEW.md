# WooWooish security and functional review

Baseline: `549588295d20afd02e568b09c573c37b77986e75`. This review includes the newer 24-path What's Your Woo chooser, not just the earlier sharing release. Code repairs and scoped tests are described below. Final release and hosting evidence belongs to the associated main-branch workflow, not a blanket security guarantee.

## Assessment

The inspected application is a static site without an application login, payment handler, server-side database or secret-bearing backend. Its principal risks are unsafe browser rendering, disclosure or loss of browser-local writing, third-party JavaScript, misleading sharing states and unchecked production changes.

A confirmed analytics privacy regression and functional/accessibility defects in the new chooser were repaired. The current-source scan found no recognized credential formats or executable DOM interpolation in the inspected HTML, browser code and public JSON after repair. That does not establish that all possible vulnerabilities, historical secrets or compromised third-party services are absent. This is not a penetration-test certification.

## Confirmed defects and repairs

### Direct analytics bypass

The new chooser directly inserted the external Umami script instead of using the established privacy gate. That bypassed opt-out, Do Not Track, Global Privacy Control, domain/route and query/fragment filtering. The baseline quality job failed while the independent Pages deployment succeeded.

The direct tracker is removed. The chooser now loads the existing fail-closed privacy gate, whose allowlist remains unchanged and does not include this page. No selection tracking is added. New source and browser assertions reject this bypass.

### Broken clipboard formatting and recovery

The chooser copied literal backslash-n sequences rather than actual paragraph breaks. A denied clipboard operation gave no usable recovery.

Copying now uses real paragraphs. A denied or unavailable clipboard reveals a labelled selectable field containing all of the reflection and practice. Repeated clicks are guarded. A revision counter prevents a late result from changing feedback or exposing the previous reflection after another path has been selected.

### Keyboard, reduced-motion and initialization gaps

The chooser hid focused controls without moving focus, always requested smooth scrolling and showed usable-looking controls before JavaScript initialized. It lacked a skip link and useful no-JavaScript recovery.

Focus now moves to the next heading and returns to the actual previous choice on Back. Reduced-motion preference is respected. Source buttons remain disabled until all handlers are attached. Loading/reload help, a static no-JavaScript reflection and manual copying remain available. All six categories and 24 original paths are unchanged. Rendering uses textContent, not executable HTML interpolation.

### Metadata and page coverage

The chooser lacked canonical/share metadata and a sitemap entry. The original fixed-route browser suite could omit subsequently added pages.

The approved portrait-free preview, canonical URL, favicon and sitemap entry are restored. A new standalone native suite discovers all root HTML entry points plus the field guide, exercising all 12 pages at 320, 390, 768 and 1440 pixels. Explicit chooser tests cover every path, focus, copying, failure recovery and stale completion. Existing application assertions are retained.

### Public deployment verification gaps

The previous release verifier checked text and catalog files but omitted image and font bytes. The updated bounded verifier also compares every site PNG, WebP, SVG and WOFF2 against the exact release. Font files are not included in shared review attachments.

A separate read-only script checks the canonical HTTPS entry, HTTP entry and HTTPS www entry with normal certificate validation and restricted redirects. Missing hosting headers are reported as owner-managed observations, not silently called repaired controls.

## Functional coverage

| Area | Checks performed |
| --- | --- |
| Navigation and pages | All 12 HTML entry points, local links/anchors, IDs, metadata, local assets, CSP and narrow-screen layouts. |
| Homepage forms | Safe email-draft preparation, input edits invalidating drafts, manual-copy fallback and blocked native form submission. No actual email or subscription sent. |
| Pause and reflections | Timer/state regression tests, motion control, personal text rendering and page-only writing safeguards. |
| What's Your Woo | Six categories, 24 original results, focus restoration, real paragraphs, clipboard denial, double taps, late results and reduced motion. |
| Pick Your Woo | 412-entry library, repeated card selection, no-repeat history, 3,000 simulated draws, native concurrent tabs and real random-source checks. |
| Gratitude Jar | Adding and reloading, removal confirmation/cancellation, concurrent additions, legacy reconciliation, corrupt-record recovery, denied storage, exact exports and unsaved-draft retention. |
| Daily Dose | 370 entries, eight time zones, DST/midnight behavior, invalid/stalled requests, bounded retry and stale-response rejection. |
| Sharing and links | 782 fixed mappings, immutable catalog checks, 1,564 Story/Post layouts, actual PNG downloads, activation-preserving image/text sharing, cancellation, manual fallback, QR and read-only recipient behavior. |
| Input security | HTML-like synthetic text stays text in personal reflections and stored notes. Unknown, duplicated and malformed permalink keys are rejected instead of drawing substitutes. |

Private-data tests use isolated synthetic profiles. No visitor's existing notes are inspected, changed or deleted. No real social account is used to publish a test post.

## Security and workflow review

Current-source guardrails check executable URL schemes, opener isolation, local/deferred HTML scripts, dangerous DOM rendering sinks and known credential formats. The scope is current HTML, 18 top-level browser scripts and public JSON, not the complete Git history or private account stores. The public analytics website identifier is not an API secret.

Native checks retain the production CSP and verify blocked inline execution, unapproved network access and native form submission. Existing policy disallows eval. Tests intercept external requests; the allowed analytics collection endpoint is simulated rather than sent real test events.

The workflow retains immutable Action commit pins, read-only contents permission and non-persisted checkout credentials. It does not introduce privileged pull_request_target execution or credentials into tests. The six existing release-verifier regressions are now included explicitly in the source job. The live verifier still requires both source and browser jobs to pass.

No live catalog, archived reflection snapshot, sharing renderer, approved artwork, analytics preference logic, random-selection engine or application note-storage engine is changed by this review.

## Evidence and test limitations

Local source/state results passed: 499 structural checks across 12 pages; all existing Node suites; 782 permalink contracts; 24 chooser contracts; current-source security guardrails; and six release-verifier regressions. Offline Chromium passed 92 whole-site checks, the full 412-pick suite and a separate 68-check chooser fixture.

Local native navigation is blocked by the environment with ERR_BLOCKED_BY_ADMINISTRATOR. Offline fixtures are not described as native cross-tab or production-CSP evidence. Exact-page native results come from GitHub's browser job.

PR run `37889986984`, on head `d097daa081c8ae1542fbaa9638703db58c5047e9`, passed the source job and all five native browser suites: 85 general checks, 11 legacy upgrade checks, 36 hardening checks, 61 sharing/link checks and 114 comprehensive-review checks, 307 total. The last suite includes all 12 pages and all 24 chooser paths. Clipboard and operating-system sharing boundaries remain simulated.

### Investigated intermittent legacy fixture failure

The initial PR run passed the source job and 85 native browser checks, then failed the older-tab addition assertion before new review coverage ran. The fixture refreshed the receiving tab immediately after another tab wrote localStorage, without establishing that native storage-event delivery had occurred.

The fixture now waits for the expected storage event and matching local snapshot, not for an application success result. All reconciliation, no-resurrection, export and pick-exclusion assertions remain. Synthetic IDs and availability flags are logged for diagnosis. The next complete run passed; it showed the expected two-note states with blocked=false, unavailable=false and persistent=true.

This corrects a test-ordering assumption. The first failure's exact cause is not established by that change alone, and the application storage engine is unchanged. The failure and subsequent diagnostics remain part of the review record rather than being erased by an unexplained retry.

### Final publication evidence

A later documentation-only commit may contain this report. Its CI result and the resulting main release must still be checked before claiming deployment. `live-verification.json` records exact published bytes and branded HTTP 404 behavior. `transport-verification.json` records the actual entry URLs and response headers. A verified HTTPS fetch is not an exhaustive TLS cipher audit.

## Remaining owner actions

### Protect production changes

At the reviewed baseline main reported protected=false and the ruleset collection was empty. Pages had already published a change whose quality job failed. This is the highest-priority confirmed release-control gap.

Require pull requests, appropriate review and passing Static and state-machine checks plus Browser policy and native cross-tab checks. Restrict force pushes and branch deletion. Do not make post-publication Public release byte verification a pre-merge requirement because it runs only on main. Consider deployment explicitly gated on passing checks. No repository administration or Pages configuration was changed in this code repair.

### Configure hosting-level controls

Read actual observed headers from the transport evidence. HTML meta CSP cannot enforce frame-ancestors. A response-level framing policy should preserve intentional same-origin preview framing. Review nosniff, HSTS, referrer and browser-permission policies at the hosting/edge layer. Ineffective HTML meta tags do not repair those controls. No domain, DNS or hosting account changes were made.

### Review account and third-party trust

Privately confirm MFA, recovery methods and least-privilege access for GitHub, domain/DNS, hosting and analytics accounts. Their private settings were not inspected; missing MFA is not alleged.

Allowed analytics remains third-party code on the site's origin. The ordinary pageview filter cannot guarantee what a compromised vendor script would do. Browser-local notes are not encrypted by this application, and same-origin scripts can technically access them. Keep private backups and do not treat the site as a secure vault. A change to analytics isolation or removal is a separate architecture decision.

### Complete physical-device acceptance

Physical iPhone/Android QR scanning and native Instagram composer behavior remain untested. Verify both image formats, offered app destinations, cancellation, iPhone Files/Photos fallback and pages opened inside social browsers. A browser sharing promise cannot certify that a post was published.

## Primary references

- OWASP HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- MDN frame-ancestors limitations: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
- GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- HTML storage-event and multiprocess boundaries: https://html.spec.whatwg.org/multipage/webstorage.html
