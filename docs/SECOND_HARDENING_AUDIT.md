# Second hardening audit

Baseline: `40e1fb54a8f0a63d0daf7e1e73adf718826e2ae4` (previous hardening release). This pass preserves the current design, all 412 picker entries, all 370 daily entries, the picker/store schemas and the Art of Noticing logic.

## Reproduced and repaired

1. The previous CSP omitted the current Umami collection origin. Every HTML entry point now allows exactly self plus `https://gateway.umami.is` for connections. The privacy loader pins that same origin. Unapproved connections and inline JavaScript remain blocked.
2. An empty corrupt Gratitude Jar storage value disabled its recovery export. Null is now distinguished from an empty string. A zero-byte original can be downloaded, and a recovery backup made while a draft exists includes both the exact original bytes and that unsaved draft. No recovery operation overwrites the original storage.
3. Unreadable analytics preferences previously fell back to allowing analytics. They now fail closed until explicit permission is given. The gate also excludes unknown paths and previews, allows only bounded scalar pageview fields, and refreshes opt-out state after back-forward-cache restoration.
4. Daily Dose requests could remain pending indefinitely and could display yesterday's article beneath today's date. Requests and response parsing now have a 12-second deadline, explicit retry, cancellation of obsolete work and stale-result guards. Clipboard feedback cannot restore a replaced daily card.
5. The previous DST regression ran in the CI runner's UTC timezone. The new matrix launches eight timezone-specific processes and tests 740 dates at five times each plus the next midnight. Five of the zones assert real seasonal offset differences, including the half-hour Lord Howe transition.

## Local evidence before publication

- 419 structural checks across ten HTML documents.
- 29 privacy boundary checks and 21 Daily Dose loading/error-state checks.
- 35,525 local-calendar assertions across eight timezones, in addition to 370-record and 740-assignment content checks.
- 92 whole-site Chromium fixture checks, 50 picker browser checks and 91 Art of Noticing browser checks.
- Existing site, reflection, image, 35 picker-engine and 23 Gratitude-store checks passed.
- Newly added privacy and daily-loading regressions fail against their respective baseline implementations, demonstrating that the tests distinguish the repairs.

The local browser environment does not permit navigation. Existing browser fixture tests inline assets and simulate storage/locks; CSP is removed only for that instrumentation. Separate policy probes retain the actual CSP and intercept gateway requests locally. No claim is made that these fixtures exercise native cross-tab behavior.

## New CI coverage

`scripts/check-browser-runtime.cjs` is a dependency-free Chrome DevTools test with Node 22+. It serves the actual repository files over loopback with production CSP unchanged and uses native localStorage and Web Locks in independent pages. It exercises responsive routes, feature initialization, policy enforcement, 200 two-tab Woo draws, 60 two-tab note additions, recovery downloads, request failure/retry and privacy storage events. External requests are intercepted, not sent to real services. A new read-only CI job runs it. Its executed result, any repairs required by CI, and final deployment evidence are recorded on the release pull request, not assumed from the test's existence.

## Boundaries

This is a defensive source and browser audit, not a guarantee of zero defects or a formal penetration/accessibility certification. No private visitor records were used. Native hardware Safari/Firefox, authenticated social posting, private Umami dashboard receipt, repository-owner account security and hosting response headers are not certified here. The prior blocked social-sharing package is excluded.

Relevant primary references: Umami's current Cloud collection host in `https://docs.umami.is/docs/bypass-ad-blockers`, tracker settings in `https://docs.umami.is/docs/tracker-configuration`, and meta-policy limitations in `https://www.w3.org/TR/CSP/`. The host reference is used to fix CSP compatibility, not to bypass content blockers.
