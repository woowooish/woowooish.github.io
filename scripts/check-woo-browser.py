"""Offline browser checks of the real picker scripts, content and CSS.
Requires Python, playwright, Chromium and Pillow. Run: python scripts/check-woo-browser.py
Fetch, storage and locks use explicit test adapters because this environment forbids browser navigation.
These checks do not claim to verify native cross-tab locks or disk persistence.
Screenshots and results are written to a temporary directory, never into the repository.
"""
from pathlib import Path
import os, shutil, tempfile, json
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('WOO_TEST_OUTPUT',tempfile.mkdtemp(prefix='woo-browser-')))
OUT.mkdir(parents=True,exist_ok=True)
checks=[]
KEY='woowooish.pick-your-woo.history.v1'
entries=json.loads((ROOT/'assets/woo-library.json').read_text())['entries']
def check(name, value):
    assert value,name
    checks.append(name)
    print('PASS',name,flush=True)
from bs4 import BeautifulSoup
source=BeautifulSoup((ROOT/'pick-your-woo.html').read_text(),'html.parser')
analytics=source.select('script[src="https://cloud.umami.is/script.js"]')
check('Owner-added analytics preserved without picker events',len(analytics)==1 and analytics[0].get('data-website-id')=='77cbb298-6ccc-4ae1-b912-6e398efc6956' and not source.select('[data-umami-event]'))
# Existing page analytics is intentionally not executed by this offline feature test.
for tag in source.select('script[src]'): tag.decompose()
for link in source.select('link[rel=stylesheet]'):
    css=source.new_tag('style');css.string=(ROOT/link['href'].split('?')[0].lstrip('/')).read_text();link.replace_with(css)
HTML=str(source)
CORE=(ROOT/'assets/woo-deck.js').read_text()
UI=(ROOT/'assets/pick-woo.js').read_text()
FIXTURE="""
window.__wooStore=window.__wooStore||new Map();
window.__wooFetchCount=window.__wooFetchCount||0;
Object.defineProperty(window,'localStorage',{configurable:true,get(){
  if(window.__blockStorage)throw Error('blocked');
  return {getItem:k=>__wooStore.has(k)?__wooStore.get(k):null,setItem:(k,v)=>__wooStore.set(k,v),removeItem:k=>__wooStore.delete(k)};
}});
window.fetch=async()=>{window.__wooFetchCount++;return {ok:!window.__failLibrary,json:async()=>window.__wooData}};
window.__wooQueue=Promise.resolve();
Object.defineProperty(navigator,'locks',{configurable:true,value:{request:(_name,fn)=>{
 const job=window.__wooQueue.then(fn);window.__wooQueue=job.catch(()=>{});return job;
}}});
"""
def ready(p, *, blocked=False, failed=False, js=True, data=None):
    p.set_content(HTML)
    if not js:return
    p.evaluate('(x)=>{window.__blockStorage=x.blocked;window.__failLibrary=x.failed;window.__wooData=x.data}',{'blocked':blocked,'failed':failed,'data':data or {'schema':1,'entries':entries}})
    p.add_script_tag(content=FIXTURE)
    p.add_script_tag(content=CORE)
    p.add_script_tag(content=UI)
    if not failed:p.wait_for_function("!document.querySelector('.card').disabled")
def pick(p,i=0):
    p.locator('.card').nth(i).click()
    p.wait_for_function("!document.getElementById('result').hidden")
    return p.locator('#result').get_attribute('data-woo-id')
