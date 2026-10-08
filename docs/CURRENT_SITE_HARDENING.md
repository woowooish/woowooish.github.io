# WooWooish current-site hardening release

This hardening pass was rebased onto the owner’s actual homepage and Daily Dose of Woo, rather than restoring an older design. It preserves the current centered four-choice hero, Our Story, the dedicated Daily Dose route and all 370 teacher-inspired original reflections.

## Safeguards

- Contact and newsletter forms cannot fall back to a GET submission if the JavaScript draft handler fails. The source buttons remain disabled until the handler attaches.
- Gratitude Jar validates saved data, retains corrupt data for recovery, supports backup downloads, and does not clear a draft when saving fails. Removing a saved note requires confirmation. Local/browser-only limitations are disclosed.
- A first-party privacy gate controls existing Umami pageview analytics on the production host; it respects Do Not Track, Global Privacy Control and the visitor’s local opt-out. Pageview fields are restricted, excluding notes, form values, fragments and query strings.
- The HTML has a restrictive meta Content Security Policy, approved image sharing metadata, privacy information, a branded 404, and source navigation that also works without scripts.
- The What Is Woo controls are hardened for stale results, unsupported clipboards and no-JavaScript reading.
- The original 412-Woo picker, the 370-day deterministic Daily Dose JS/data, the existing styles, photos, fonts, writing and Art of Noticing enhancement remain unchanged.
- Quality checks run as read-only GitHub Actions on pull requests and on main, but branch protection/required approvals must be configured by the repository owner if desired.

## Verification

The current-source structural suite covers all ten HTML documents and eight public canonical pages. The daily checks validate 370 distinct records, 740 deterministic assignments and daylight-saving continuity. Local Chromium fixture checks cover privacy-safe forms, saved-note error handling, Woo picking and Art of Noticing.

Tests execute against locally matched source files. Browser fixture tests inline script and font assets for sandbox compatibility, removing CSP only in their instrumentation; production HTML retains CSP. Native multi-tab races, independent phone hardware, analytics dashboard receipt, full security assessments and accessibility certification are outside this verification.

After merging, verify both the GitHub Pages deployment status for the merge commit and the live homepage/feature pages, including a deliberate unknown URL and the privacy opt-out. Do not merge a failing CI run.

## Scope and governance

All changes are contained in the repository and can be reverted through the merge commit. No visitor entries, personal accounts or domain settings are modified. A previously prepared social-sharing enhancement is not bundled into this security release.

The earlier review is retained in `docs/SITE_HARDENING_REVIEW.md` as a historical engineering record; this document describes the current site integration.
