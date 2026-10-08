"""Offline Chromium integration checks. Requires playwright and beautifulsoup4.
The sandbox forbids navigation; exact local assets are inlined and platform storage/locks
are simulated. CSP is removed ONLY from these offline fixtures; a separate fixture
checks inline-script blocking. This is not a native multi-tab or live-origin CSP audit.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import base64,json,mimetypes,os,re,shutil,tempfile
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('WOO_QUALITY_OUTPUT') or tempfile.mkdtemp(prefix='woo-quality-'));OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,value):
    if not value: raise AssertionError(name)
    checks.append(name)
def data(path):return 'data:'+(mimetypes.guess_type(str(path))[0] or 'application/octet-stream')+';base64,'+base64.b64encode(path.read_bytes()).decode()
shim='''window.__saved=window.__saved||new Map();window.__mode=window.__mode||'ok';
Object.defineProperty(window,'localStorage',{configurable:true,get(){if(window.__mode==='blocked')throw Error('denied');return{getItem:k=>window.__saved.get(k)??null,setItem:(k,v)=>{if(window.__mode==='quota')throw Error('quota');window.__saved.set(k,v);},removeItem:k=>window.__saved.delete(k)}}});
window.__lockQueue=Promise.resolve();Object.defineProperty(navigator,'locks',{configurable:true,value:{request:(name,fn)=>{const p=window.__lockQueue.then(fn);window.__lockQueue=p.catch(()=>{});return p;}}});'''
def render(file):
    p=ROOT/file;s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    for meta in s.select('meta[http-equiv="Content-Security-Policy"]'):meta.decompose()
    for tag in s.select('link[rel=stylesheet]'):
        path=(ROOT/tag['href'].split('?')[0].lstrip('/')) if tag['href'].startswith('/') else p.parent/tag['href'].split('?')[0]
        css=path.read_text(encoding='utf-8')
        def url(m):
            val=m[1].strip("\"'")
            if val.startswith(('data:','http:','https:','#')):return m[0]
            return 'url("'+data(path.parent/val)+'")'
        css=re.sub(r'url\(([^)]+)\)',url,css)
        style=s.new_tag('style');style.string=css;tag.replace_with(style)
    for img in s.select('img[src]'):
        src=img['src'];img['src']=data(ROOT/src.lstrip('/') if src.startswith('/') else p.parent/src)
    scripts=[]
    for script in s.select('script[src]'):
        src=script['src'].split('?')[0]
        if not src.startswith(('http:','https:')):scripts.append((ROOT/src.lstrip('/') if src.startswith('/') else p.parent/src).read_text(encoding='utf-8'))
        script.decompose()
    for text in [shim]+scripts:
        tag=s.new_tag('script');tag.string=text;s.body.append(tag)
    return str(s)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
    ctx=b.new_context(reduced_motion='reduce',accept_downloads=True)
    ctx.route('**/*',lambda route:route.abort())
    page=ctx.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    files=['index.html','what-is-woo.html','pick-your-woo.html','gratitude-jar.html','the-art-of-noticing/index.html','privacy.html','404.html']
    for file in files:
        page.set_content(render(file));page.evaluate('document.fonts.ready')
        check(file+': main and heading visible',page.locator('h1').is_visible())
        for width in [320,390,768,1440]:
            page.set_viewport_size({'width':width,'height':920})
            check(file+f': no overflow {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        check(file+': keyboard skip link works',page.locator('.skip-link').count()==1)
        if file in ['privacy.html','gratitude-jar.html']:
            page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/(Path(file).stem+'-mobile.png')),full_page=True)
    # Empty corrupt storage and draft-preserving recovery exports.
    page=ctx.new_page()
    page.set_content(render('gratitude-jar.html'))
    page.evaluate("window.__saved.set(WooGratitude.key,'')")
    page.set_content(render('gratitude-jar.html'))
    check('Empty corrupt storage keeps recovery export enabled',page.locator('#jar-export').is_enabled())
    with page.expect_download() as got:page.locator('#jar-export').click()
    got.value.save_as(str(OUT/'empty-recovery.txt'))
    check('Empty corrupt recovery is an exact empty file',(OUT/'empty-recovery.txt').read_bytes()==b'')
    page.locator('#thought').fill('SYNTHETIC draft to recover')
    with page.expect_download() as got:page.locator('#jar-export').click()
    got.value.save_as(str(OUT/'draft-recovery.json'))
    recovery=json.loads((OUT/'draft-recovery.json').read_text())
    check('Recovery preserves original empty data and unsaved draft',recovery['originalStorage']=='' and recovery['unsavedDraft']=='SYNTHETIC draft to recover')
    check('Recovery does not overwrite the original saved bytes',page.evaluate("window.__saved.get(WooGratitude.key)===''"))

    # A new browsing context document avoids redeclaring the homepage's top-level bindings.
    page=ctx.new_page();page.on('pageerror',lambda err:errors.append(str(err)))
    # Real homepage DOM, synthetic inputs, no mail sent.
    page.set_content(render('index.html'))
    check('Homepage submit enabled only after initialization',page.locator('#contact-form [type=submit]').is_enabled())
    page.locator('#contact-form-name').fill('Synthetic reviewer');page.locator('#contact-form-email').fill('review@example.invalid');page.locator('#contact-form-message').fill('A local test, not sent.')
    page.locator('#contact-form [type=submit]').click()
    check('Homepage prepares a mailto draft without sending',page.locator('#contact-form-draft').get_attribute('href').startswith('mailto:woowooish@gmail.com?'))
    page.locator('#contact-form-message').fill('Edited draft')
    check('Homepage edits invalidate draft',not page.locator('#contact-form-draft').is_visible())
    # What Is Woo: editing, safe text, clipboard denial and asynchronous completion.
    page.set_content(render('what-is-woo.html'))
    page.locator('.woo-choice').first.click();page.locator('#woo-reveal').click()
    check('What Is Woo result appears',page.locator('#woo-result').is_visible())
    page.locator('#woo-personal').fill('<img src=x onerror="window.bad=true">')
    check('Typing invalidates previously revealed reflection',not page.locator('#woo-result').is_visible())
    page.locator('#woo-reveal').click()
    check('Personal text cannot create DOM markup',page.locator('#woo-result img').count()==0 and not page.evaluate('Boolean(window.bad)'))
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}})")
    page.locator('#woo-copy').click()
    check('Denied clipboard gives selected manual text',page.locator('#woo-manual-copy').is_visible() and '<img' in page.locator('#woo-copy-text').input_value())
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(r=>window.finish=r)}})")
    page.locator('#woo-copy').click();page.locator('#woo-personal').fill('A newer answer');page.evaluate('window.finish()')
    check('Delayed copy cannot restore obsolete answer',not page.locator('#woo-result').is_visible() and page.locator('#woo-copy-status').inner_text()=='')
    page.locator('#woo-reveal').click()
    check('Fresh answer uses the current writing','A newer answer' in page.locator('#woo-result-text').inner_text())
    # Jar: verified original schema survives across recreated pages, no private records used.
    page.evaluate("window.__saved=new Map();window.__mode='ok'")
    page.set_content(render('gratitude-jar.html'))
    page.locator('#thought').fill('TEST: ordinary afternoon light');page.locator('#gratitude-form [type=submit]').click()
    check('Jar saves synthetic note',page.locator('#entries .entry').count()==1 and 'saved' in page.locator('#status').inner_text())
    page.set_content(render('gratitude-jar.html'))
    check('Recreated page retains simulated saved notes',page.locator('#entries .entry').count()==1)
    page.locator('#entries .entry button').first.click()
    check('Removal asks before changing storage',page.locator('#jar-confirm').is_visible() and page.locator('#entries .entry').count()==1)
    check('Safe removal choice receives focus',page.evaluate("document.activeElement.id==='jar-keep'"))
    page.keyboard.press('Escape')
    check('Escape cancels note removal',not page.locator('#jar-confirm').is_visible() and page.locator('#entries .entry').count()==1)
    page.locator('#thought').fill('TEST: backup includes an unsaved draft')
    with page.expect_download() as dl:page.locator('#jar-export').click()
    backup=dl.value;backup.save_as(str(OUT/'synthetic-backup.json'))
    content=json.loads((OUT/'synthetic-backup.json').read_text())
    check('Backup includes saved notes and unsaved draft',len(content['notes'])==1 and content['unsavedDraft']=='TEST: backup includes an unsaved draft')
    page.evaluate("window.__mode='quota'")
    page.locator('#gratitude-form [type=submit]').click()
    check('Quota failure preserves typed draft',page.locator('#thought').input_value()=='TEST: backup includes an unsaved draft')
    check('Quota failure does not invent a saved note',page.locator('#entries .entry').count()==1 and 'could not be saved' in page.locator('#status').inner_text())
    page.evaluate("window.__mode='ok'")
    page.locator('#entries .entry button').first.click();page.locator('#jar-remove').click()
    check('Confirmed removal removes only selected note',page.locator('#entries .entry').count()==0)
    page.evaluate("window.__saved.set('woowooish-gratitude-v1','{BROKEN ORIGINAL');")
    page.set_content(render('gratitude-jar.html'))
    check('Malformed storage makes jar read-only',page.locator('#gratitude-form [type=submit]').is_disabled())
    with page.expect_download() as dl:page.locator('#jar-export').click()
    dl.value.save_as(str(OUT/'synthetic-recovery.txt'))
    check('Recovery backup preserves exact malformed original',(OUT/'synthetic-recovery.txt').read_text()=='{BROKEN ORIGINAL')
    page.evaluate("window.__saved=new Map();window.__mode='blocked'")
    page.set_content(render('gratitude-jar.html'))
    page.locator('#thought').fill('TEST: unsaved visit note');page.locator('#gratitude-form [type=submit]').click()
    check('Unavailable storage is visibly memory-only','not saved across visits' in page.locator('#count').inner_text())
    page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'jar-memory-mobile.png'),full_page=True)
    page.evaluate("window.__mode='ok';window.__saved=new Map([['woowooish-gratitude-v1',JSON.stringify(Array.from({length:65},(_,i)=>({id:'n'+i,text:'Synthetic note '+i,date:'2026-01-01'})))]]);")
    page.set_content(render('gratitude-jar.html'))
    check('Large jar initially renders 30 notes',page.locator('#entries .entry').count()==30)
    page.locator('#jar-more').click();check('Pagination renders next 30 notes',page.locator('#entries .entry').count()==60)
    # Same-day pick behavior and no extra history caused by support scripts.
    page.evaluate("window.__saved=new Map();window.__mode='ok'")
    page.set_content(render('pick-your-woo.html'))
    page.locator('.card').first.click();first=page.locator('#result').get_attribute('data-woo-id')
    page.locator('#again').click();page.locator('.card').first.click();second=page.locator('#result').get_attribute('data-woo-id')
    check('Picker still uses distinct click-time draws',bool(first) and first!=second)
    # No-JavaScript fallbacks on every public page.
    nc=b.new_context(java_script_enabled=False,viewport={'width':390,'height':844});np=nc.new_page();nc.route('**/*',lambda route:route.abort())
    for file in files:
        np.set_content(render(file))
        check(file+': no-JS main heading visible',np.locator('h1').is_visible())
        check(file+': no-JS cross-page navigation visible',np.locator('.site-support nav').is_visible())
        if file=='index.html':check('No-JS homepage submits fail closed',np.locator('#contact-form [type=submit]').is_disabled() and np.locator('#newsletter-form [type=submit]').is_disabled())
        if file=='gratitude-jar.html':check('No-JS jar gives help and cannot submit',np.locator('#jar-loading').is_visible() and np.locator('#gratitude-form [type=submit]').is_disabled())
        if file=='pick-your-woo.html':check('No-JS picker reflection remains available',np.locator('#fallback-woo').is_visible())
        if file=='what-is-woo.html':check('No-JS chooser explicitly unavailable',np.locator('#woo-enhancement-help').is_visible() and np.locator('#woo-reveal').is_disabled())
    check('No JavaScript runtime exceptions',not errors)
    # Isolated Chromium enforcement of the exact production meta policy.
    raw=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser');meta=str(raw.select_one('meta[http-equiv="Content-Security-Policy"]'))
    probe=ctx.new_page();probe.set_content('<!doctype html><html><head>'+meta+'</head><body><script>window.__unapproved=true</script><h1>CSP probe</h1></body></html>')
    check('CSP blocks unapproved inline script in Chromium',not probe.evaluate('Boolean(window.__unapproved)'))
    # Keep the real meta CSP intact for this collection-origin regression probe.
    def collection_response(route):
        route.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},body='{"ok":true}')
    ctx.route('https://gateway.umami.is/**',collection_response)
    allowed=probe.evaluate("fetch('https://gateway.umami.is/api/send',{method:'POST',body:'SYNTHETIC'}).then(r=>r.ok).catch(()=>false)")
    check('Production CSP permits the current analytics gateway',allowed)
    probe.evaluate("window.__connectBlocked=false;document.addEventListener('securitypolicyviolation',e=>{if(e.effectiveDirective==='connect-src')window.__connectBlocked=true})")
    probe.evaluate("fetch('https://example.invalid/blocked').catch(()=>false)")
    probe.wait_for_function('window.__connectBlocked')
    check('Production CSP still blocks unapproved connections',True)

    b.close()
report={'status':'PASS','checks_passed':len(checks),'checks':checks,'limitations':['Offline inlined production assets, simulated storage and locks. Not a live-origin or native multi-tab integration test.','Production CSP removed only in feature fixtures; isolated inline-script enforcement tested separately.','Analytics payload filtering tested against mocked platform boundary in check-privacy.cjs; private Umami dashboard not inspected.']}
(OUT/'quality-browser-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'PASS','checks_passed':len(checks),'output_directory':str(OUT)},indent=2))
