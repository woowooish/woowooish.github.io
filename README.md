# Woowooish

Standalone recreation of the approved [Claude design](https://claude.ai/artifact/EufzTDh5NcKHBZ1BMgc5Y3), published with GitHub Pages at https://woowooish.com.

## Edit and publish

The site uses plain HTML, CSS and JavaScript. No build system, dependency installation, database or API key is required. GitHub Pages publishes the repository's `main` branch from its root. Keep `CNAME` set to `woowooish.com` and keep `.nojekyll`.

- `index.html`: brand copy, written practice, original reflections and gathering interest cards.
- `assets/site.css`: original design styles, mobile layout, keyboard focus and reduced motion.
- `assets/site.js`: email drafts, gathering interest inquiries and practice controls.
- `assets/pause.js`: the independent three-minute clock.
- `assets/fonts.css` and `assets/fonts/`: fonts from the reference, hosted locally.
- `assets/annie-beach.webp` and `assets/annie-avatar.webp`: original portrait assets from the reference, optimized for the web.
- `preview.html`: noindex desktop and mobile preview for visual checking.
- `docs/BRAND_GUIDE.md`: voice, visual language and factual content rules.
- `docs/OVERNIGHT_PLAN.md`: bounded overnight priorities, verification and progress.
- `scripts/check-site.cjs`: interaction and structural checks; run with `node scripts/check-site.cjs`.

## Current form behavior

Newsletter and contact forms validate inputs and prepare an email draft addressed to `woowooish@gmail.com`. Visitors review the draft and send it from their email application. No message is sent automatically. The Tide is an interest request, not an automatic subscription; there is no newsletter platform connected yet. No visitor details are stored on the website.

Gathering cards are explicitly ideas with no scheduled dates or places. Each “I’m interested” button pre-fills a contact inquiry; it does not reserve a place. Confirm the event schedule before accepting bookings.

The site includes four original readable reflections and an external Instagram profile link. Add specific post/reel links only when verified; do not imply that the original reflections are published reels. The free written practice works without JavaScript; its optional timer follows three one-minute stages and supports pausing and restarting.

## Local preview

From the repository folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. Changes to `main` trigger the existing GitHub Pages deployment. Check desktop and phone layouts and both forms before publishing edits.
