# Woowooish

Standalone recreation of the approved [Claude design](https://claude.ai/artifact/EufzTDh5NcKHBZ1BMgc5Y3), published with GitHub Pages at https://woowooish.com.

## Edit and publish

The site uses plain HTML, CSS and JavaScript. No build system, dependency installation, database or API key is required. GitHub Pages publishes the repository's `main` branch from its root. Keep `CNAME` set to `woowooish.com` and keep `.nojekyll`.

- `index.html`: brand copy, written practice, original reflections and gathering interest cards.
- `assets/site.css`: original design styles, mobile layout, keyboard focus and reduced motion.
- `assets/site.js`: email drafts, gathering interest inquiries and practice controls.
- `assets/pause.js`: the independent three-minute clock.
- `assets/reflections.js`: opens linked reflections and copies questions or permanent links, with manual selection when clipboard access is unavailable.
- `assets/fonts.css` and `assets/fonts/`: fonts from the reference, hosted locally.
- `assets/annie-beach.webp` and `assets/annie-avatar.webp`: original portrait assets from the reference, optimized for the web.
- `preview.html`: noindex phone (390px) and tablet (768px) frames for visual checking; check the main page separately on desktop.
- `docs/BRAND_GUIDE.md`: voice, visual language and factual content rules.
- `docs/OVERNIGHT_PLAN.md`: bounded overnight priorities, verification and progress.
- `scripts/check-site.cjs` and `scripts/check-reflections.cjs`: interaction and structural checks; run both with Node.

## Current form behavior

Newsletter and contact forms validate inputs and prepare an email draft addressed to `woowooish@gmail.com`. Visitors review the draft and send it from their email application. No message is sent automatically. The Tide is an interest request, not an automatic subscription; there is no newsletter platform connected yet. No visitor details are stored on the website.

Every editable form control has an explicit HTML label. Contact labels stay visible after a visitor starts typing; the compact newsletter field uses a screen-reader label while keeping the approved pill layout.

After preparing a draft, visitors can use the email-app link or expand “Use another email service” to copy the full draft. Where clipboard writing is unavailable or denied, the control selects the draft for manual copying. Editing the form or choosing a new gathering idea clears the old draft. A delayed clipboard result cannot restore an obsolete draft status.

Gathering cards are explicitly ideas with no scheduled dates or places. Each “I’m interested” button pre-fills a contact inquiry; it does not reserve a place. Confirm the event schedule before accepting bookings.

The site includes four original readable reflections and an external Instagram profile link. Add specific post/reel links only when verified; do not imply that the original reflections are published reels. The free written practice works without JavaScript; its optional timer follows three one-minute stages and supports pausing and restarting. A second, non-timed “both-and” practice offers three short prompts for days when more than one feeling is present.

The hero includes a keyboard-accessible control that pauses or plays the decorative marquee and rotating seal. The site automatically stops those animations and hides the redundant control when the visitor has enabled reduced motion at the operating-system or browser level.

## Visitor paths and Annie’s voice

“Start here” offers three routes: Find calm (the timer), Meet your feelings (the both-and practice), and Feel alive (the wonder reflection). The new section replaces the oversized decorative founder quote so useful choices appear sooner. Gathering ideas remain available further down the page and in the footer.

The introduction connects Annie’s work in aerospace with her curiosity about consciousness and spirituality, without claiming scientific or spiritual credentials. The brand promise is remembering calm, peace and love already within. A featured note uses Annie’s supplied “Life doesn’t have to be perfect to feel beautiful” wording; no private circumstances are published.

Each reflection offers “Copy question” and “Copy link.” Direct hash links to a reflection open its native disclosure when JavaScript is available. With JavaScript disabled, all writing is still accessible through the native disclosures. Copy controls appear only after the enhancement loads, and an unavailable/denied clipboard exposes a selected read-only field. The feature adds no tracking, storage or external service.

## Local preview

From the repository folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. Changes to `main` trigger the existing GitHub Pages deployment. Check desktop and phone layouts and both forms before publishing edits.
