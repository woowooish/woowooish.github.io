# The art of noticing

## Purpose and editorial direction

A complete, standalone WooWooish feature at `/the-art-of-noticing/`, commissioned as an example of distinctive, useful long-form content. The central idea is ordinary wonder held with curiosity rather than certainty. The guide includes approximately 1,800 words of source-page article text, nine short invitations, five expandable field notes, a three-part observation/experience/interpretation example, a private field notebook and seven optional prompts for a week.

The source of brand direction is `docs/BRAND_GUIDE.md`, the existing homepage, and Annie's supplied interest in spirituality, consciousness and the woo-wooness of the world. The page uses the existing Bricolage Grotesque and Space Mono font definitions, the already-published beach portrait, navy and aqua colors, rounded controls and a scalloped transition. The new stylesheet is loaded only by this page.

This is original commissioned brand editorial, not a first-person account attributed to Annie. The coincidence example is explicitly imaginary. No private history, new qualifications, spiritual encounters, testimonials, health outcomes, event details or personal beliefs have been invented. There are no scientific or medical efficacy claims, borrowed source quotations, signup gates or paid recommendations. Annie has not separately reviewed or approved this exact new writing; do not represent it as her personal testimony or an approved quotation from her.

## Reader experience

Readers can begin with the long reflection, choose a setting for an invitation, open any of the five notes, or write in the notebook. All nine invitation summaries and the substantive reflections are present in the HTML and readable without JavaScript. Native details elements support keyboard navigation. The optional setting selector cycles through a fixed list; it is not a fortune, reading, diagnostic tool or supposedly personalized spiritual message.

The notebook has three labelled fields: something noticed, what it brought up, and a question left open. Nothing is submitted. The enhancement contains no network, analytics or persistent browser-storage API. Copy and text-file download happen only on a reader's click. Clipboard denial produces a selectable manual-copy field. Edits or clearing invalidate a pending copy result's status so obsolete feedback cannot reappear. Sharing the page copies only the canonical URL, never notebook text.

Browsers may retain form text independently. The page does not promise that closing a tab erases writing. Clearing the fields does not erase clipboard copies or downloaded files. There is no automatic save and no account.

## Files and integration

- `the-art-of-noticing/index.html`: editorial content, accessible source prompts, notebook and approved metadata.
- `assets/noticing.css`: isolated responsive editorial layout, focus states, reduced-motion and print styles.
- `assets/noticing.js`: optional invitation selector, copy/manual fallback, text download, clear and guide-link sharing.
- `assets/reflections.js`: original enhancement preserved byte-for-byte, with an independent discovery card appended after `#start-here`.
- `sitemap.xml`: adds the canonical guide URL.
- `scripts/check-noticing.py`: focused offline browser and structural checks.

The homepage discovery card is a JavaScript enhancement. It does not appear with JavaScript disabled; the guide itself is directly accessible without JavaScript and is included in the sitemap. This approach deliberately preserves the existing large homepage HTML and its authored copy. A future static homepage navigation pass can replace the card insertion with equivalent source HTML.

The homepage HTML, core stylesheet, forms, timer, daily reminders, contact behavior, domain settings, preview page, original photographs and existing social-preview assets are not changed. The new page does not load the homepage form/timer scripts. The earlier collaborator test PR is outside this change.

Open Graph and Twitter metadata retain the approved WooWooish title, description and portrait-free sharing card. Annie's face is not added to link-preview metadata.

## Verification performed before publication

The focused local suite passed 55 checks, including six page widths from 320 to 1440 pixels, all nine invitations and wraparound, pressed states, no-JavaScript reading, keyboard disclosures, empty-note handling, successful and denied clipboard paths, complete text download, stale async results after clearing, sharing without note text, input treated as text, reduced motion, and a separate homepage-card fixture at four widths. The existing reflection copy fallback also passed in that fixture, and repeated execution did not duplicate the card.

The existing reflection enhancement prefix was checked against Git blob `a4c1c9c8359181312928b1ad4f1f5dc223aa099b`. The new production-file blob identities checked locally are:

| File | Git blob SHA-1 |
| --- | --- |
| `the-art-of-noticing/index.html` | `9b306590739440965f51975a3b4e3ec3dcb7e6e5` |
| `assets/noticing.css` | `50c73650d953552e25de0e8235c18f0751239276` |
| `assets/noticing.js` | `d5a9d1643e37256cf38ade80cc3ce2d988137108` |
| `assets/reflections.js` | `8260e2fdedfc99e7fdbf8db81fc11e83ecdd9947` |

Local screenshots were reviewed for layout using fallback fonts without the remotely hosted photograph. These are not presented as screenshots of the final fully loaded live page. The focused suite does not replace the repository-wide tests; those were not run in this local snapshot. Live rendering, asset loading, the homepage discovery link and deployment status require separate post-deployment checks.

## Running the focused checks

Use Python with `beautifulsoup4`, `playwright` and a Chromium browser available. Run `python scripts/check-noticing.py` from the repository. Set `CHROMIUM_EXECUTABLE` for a custom browser location; otherwise the script uses a system Chromium or Playwright's browser. Test outputs go to a temporary directory, printed in the report. The page itself has no package installation or build dependency.

Also check syntax with `node --check assets/noticing.js` and `node --check assets/reflections.js`.

## Editing and rollback

Keep the guide URL stable. When editing invitation content, update both the enhanced wording and the corresponding source-HTML summary. Bump the guide's CSS/script version strings after asset edits. Retain the distinction between observation, personal experience and interpretation. Any future first-person story needs Annie's actual account and review.

Publish through the feature pull request, then verify GitHub Pages and the actual page. To roll this feature back, revert its merge commit. Do not revert unrelated homepage work or merge/close the earlier collaborator-access test as part of this feature.
