"""Read-only hosting observations: three public entry URLs, normal TLS verification."""
import json
import os
from pathlib import Path
import ssl
import urllib.request
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
HOSTS = {'woowooish.com', 'www.woowooish.com'}
POLICIES = ('strict-transport-security', 'content-security-policy', 'x-frame-options',
            'x-content-type-options', 'referrer-policy', 'permissions-policy')

class SiteRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        value = urllib.parse.urlsplit(newurl)
        if value.hostname not in HOSTS or value.scheme not in {'http', 'https'}:
            raise RuntimeError('Unexpected cross-site redirect')
        if req.full_url.startswith('https:') and value.scheme != 'https':
            raise RuntimeError('HTTPS downgrade redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def main():
    records, warnings = [], []
    opener = urllib.request.build_opener(SiteRedirects(),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()))
    for address in ['https://woowooish.com/', 'http://woowooish.com/', 'https://www.woowooish.com/']:
        item = {'requested': address}
        try:
            request = urllib.request.Request(address, headers={'User-Agent': 'WooWooish-security-review'})
            with opener.open(request, timeout=15) as response:
                item.update(status=response.status, final_url=response.geturl(),
                    headers={k.lower(): v for k, v in response.headers.items()
                             if k.lower() in POLICIES})
                response.read(1024)  # Only a small public body sample is needed.
            item['https'] = item['final_url'].startswith('https:')
            if not item['https']:
                warnings.append('HTTP is not redirected to HTTPS: ' + address)
        except Exception as error:
            item['error'] = type(error).__name__ + ': ' + str(error)
            warnings.append('Could not verify entry URL: ' + address)
        records.append(item)
    root = records[0]
    headers = root.get('headers', {})
    absent = [name for name in POLICIES if name not in headers]
    if 'content-security-policy' not in headers and 'x-frame-options' not in headers:
        warnings.append('No response-level framing protection observed; HTML meta policy cannot supply frame-ancestors.')
    if 'strict-transport-security' not in headers:
        warnings.append('No HSTS response header observed on the canonical HTTPS entry.')
    if headers.get('x-content-type-options', '').lower() != 'nosniff':
        warnings.append('X-Content-Type-Options: nosniff not observed on the canonical entry.')
    good = root.get('status') == 200 and root.get('https') is True
    result = {'status': 'OBSERVATIONS' if good else 'FAIL', 'canonical_https_verified': good,
        'certificate_validation': 'default trusted-chain and hostname verification; never disabled',
        'entry_urls': records, 'absent_canonical_headers': absent, 'owner_actions': warnings,
        'scope': 'Three bounded public requests; no accounts, notes, forms, scans or analytics submissions.'}
    out = ROOT / 'audit-evidence'; out.mkdir(exist_ok=True)
    (out / 'transport-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write('## Hosting security observations\nCanonical HTTPS verified: ' + str(good) +
                '. Missing response headers and owner actions remain observations, not repaired controls.\n')
    if not good:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
