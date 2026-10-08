"""Verify public Pages bytes for the checked-out release; read-only, no visitor data."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://woowooish.com'
HOSTS = {'woowooish.com', 'www.woowooish.com'}

class SameSite(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        url = urllib.parse.urlparse(newurl)
        if url.scheme != 'https' or url.hostname not in HOSTS:
            raise RuntimeError('Unexpected deployment redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

opener = urllib.request.build_opener(SameSite())
def fetch(path, release):
    req = urllib.request.Request(ORIGIN + path + '?release=' + release,
        headers={'User-Agent': 'WooWooish-release-verification', 'Cache-Control': 'no-cache'})
    with opener.open(req, timeout=12) as response:
        data = response.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            raise RuntimeError('Unexpectedly large public response')
        return data, dict(response.headers.items())

def main():
    release = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    paths = sorted(set(ROOT.glob('*.html')) | set((ROOT / 'the-art-of-noticing').glob('*.html')) |
                   set((ROOT / 'assets').glob('*.js')) | set((ROOT / 'assets').glob('*.css')) |
                   set((ROOT / 'assets/doses').glob('*.json')) |
                   {ROOT / 'robots.txt', ROOT / 'sitemap.xml'})
    failures = []
    records = []
    headers = {}
    for attempt in range(1, 16):
        records = []
        failures = []
        for path in paths:
            name = path.relative_to(ROOT).as_posix()
            try:
                body, response_headers = fetch('/' + name, release)
                wanted = hashlib.sha256(path.read_bytes()).hexdigest()
                received = hashlib.sha256(body).hexdigest()
                if wanted != received:
                    raise RuntimeError('Public file differs from release')
                records.append({'path': name, 'sha256': received})
                if name == 'index.html':
                    headers = {k.lower(): v for k, v in response_headers.items() if k.lower() in {
                        'content-security-policy', 'strict-transport-security', 'x-content-type-options',
                        'x-frame-options', 'permissions-policy', 'referrer-policy'}}
            except (OSError, ValueError, RuntimeError) as error:
                failures.append({'path': name, 'reason': str(error)})
                break  # Let deployment finish without repeatedly crawling unchanged files.
        if not failures:
            break
        print(json.dumps({'attempt': attempt, 'waiting_for_release': release, 'difference': failures[0]}), flush=True)
        if attempt < 15:
            time.sleep(15)
    missing_route = False
    if not failures:
        try:
            fetch('/release-verification-missing-' + release + '.html', release)
        except urllib.error.HTTPError as error:
            missing_route = error.code == 404 and b'WooWooish' in error.read(1024 * 1024)
        if not missing_route:
            failures.append({'path': 'missing-route', 'reason': 'Branded HTTP 404 not confirmed'})
    result = {'status': 'FAIL' if failures else 'PASS', 'commit': release, 'origin': ORIGIN,
              'verified_files': len(records), 'branded_404': missing_route,
              'observed_response_headers': headers, 'files': records, 'failures': failures}
    output = ROOT / 'audit-evidence'
    output.mkdir(exist_ok=True)
    (output / 'live-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f"## Public release verification\n{result['status']}: {len(records)} files matched commit `{release}` byte-for-byte. Branded HTTP 404: {missing_route}. No visitor data or external analytics submissions.\n")
    if failures:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
