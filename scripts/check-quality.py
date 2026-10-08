"""Dependency-free whole-site structural/privacy checks. Run from any directory."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json, re, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
class Document(HTMLParser):
    def __init__(self,text):
        super().__init__();self.tags=[];self.feed(text)
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
    def find(self,tag=None,**attrs):return [a for t,a in self.tags if (tag is None or t==tag) and all(a.get(k)==v for k,v in attrs.items())]
checks=[]
def check(name,good):
    if not good:raise AssertionError(name)
    checks.append(name)
docs={p:Document(p.read_text(encoding='utf-8')) for p in ROOT.rglob('*.html')}
for p,d in docs.items():
    name=p.relative_to(ROOT).as_posix();text=p.read_text(encoding='utf-8')
    check(name+': one h1',len(d.find('h1'))==1)
    ids=[a['id'] for t,a in d.tags if 'id' in a];check(name+': unique IDs',len(ids)==len(set(ids)))
    check(name+': skip link',any('skip-link' in a.get('class','') for a in d.find('a')))
    check(name+': image alternatives',all('alt' in a for a in d.find('img')))
    policy=d.find('meta',**{'http-equiv':'Content-Security-Policy'})
    check(name+': CSP',len(policy)==1 and all(v in policy[0]['content'] for v in ["script-src 'self' https://cloud.umami.is", "form-action 'none'", "base-uri 'none'", "object-src 'none'"]))
    directives={part.strip().split()[0]:part.strip().split()[1:] for part in policy[0]['content'].split(';') if part.strip()}
    check(name+': exact analytics collection origin',set(directives.get('connect-src',[]))=={"'self'",'https://gateway.umami.is'})
    check(name+': policy before executable assets',text.index('Content-Security-Policy')<text.find('<script') if '<script' in text else True)
    check(name+': no unsafe script exceptions',"'unsafe-inline'" not in policy[0]['content'].split('script-src ')[1].split(';')[0] and "'unsafe-eval'" not in policy[0]['content'])
    check(name+': no inline scripts or event attributes',not re.search(r'<script(?:\s[^>]*)?>(?!\s*</script>)',text) and not any(k.lower().startswith('on') for t,a in d.tags for k in a))
    check(name+': no raw tracker injection',not any('cloud.umami.is' in a.get('src','') for a in d.find('script')))
    if name not in ['preview.html','404.html']:
        check(name+': canonical',len(d.find('link',rel='canonical'))==1)
        check(name+': approved share card',any(a.get('content')=='https://woowooish.com/assets/woowooish-share-20261006.png' for a in d.find('meta',property='og:image')))
        check(name+': privacy link',bool(d.find('a',href='/privacy.html')))
        check(name+': privacy gate included',any('/assets/site-privacy.js?' in a.get('src','') for a in d.find('script')))
    for t,a in d.tags:
        for prop in ['href','src']:
            value=a.get(prop)
            if not value or value.startswith(('data:','blob:','mailto:','tel:')):continue
            u=urlparse(value)
            if u.netloc or u.scheme:continue
            dest=ROOT/u.path.lstrip('/') if u.path.startswith('/') else p.parent/u.path
            if not u.path:dest=p
            if dest.is_dir():dest=dest/'index.html'
            check(name+': local target '+value,dest.is_file())
            if u.fragment and dest in docs:
                check(name+': anchor '+value,any(at.get('id')==unquote(u.fragment) for _,at in docs[dest].tags))
    for form in d.find('form'):
        check(name+': post fallback',form.get('method')=='post' and form.get('action')=='/')
    if d.find('form'):
        check(name+': source submit controls disabled',all('disabled' in a for a in d.find('button',type='submit')))
urls={e.text for e in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
check('All public canonical pages are in sitemap',urls=={a['href'] for p,d in docs.items() if p.name not in ['preview.html','404.html'] for a in d.find('link',rel='canonical')})
check('404 explicitly noindex',bool(docs[ROOT/'404.html'].find('meta',name='robots',content='noindex,follow')))
check('CNAME preserved',(ROOT/'CNAME').read_text().strip()=='woowooish.com')
check('NoJekyll retained',(ROOT/'.nojekyll').is_file())
print(json.dumps({'status':'PASS','checks_passed':len(checks),'html_pages':len(docs),'checks':checks},indent=2))
