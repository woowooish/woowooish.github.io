# Security and privacy maintenance

## Reporting a problem

Use the site's existing contact address, woowooish@gmail.com, to tell the maintainer about a suspected vulnerability. Start with a brief description and the affected public page. Do not publish credentials, real visitor notes, private backups, or sensitive exploit details in public issues. Reproduce storage problems only with synthetic notes in a separate browser profile. Do not test against another visitor's browser data.

## Supported release

The maintained release is the current `main` branch deployed at woowooish.com. Refresh older tabs after an update. The site is a static GitHub Pages application, not an encrypted notebook, account service, or medical service. Page-only writing and browser-local storage are not a substitute for a private backup.

## Before merging

Run both Site quality checks jobs and inspect their results for the exact proposed commit. Preserve stable Woo IDs and storage keys. Keep unknown or conflicting note records recoverable. Changes to browser scripts require new asset query versions on every referencing page. Check the public-release verification after the merge; a successful source test alone does not establish a successful deployment.

Actions use immutable commit pins and a read-only repository token, with checkout credentials not persisted. Review dependency-update pull requests before merging. The repository must not contain service credentials or private personal data.

## Owner-level controls

Repository rules requiring passing checks and appropriate reviews, account two-factor authentication, recovery methods, domain registrar security, and hosting response-header controls must be managed by the account owner. The quality workflow does not itself protect `main` or stop branch-based Pages publishing. No document or HTML meta tag can enable these account settings.

The HTML Content Security Policy blocks inline script and eval but retains inline design styles. Meta policy cannot enforce `frame-ancestors`; use a real hosting response header for framing protection. Any edge/header change must be tested against the site's intentional preview iframe, analytics choice, sharing, and file downloads. Do not weaken the policy to silence an error.

## Storage limitations

IndexedDB transactions coordinate supported current tabs. Legacy localStorage is inspected separately and cannot participate in the same atomic transaction. A retained old snapshot avoids a compare-then-delete race but may still contain notes removed from the active jar. Close older tabs and clear all site storage, including IndexedDB and localStorage, to remove these copies. Downloaded backups, clipboard copies and sent messages are outside the site's deletion controls. Browser data is not encrypted by this site, and permitted third-party scripts can technically access it.

## Review boundary

Automated checks and source review reduce risk; they do not certify a permanently vulnerability-free site. Browser versions, hosting, extensions and external services change independently. The audit uses no real visitor records and does not certify third-party internals or private account configuration.
