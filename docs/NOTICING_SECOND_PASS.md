# The art of noticing: second improvement pass

## Reader-facing changes

The existing guide remains at `/the-art-of-noticing/`. Its original essay, nine setting-based invitations, five field notes, seven optional weekly prompts, portrait and approved sharing metadata are preserved.

A new, source-HTML quick start offers three small steps: notice a detail, make room for the day you are actually having, and keep a few words. It appears before the long essay and is linked from the hero and page navigation. There is no timer, completion requirement, signup or promised emotional outcome.

The invitation card and each field note can now carry their question to a separate, labelled area above the notebook. This never writes into or replaces the reader's three editable fields. The chosen question is included in a copied note or text-file download, can be removed independently, and is never included in page-link sharing.

Each field note has a stable fragment URL and a visible permanent link. With JavaScript, an initial linked visit or a changed fragment opens the correct disclosure and focuses its summary. Without JavaScript, native disclosures and all of the guide's substantive content remain readable.

Clearing a nonempty notebook now asks for confirmation. Keyboard focus goes to Keep writing, Escape cancels, and edits invalidate an already-open confirmation. Confirmed clearing removes writing, the carried question and manual-copy text. It does not claim to erase clipboard copies or downloaded files. Empty notebooks can be cleared without an unnecessary confirmation.

A reminder next to the fields explains that the page is not an autosaving notebook. Nothing was added to submit notes, persist them, collect visitor details or track reading. Clipboard failures still expose a selectable manual-copy field. Edits, changed prompts and clearing invalidate obsolete asynchronous copy feedback.

## Scope

Changed production files: `the-art-of-noticing/index.html`, `assets/noticing.css`, and `assets/noticing.js`. The guide's stylesheet and script URLs are versioned `20261007-2`.

The homepage, its discovery card, shared fonts, original photographs, forms, daily reminders, existing reflections script, domain settings, metadata assets and deployment configuration are unchanged. No new biographical claims or first-person stories are attributed to Annie.

## Verification completed locally

`python scripts/check-noticing.py` passed **91 checks**. The test now embeds the actual production stylesheet, script, approved local fonts and original portrait for offline Chromium rendering rather than using fallback-font screenshots. The tested portrait loaded at 1254 pixels natural width, and Bricolage Grotesque and Space Mono were loaded.

Coverage includes source-HTML structure and labels; all nine invitations; no-JavaScript reading; keyboard disclosures; six initial widths from 320 to 1440 pixels; expanded notes and carried prompts at four widths; fresh and changed deep links; prompt transfer without overwriting writing; prompt-inclusive copy and text downloads; removal and confirmed clearing; cancel, Escape and stale confirmation handling; late clipboard completion after clearing or changing prompts; denied-clipboard fallback; guide-only sharing; reduced motion; and the existing homepage discovery-card fixture.

The four original Node suites also passed:

```sh
node scripts/check-site.cjs
node scripts/check-reflections.cjs
node scripts/check-daily.cjs
node scripts/check-photos.cjs
```

The new script passed `node --check assets/noticing.js`. Desktop and mobile screenshots of the quick start, carried-question notebook, invitation actions and clear confirmation were visually reviewed with the original assets loaded.

These are local Chromium checks, not a claim of every-browser coverage or a formal accessibility audit. A separate post-merge check must confirm GitHub Pages deployment and the live page. No visitor data, contact form or newsletter request was submitted during testing.

## Maintenance

The focused test's offline asset loader accepts versioned stylesheet and script paths, so future cache-version changes do not silently remove the tested CSS. Outputs go to a temporary directory printed by the runner.

Keep stable field-note IDs. Preserve the separation between a carried prompt and a reader's answer. Do not add automatic persistence without a separate privacy and product decision. Reverting the second-pass merge reverts only these refinements.