def again(p):p.locator('#again').click()
with sync_playwright() as tool:
    browser=tool.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
    context=browser.new_context(reduced_motion='reduce',viewport={'width':1440,'height':1000},accept_downloads=True)
    page=context.new_page();errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/*',lambda r:r.abort())
    page.on('request',lambda r:requests.append((r.url,r.method)))
    ready(page)
    check('All three familiar covers retained',page.locator('.card-title').all_text_contents()==['The Sunbeam','The Moonlight','The Wildflower'])
    check('412-item count visible',page.locator('#library-count').inner_text()=='412')
    check('Loading consumes no Woo and writes no history',page.evaluate('(key)=>localStorage.getItem(key)===null',KEY))
    check('No predetermined hidden messages',page.locator('.back strong').all_text_contents()==['','',''])
    check('Fallback hidden after successful load',not page.locator('#picker-fallback').is_visible())
    page.screenshot(path=str(OUT/'picker-desktop.png'),full_page=True)
    first=pick(page)
    check('First click consumes exactly one item',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).seen.length',KEY)==1)
    check('Revealed title and result agree',page.locator('.card.revealed strong').inner_text()==page.locator('#result-title').inner_text())
    check('Unselected covers remain blank',page.locator('.card:not(.revealed) strong').all_text_contents()==['',''])
    check('Result heading receives focus',page.evaluate("document.activeElement.id==='result-title'"))
    page.locator('.card').nth(1).evaluate('(b)=>b.click()')
    check('Disabled second cover does not consume another item',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).seen.length',KEY)==1)
    ready(page);second=pick(page)
    check('Reinitializing with retained storage changes same-card result',first!=second)
    ids=[first,second]
    for i in range(18):
        again(page);ids.append(pick(page,i%3))
    check('Twenty same-day selections are all different',len(set(ids))==20)
    check('One shared pool across all three covers',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).seen.length',KEY)==20)
    again(page)
    page.locator('.card').first.evaluate('(b)=>{b.click();b.click();b.click();}')
    page.wait_for_function("!document.getElementById('result').hidden")
    check('Rapid triple click consumes one Woo',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).seen.length',KEY)==21)
    # Same state and lock adapters shared by two separate engine instances.
    # Native cross-tab behavior is NOT claimed by this offline fixture.
    parallel=page.evaluate("""async()=>{
      const a=WooDeck.createPicker(__wooData.entries),b=WooDeck.createPicker(__wooData.entries);
      return (await Promise.all([a.pick(),b.pick()])).map(x=>x.entry.id);
    }""")
    check('Two picker instances coordinate through the lock adapter',len(set(parallel))==2)
    check('Both coordinated writes retained',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).seen.length',KEY)==23)
    # Share success and failure, without opening outside apps.
    page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copiedWoo=t}}})")
    page.locator('#share').click()
    check('Share copies exact selected Woo and canonical URL',page.evaluate("copiedWoo.includes(document.getElementById('result-title').textContent)&&copiedWoo.endsWith('https://woowooish.com/pick-your-woo.html')"))
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}})")
    page.locator('#share').click()
    check('Clipboard denial exposes accessible manual copy',page.locator('#copy-fallback').is_visible() and page.locator('#copy-text').input_value().endswith('https://woowooish.com/pick-your-woo.html'))
    again(page);pick(page)
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(r=>{window.finishCopy=r})}})")
    page.locator('#share').click();again(page);pick(page);page.evaluate('finishCopy()')
    check('Late clipboard completion cannot restore old feedback',page.locator('#action-status').inner_text()=='' and not page.locator('#copy-fallback').is_visible())
    # The longest card titles must fit at all supported sample widths.
    for width in [320,360,390,560,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900})
        check(f'No page overflow at {width}px',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        failures=page.evaluate('''(entries)=>{
          const b=document.querySelector('.card.revealed .back'),t=b.querySelector('strong'),old=t.textContent;
          const errors=[];for(const e of entries){t.textContent=e.title;if(b.scrollHeight>b.clientHeight+1||b.scrollWidth>b.clientWidth+1)errors.push(e.id);}
          t.textContent=old;return errors;
        }''',entries)
        check(f'All 412 titles fit card backs at {width}px',not failures)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(OUT/'picker-mobile-result.png'),full_page=True)
    # Exercise PNG download with the twelve heaviest text entries using the actual renderer.
    page.evaluate('''(()=>{window.wooPaint=[];const original=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(t,x,y){window.wooPaint.push({t,x,y,width:this.measureText(t).width});return original.call(this,t,x,y);};})()''')
    longest=sorted(entries,key=lambda e:len(e['title'])+len(e['message'])+len(e['question']),reverse=True)[:12]
    all_ids=[e['id'] for e in entries]
    for i,entry in enumerate(longest):
        again(page)
        page.evaluate('(x)=>localStorage.setItem(x.key,JSON.stringify({schema:1,cycle:1,seen:x.ids.filter(id=>id!==x.keep),recent:[]}))',{'key':KEY,'ids':all_ids,'keep':entry['id']})
        check('Controlled draw of long entry '+entry['id'],pick(page)==entry['id'])
        page.evaluate('wooPaint=[]')
        with page.expect_download() as pending:page.locator('#save').click()
        download=pending.value
        if i==0:download.save_as(str(OUT/'longest-woo.png'))
        painted=page.evaluate('wooPaint')
        check('Complete bounded image text '+entry['id'],all(x['width']<=930 for x in painted) and max(x['y'] for x in painted[:-2])<1170 and ' '.join(x['t'] for x in painted[1:-2])==' '.join([entry['title'],entry['message'],entry['question']]))
    with Image.open(OUT/'longest-woo.png') as im:check('PNG has original 1080x1350 size',im.size==(1080,1350))
    # Reset confirmation, cancellation, unrelated data, and deliberate fresh history.
    page.evaluate("localStorage.setItem('unrelated-test-key','keep')")
    page.locator('.woo-about>summary').click();page.locator('#reset-history').click()
    check('Reset defaults focus to keeping history',page.evaluate("document.activeElement.id==='keep-history'"))
    page.keyboard.press('Escape')
    check('Escape cancels reset',not page.locator('#reset-confirm').is_visible() and page.evaluate('(k)=>localStorage.getItem(k)!==null',KEY))
    page.locator('#reset-history').click();page.locator('#confirm-reset').click()
    check('Confirmed reset removes only Woo history',page.evaluate('(k)=>localStorage.getItem(k)===null&&localStorage.getItem("unrelated-test-key")==="keep"',KEY))
    page.emulate_media(reduced_motion='reduce')
    check('Reduced motion disables card flips animation',page.locator('.inner').first.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s')
    # No JavaScript and failed-library states remain usable and honest.
    nojs=browser.new_context(reduced_motion='reduce',java_script_enabled=False);np=nojs.new_page();ready(np,js=False)
    check('No-JS fallback reflection is readable',np.locator('#picker-fallback').is_visible() and np.locator('#cards button:disabled').count()==3)
    broken=browser.new_context(reduced_motion='reduce');bp=broken.new_page();ready(bp,failed=True);bp.wait_for_function("document.getElementById('load-status').textContent.includes('could not load')")
    check('Library failure leaves a useful fallback',bp.locator('#picker-fallback').is_visible() and bp.locator('.card:disabled').count()==3)
    blocked=browser.new_context(reduced_motion='reduce');pp=blocked.new_page();ready(pp,blocked=True);block_ids=[]
    for i in range(12):
        if i:again(pp)
        block_ids.append(pick(pp))
    check('Storage-blocked browser still has 12 distinct picks',len(set(block_ids))==12)
    check('Storage-blocked limitation is visible','open page only' in pp.locator('#history-status').inner_text())
    # This content remains text, even if the local JSON contains markup-like strings.
    injected=browser.new_context(reduced_motion='reduce');ip=injected.new_page()
    injected_data={'schema':1,'entries':[{'id':'safe-a','theme':'Test','title':'<script>window.bad=true</script>','message':'<img src=x onerror=alert(1)>','question':'Plain text?'},{'id':'safe-b','theme':'Test','title':'<script>window.bad=true</script>','message':'<img src=x onerror=alert(1)>','question':'Plain text?'}]}
    ready(ip,data=injected_data);pick(ip)
    check('Content is rendered as text, never injected markup',ip.locator('#result script,#result img').count()==0 and not ip.evaluate('Boolean(window.bad)'))
    check('No JavaScript runtime errors',not errors)
    check('UI attempted no external requests in offline fixture',not requests)
    check('Library is fetched once per visit, not once per pick',page.evaluate('__wooFetchCount')==2)
    browser.close()
report={'checks_passed':len(checks),'checks':checks,'artifact_directory':str(OUT),'scope':'Offline Chromium with production scripts, CSS and library. Fetch, storage and locks are explicit adapters. Native persistent storage and native cross-tab behavior require live browser verification; not a formal accessibility audit.'}
(OUT/'browser-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
