# Woowooish

Standalone recreation of the approved [Claude design](https://claude.ai/artifact/EufzTDh5NcKHBZ1BMgc5Y3), published with GitHub Pages at https://woowooish.com.

## Edit and publish

The site uses plain HTML, CSS and JavaScript. No build system, dependency installation, database or API key is required. GitHub Pages publishes the repository's `main` branch from its root. Keep `CNAME` set to `woowooish.com` and keep `.nojekyll`.

- `index.html`: copy, section layout, event cards and Instagram destinations.
- `assets/site.css`: original design styles, mobile layout, keyboard focus and reduced motion.
- `assets/site.js`: email drafts and gathering inquiries.
- `assets/fonts.css` and `assets/fonts/`: fonts from the reference, hosted locally.
- `assets/annie-beach.webp` and `assets/annie-avatar.webp`: original portrait assets from the reference, optimized for the web.
- `preview.html`: noindex desktop and mobile preview for visual checking.

## Current form behavior

Newsletter and contact forms validate inputs and prepare an email draft addressed to `woowooish@gmail.com`. Visitors review the draft and send it from their email application. No message is sent automatically. Newsletter requests require manual handling; there is no newsletter platform connected yet. No visitor details are stored on the website.

Gathering dates and locations are preserved from the reference and explicitly marked provisional. Each “Save my spot” button pre-fills a contact inquiry; it does not reserve a place. Confirm the event schedule before accepting bookings.

The striped reel cards preserve the reference design and link to the WooWooish Instagram profile. Replace each `href` with its specific public reel URL and replace the striped backgrounds with actual thumbnails when those are available.

## Local preview

From the repository folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. Changes to `main` trigger the existing GitHub Pages deployment. Check desktop and phone layouts and both forms before publishing edits.
