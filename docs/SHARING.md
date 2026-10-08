# Reflection sharing and permanent links

## Released surfaces

The same browser-only sharing renderer (`assets/daily-share.js`) now serves Daily Dose on the homepage and daily-woo.html, a revealed Pick Your Woo card, and the read-only reflection.html reader. Story (1080 x 1920) is the default; Post (1080 x 1350) is optional. Both PNGs are prepared before sharing. The card contains the complete reflection, question and WooWooish attribution, without private writing or portraits.

The primary action is Share to Instagram where native file sharing is available, or an explicit Save for Instagram download otherwise. Visitors still choose an app and confirm there. Story selects the image shape, not a destination inside Instagram. Copy caption and Send the words remain optional. Only an image is sent through the image share path; text sharing includes the permanent link.

## Permanent public links

Every currently published reflection has a versioned key: 412 Pick Your Woo entries and 370 Daily Dose entries, 782 total. Examples:

- `https://woowooish.com/reflection.html?woo=p1-original-01`
- `https://woowooish.com/reflection.html?woo=d1-buddha-01`

Copy link copies only the canonical public URL for the displayed reflection. It includes no browser history, personal notes, campaign parameters or visitor identifiers. Clipboard denial reveals a labelled selectable link rather than claiming success.

The reader resolves these keys against frozen public content in `assets/shared/v1/`. These files are byte-for-byte copies of the published catalogs at introduction. Pick keys retain the existing permanent entry ID; Daily Dose keys name the teacher and fixed entry within the frozen collection. Neither depends on the recipient's date, time zone or random-number state. The reader uses neutral date wording rather than pretending an old Daily Dose is today's selection.

Opening a link is not a draw. The reader does not load the deck, atomic store or gratitude storage engine. It does not add the reflection to seen history, alter notes, or randomly substitute a different Woo. It offers separate links to start a new pick or read today's Daily Dose. Invalid, unknown, duplicated or incomplete keys show recovery; a failed Daily Dose snapshot request has a bounded retry. Late responses cannot replace the current requested reflection.

The shared reader uses JavaScript to resolve the exact entry. Its HTML includes a truthful no-JavaScript fallback. Social link previews retain the portrait-free WooWooish brand card; this release does not claim per-reflection server-rendered thumbnails or automatically created Instagram posts.

## Desktop-to-phone transfer

Open on your phone reveals a QR code for the same permanent URL plus a readable link. The QR is generated locally only when requested. It uses no QR service, redirect service, tracking link, login or upload. Scanning opens the same read-only reflection on the phone, where the same sharing controls are available. It does not open an Instagram composer automatically.

`assets/woo-qr.js` is a small, purpose-limited QR Model 2 encoder: version 5, error correction L, byte mode, fixed mask 0, four-module quiet zone. It accepts only printable ASCII up to 106 bytes. All current canonical URLs fit. Golden matrices independently generated with Python qrcode are checked by the dependency-free Node suite. The local release review compared all 782 matrices to that reference and decoded ten rendered QR images with OpenCV, plus the actual browser-rendered picker QR. This is not a physical-camera test.

## Privacy, stability and maintenance

No plugin, account connection, new storage, tracking event or server component is added. The existing analytics gate stays unchanged; reflection.html is not added to its reporting allowlist. Private notes are not a supported sharing source. Cancellation never copies, downloads or launches an app. Resetting Pick Your Woo disposes of both cached images, the permalink and QR. Pending work cannot write into the next card's panel.

Never overwrite a published `assets/shared/v1/` file, recycle a key, or renumber archived Daily Dose entries. `scripts/shared-v1-manifest.json` pins their SHA-256 hashes. Contract checks also detect divergence between current writing and v1 so a future content edit requires an explicit new snapshot version and routing support. Keep old snapshots and their parser support. Domain and hosting continuity remain prerequisites for any permanent URL.

The original card covers, all 412 live pick entries, all 370 live Daily Dose entries, no-repeat selection algorithms and private-note storage code are preserved. Daily Dose's renderer adds only the selected entry's permanent key; its date-selection function is unchanged.

## Verification

Run `node scripts/check-sharing-links.cjs` for all 782 links, frozen-catalog integrity, parser rejection cases, layout text retention and independent QR reference matrices. Run `node scripts/check-daily-sharing.cjs` for the original Daily Dose layout suite.

`node scripts/check-daily-sharing-browser.cjs` exercises exact repository pages in native Chromium with production CSP, actual PNG downloads, file/text share payloads, cancellation, retries, both image shapes, all 1,564 layouts, permanent reader links, malformed-link recovery, QR controls, and no-repeat history preservation across a reader visit. It uses fresh synthetic browser profiles and intercepts external requests. Only the app/clipboard boundaries are simulated; no account is posted to. The optional `python scripts/check-woo-browser.py` retains all 412 real UI draws and 824 Pick image layout checks in an explicitly offline fixture.

The local sandbox blocks navigation. Offline DOM/canvas checks supplement but do not replace the native GitHub browser job. Release checks include the frozen snapshot assets and compare public bytes with the exact release commit.

## Remaining physical-device acceptance

Test iPhone Safari and Android Chrome with Instagram installed, including links opened inside Instagram. Scan the QR with a phone, verify the same reflection, select Story and Post, inspect the complete image in the destination composer, cancel once and use the save fallback. Browsers cannot guarantee Instagram appears or confirm publishing. Only the account owner decides whether to post.

## Platform references

- Web Share API: https://www.w3.org/TR/web-share/
- Browser sharing: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- QR reference concepts: https://www.nayuki.io/page/qr-code-generator-library
