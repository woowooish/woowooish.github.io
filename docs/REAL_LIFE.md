# Woo for Real Life: unlisted collection

## State and editorial scope

Eight original, situational guides and a hub at `/woo-for-real-life/`. No links were added from existing public pages, navigation, experiences or sitemaps. Each new HTML page uses `noindex,follow`. These pages are publicly reachable by direct URL, not private, authenticated or guaranteed invisible to search engines. Do not put confidential content here. Robots.txt is intentionally unchanged so a crawler can read each page's noindex directive.

Each guide has a recognizable situation, one useful distinction, one optional practice, one question and exactly one relevant existing Woo. The prose is original commissioned brand writing, not Annie's autobiography, clinical care, a prediction or evidence of a practice's effectiveness. Scenarios and sample dialogue are illustrative. Respect physical safety, realistic constraints, and the reader's option to stop. No forced positivity, breathing patterns, closed eyes, signs from the universe, diagnoses or efficacy claims.

## Reading experience

Static HTML, local brand fonts, isolated `assets/real-life.css`, semantic headings, skip links, mobile layout, visible focus, optional native disclosures and a print stylesheet. No new runtime script, form, note field, timer, sign-up or storage key. The required existing privacy gate remains unchanged; the new routes are not on its analytics allowlist. Questions are for thought or the reader's own paper, not site input.

Woo title/body text is embedded in HTML for no-JavaScript readers and linked to exact `p1-` IDs in the frozen v1 catalog. Existing catalogs, randomization, history, sharing, QR codes and data stores are unchanged. Permanent-link reader and sharing tools still require JavaScript. Do not link to a fresh random draw as though it were the guide's selected Woo.

## Maintenance and launch

Edit the HTML pages directly. After release, update the asset version in all nine HTML files if changing the stylesheet. Keep one H1, one question section, one practical exercise and one closing Woo per guide. Match the frozen catalog verbatim for the closing title/body. Check reading-time labels if materially changing the writing.

Run `python3 scripts/check-quality.py`, `python3 scripts/check-security-source.py`, and `node scripts/check-real-life.cjs`, followed by the existing full regression and browser suites. `check-quality.py` invokes the new collection contract as well. The public release verifier includes these pages. The extended `scripts/check-review-runtime.cjs` checks native page loads, mobile overflow, navigation, disclosure behavior, no-JavaScript reading and disabled tracking with the production policy intact.

Launch only after the owner approves linking. In one reviewed change, remove noindex from these nine pages, add their canonicals to sitemap.xml, choose a restrained entry point on the main site, and revise the unlisted assertions and preview labels. Do not silently publish directory links during unrelated improvements. Adding tracking needs a separate explicit decision; a public launch does not require analytics.

## Integration with concurrent site changes

The main branch added Inner Little Woo and its homepage link during this work. Preserve both. Its missing standard page scaffolding prevented whole-site checks from passing, so this release adds the existing security policy, privacy gate/link, canonical/share metadata and skip link without redesigning its content or artwork. The only sitemap addition is that already public page, never this unlisted collection.
