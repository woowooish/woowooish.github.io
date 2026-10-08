# Daily Dose sharing

## Visitor flow

Both Daily Dose locations use the same browser-only sharing module. The primary action comes before optional format choices. Story (1080 x 1920) is selected initially; Post (1080 x 1350) is one optional tap away. Both are prepared while the visitor reads. Switching between ready formats reuses cached PNGs, rather than making the visitor wait for another render. The selected format is remembered only in this open page, not in persistent storage.

When the browser reports file-sharing support, Share to Instagram sends only the prepared image to the native share menu. Instagram, a messaging app or another available target is the visitor's choice. The site cannot force Instagram to appear, select a Story/feed/message destination, or confirm publishing. Story sizing is not a native Story publishing integration.

Without file sharing, the primary action is a real download link, Save for Instagram. There is no misleading share button that only reveals instructions. Saving immediately reveals the next step and an Open Instagram link. It never opens a new app automatically. iPhone Files/Photos and in-app-browser instructions stay in a disclosure until needed.

The preview remains visible and all content is already on the image. Copy caption is optional, never a prerequisite to sharing. Send the words uses a separate text-only native share payload with the full dated reflection, question and attribution, so a recipient gets the original words even though the canonical Daily Dose link changes each day. On browsers without native sharing, the duplicate text-sharing control is hidden; Copy caption still works, with a labelled selectable field when clipboard access fails.

## Engineering boundaries

- No SDK, plugin, login, token, backend, tracking event, new storage or image upload is added.
- No Clipboard API call, image rendering, font wait or popup precedes the native share call inside the click handler. User activation is preserved.
- Cancellation never downloads, copies, or launches an app. Errors do not claim success.
- Both cached image URLs are revoked when Daily Dose changes. Detached asynchronous work cannot replace the new image or status.
- Encoding is bounded and retryable. One failed size does not discard the other.
- The entire original text is retained. The Story layout offsets important content away from top/bottom controls. Visitors still select the matching format in Instagram.
- The Daily Dose selector and all 370 entries remain unchanged. Pick Your Woo, private notes, existing artwork, analytics preferences and production CSP are not modified.

## Checks

Run `node scripts/check-daily-sharing.cjs` for source and full-library layout checks. Run `node scripts/check-daily-sharing-browser.cjs` with Node 22+ and Chrome/Chromium for real repository pages with production CSP. It checks both pages, 320/390/768/1440 widths, all 740 Story/Post canvas layouts, real downloads in both dimensions, supported and unsupported image sharing, text sharing, cancellation, clipboard denial, new-content invalidation and encoding retry. Only the OS/app share boundary is simulated. No social account is used.

A local environment that blocks loopback navigation cannot claim those native-page checks passed. Offline fixtures can supplement UI inspection, but production-CSP checks must run in the existing GitHub browser job. The main release workflow compares public HTML, JavaScript and CSS bytes to the release commit.

## Real-device acceptance, still required

On iPhone Safari and Android Chrome with Instagram installed, open the page from both the browser and the Instagram profile link. Test Story and Post, check which Instagram targets are offered, confirm the full image in the composer, cancel once, and test the explicit save fallback. Verify where downloads land and whether the help matches the installed versions. A real account owner decides whether to publish; testing the website does not authorize a test post.

## Future priorities, not part of this release

The next consistent UX improvement is to reuse this approach for Pick Your Woo without altering its no-repeat draw logic. Content-specific permanent links would improve recipient continuity, especially before adding desktop-to-phone QR transfer. A canonical Instagram post per published Daily Dose could allow native resharing without file transfer, but should link to an actual matching post, never a fabricated or guessed Instagram URL. That publishing workflow needs separate account access and editorial approval.

Do not add a wall of social buttons, automatic clipboard writes, forced app launches, account connection requests, or a native mobile app merely to reduce one tap.

## Platform references

- Web Share specification: https://www.w3.org/TR/web-share/
- Browser sharing and activation: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Native Instagram Story integration: https://developers.facebook.com/documentation/instagram-platform/sharing-to-stories
- Instagram professional-account publishing: https://developers.facebook.com/documentation/instagram-platform/content-publishing
