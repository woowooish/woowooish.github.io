"""Dependency-free browser-source guardrails, not a secret-history or penetration scan."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
class Tags(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags = []; self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

checks = 0
problems = []
def check(label, condition):
    global checks
    checks += 1
    if not condition:
        problems.append(label)

html = list(ROOT.rglob('*.html'))
for path in html:
    for tag, attrs in Tags(path.read_text()).tags:
        for key in ['href', 'src', 'action']:
            value = attrs.get(key, '').strip()
            check(path.name + ': executable URL scheme', not re.match(r'(?i)(javascript|vbscript):', value))
        if tag == 'a' and attrs.get('target') == '_blank':
            check(path.name + ': opener isolation', {'noopener', 'noreferrer'} <= set(attrs.get('rel', '').split()))
        if tag == 'script':
            check(path.name + ': scripts are local', not re.match(r'(?i)(https?:)?//', attrs.get('src', '')))
            check(path.name + ': defer scripts', 'defer' in attrs)

assets = list((ROOT / 'assets').glob('*.js'))
for path in assets:
    source = path.read_text()
    check(path.name + ': no executable DOM interpolation', not re.search(
        r'(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(', source))

# Known credential formats only. Report labels/paths, never matched credential text.
patterns = {
    'private key': r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'GitHub token': r'(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,})',
    'AWS access key': r'AKIA[0-9A-Z]{16}',
    'Slack token': r'xox[baprs]-[0-9A-Za-z-]{20,}',
    'Stripe live secret': r'sk_live_[0-9A-Za-z]{20,}',
}
for path in html + assets + list((ROOT / 'assets').rglob('*.json')):
    for label, pattern in patterns.items():
        check(str(path.relative_to(ROOT)) + ': ' + label, not re.search(pattern, path.read_text()))
workflow = ROOT / '.github/workflows/site-quality.yml'
if workflow.exists():
    source = workflow.read_text()
    check('CI default token remains read-only', '  contents: read' in source and 'contents: write' not in source)
    check('No privileged PR event', 'pull_request_target' not in source)
    check('Immutable Action pins', all(re.fullmatch(r'[a-f0-9]{40}', pin) for pin in re.findall(r'uses:\s+[^\s@]+@([^\s]+)', source)))
result = {'status': 'FAIL' if problems else 'PASS', 'checks': checks,
    'html_pages': len(html), 'browser_scripts': len(assets), 'findings': problems,
    'scope': 'Current HTML/browser code and public JSON only. No Git history, account secrets or third-party internals scanned.'}
print(json.dumps(result, indent=2))
if problems:
    raise SystemExit(1)
