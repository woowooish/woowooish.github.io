"""Local browser verification. Requires playwright, bs4 and Chromium.
Run: python scripts/check-woo-browser.py
Only synthetic picks are used. Existing analytics requests are blocked.
"""
from pathlib import Path
import asyncio, json, os, shutil, tempfile, re
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('WOO_TEST_OUTPUT') or tempfile.mkdtemp(prefix='woo-picker-browser-'))
OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,condition):
    if not condition: raise AssertionError(name)
    checks.append(name)
html=(ROOT/'pick-your-woo.html').read_text()
soup=BeautifulSoup(html,'html.parser')
check('Exactly three native card buttons',len(soup.select('#cards button.card'))==3)
check('Covers retain their names',all(x in html for x in ['The Sunbeam','The Moonlight','The Wildflower']))
check('No duplicate element IDs',len(soup.select('[id]'))==len({x['id'] for x in soup.select('[id]')}))
check('Sharing metadata remains portrait-free','woowooish-share-20261006.png' in str(soup.select_one('meta[property="og:image"]')))
check('No authored em dash in picker source','\u2014' not in html)
check('No network/storage handling added to UI',not re.search(r'\b(fetch|XMLHttpRequest|sendBeacon|localStorage)\b',(ROOT/'assets/woo-picker.js').read_text()))
check('New core makes no network requests',not re.search(r'\b(fetch|XMLHttpRequest|sendBeacon)\b',(ROOT/'assets/woo-deck.js').read_text()))
# Inline the exact production assets. This sandbox disallows all page navigation.
# Storage/lock platform boundaries are simulated here; their algorithms also have Node tests.
shim = """<script>
window.__wooTestValues = window.__wooTestValues || new Map();
Object.defineProperty(window,'localStorage',{configurable:true,get(){
 if(window.__storageMode==='blocked')throw Error('blocked');
 return {getItem:key=>window.__wooTestValues.get(key)??null,
 setItem:(key,value)=>{if(window.__storageMode==='quota')throw Error('quota');window.__wooTestValues.set(key,value)},
 removeItem:key=>window.__wooTestValues.delete(key)};
}});
window.__wooLockQueue = Promise.resolve();
Object.defineProperty(navigator,'locks',{configurable:true,value:{request:(name,fn)=>{const task=window.__wooLockQueue.then(fn);window.__wooLockQueue=task.catch(()=>{});return task}}});
</script>"""
rendered=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',html)
rendered=rendered.replace('<head>','<head>'+shim)
# The production CSP is checked separately. Inline fixtures are not a live-origin test.
rendered=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', rendered)
rendered=re.sub(r'<script[^>]*src="https://cloud.umami.is/script.js"[^>]*></script>','',rendered)
for path in ['assets/atomic-store.js','assets/woo-library.js','assets/woo-deck.js','assets/woo-picker.js']:
    rendered=re.sub(r'<script src="/'+re.escape(path)+r'[^"\n]*" defer></script>',lambda m:'<script>'+ (ROOT/path).read_text()+'</script>',rendered)
# The picker script needs the DOM, so move the inlined scripts to the end of the body.
scripts=re.findall(r'<script>.*?</script>',rendered,re.S)
rendered=re.sub(r'<script>.*?</script>','',rendered,flags=re.S)
rendered=rendered.replace('</body>',''.join(scripts)+'</body>')
rendered=re.sub(r'<link rel="stylesheet" href="/assets/woo-picker.css[^"\n]*">',lambda m:'<style>'+ (ROOT/'assets/woo-picker.css').read_text()+'</style>',rendered)
async def block_external(route):
    await route.abort()
async def ready(page):
    await page.set_content(rendered)
    await page.wait_for_function("!document.querySelector('.card').disabled")
async def draw(page, index=0):
    await page.locator('.card').nth(index).click()
    await page.wait_for_function("document.getElementById('result').dataset.wooId")
    return await page.locator('#result').get_attribute('data-woo-id')
async def run():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        context=await browser.new_context(viewport={'width':1440,'height':1050},reduced_motion='reduce',accept_downloads=True)
        await context.route('**/*',block_external)
        errors=[];page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        await ready(page)
        check('412-entry client library loaded',await page.evaluate('WooLibrary.entries.length')==412)
        check('History empty before first click',await page.evaluate('localStorage.getItem(WooDeck.storageKey)') is None)
        check('Cards have no preassigned message',await page.locator('.back strong').all_text_contents()==['A little reminder']*3)
        for width in [320,360,390,560,768,1024,1440]:
            await page.set_viewport_size({'width':width,'height':1000})
            check(f'No initial overflow at {width}px',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        await page.evaluate('window.scrollTo(0,0)')
        await page.screenshot(path=str(OUT/'picker-desktop.png'),full_page=True)
        first=await draw(page)
        check('Click updates result and history',await page.evaluate('JSON.parse(localStorage.getItem(WooDeck.storageKey)).seen.length')==1)
        before=await page.evaluate('localStorage.getItem(WooDeck.storageKey)')
        await page.locator('#again').click()
        check('Reset neither consumes a Woo nor erases history',await page.evaluate('localStorage.getItem(WooDeck.storageKey)')==before)
        second=await draw(page,0)
        check('Same cover, same day gives a different Woo',first!=second)
        await ready(page);third=await draw(page,2)
        check('Reload retains previous pick exclusion',third not in [first,second])
        await page.set_viewport_size({'width':390,'height':844})
        check('Mobile result fits screen',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        await page.evaluate('window.scrollTo(0,0)')
        await page.screenshot(path=str(OUT/'picker-mobile-result.png'),full_page=True)
        check('Focus moves to the selected Woo heading',await page.evaluate("document.activeElement.id==='woo-title'"))
        await page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.savedCopy=text}}})")
        await page.locator('#share').click()
        check('Successful copy includes the displayed Woo',await page.evaluate("window.savedCopy.includes(document.getElementById('woo-title').textContent)"))
        await page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}})")
        await page.locator('#share').click()
        check('Denied clipboard exposes labelled manual-copy field',await page.locator('#manual-copy').is_visible() and bool(await page.locator('#copy-text').input_value()))
        await page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{const error=Error('cancel');error.name='AbortError';throw error}})")
        await page.locator('#share').click()
        check('Native share cancellation is not misreported', 'cancelled' in await page.locator('#action-status').inner_text())
        with_download=page.expect_download()
        async with with_download as info: await page.locator('#save').click()
        download=await info.value
        await download.save_as(str(OUT/'saved-woo.png'))
        check('Save produces named PNG',download.suggested_filename.endswith('.png') and (OUT/'saved-woo.png').read_bytes()[:8]==b'\x89PNG\r\n\x1a\n')
        await page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(r=>{window.finishCopy=r})}})")
        await page.locator('#share').click();await page.locator('#again').click();await draw(page,1);await page.evaluate('window.finishCopy()')
        check('Old clipboard result cannot overwrite new Woo status',await page.locator('#action-status').inner_text()=='')
        await page.locator('#again').click()
        count_before=await page.evaluate('JSON.parse(localStorage.getItem(WooDeck.storageKey)).seen.length')
        await page.evaluate("document.querySelectorAll('.card').forEach(card=>{card.click();card.click()})")
        await page.wait_for_function("document.getElementById('result').dataset.wooId")
        check('Rapid clicks consume exactly one message',await page.evaluate('JSON.parse(localStorage.getItem(WooDeck.storageKey)).seen.length')==count_before+1)
        # All UI draws, the daily exhaustion path, and every save-image text layout.
        await page.evaluate('localStorage.removeItem(WooDeck.storageKey)');await ready(page)
        records=await page.evaluate('''async () => {
          const result = document.getElementById('result'); const ids=[]; const textProblems=[];
          const originalFill=CanvasRenderingContext2D.prototype.fillText;
          CanvasRenderingContext2D.prototype.fillText=function(text,x,y){
            const width=this.measureText(text).width;
            if(x-width/2<70 || x+width/2>1010 || y<75 || y>1275)textProblems.push({text,x,y,width});
            return originalFill.apply(this,arguments);
          };
          HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)};
          const wait=async test=>{for(let n=0;n<1000;n++){if(test())return;await new Promise(r=>setTimeout(r,0));}throw Error('UI timeout');};
          for(let i=0;i<WooLibrary.entries.length;i++){
            document.querySelectorAll('.card')[i%3].click();await wait(()=>result.dataset.wooId);
            ids.push(result.dataset.wooId);document.getElementById('save').click();await wait(()=>!document.getElementById('save').disabled);
            document.getElementById('again').click();
          }
          document.querySelector('.card').click();await wait(()=>!document.getElementById('picker-status').textContent.includes('Choosing'));
          return {ids,textProblems,status:document.getElementById('picker-status').textContent};
        }''')
        check('412 real UI draws have no repeats',len(records['ids'])==412 and len(set(records['ids']))==412)
        check('All 412 saved-image text layouts stay inside border',not records['textProblems'])
        check('UI refuses same-day repeat after exhaustion','explored all 412 Woos today' in records['status'])
        await ready(page)
        await page.locator('.card').nth(1).click()
        check('Exhaustion survives reload','explored all 412 Woos today' in await page.locator('#picker-status').inner_text())
        # Longest entry, including its flipped card, on narrow screens.
        await page.evaluate('''() => {
          const all=WooLibrary.entries;const long=all.reduce((a,b)=>a.title.length+a.body.length+a.question.length>b.title.length+b.body.length+b.question.length?a:b);
          const rest=all.filter(e=>e.id!==long.id).map(e=>e.id);
          localStorage.setItem(WooDeck.storageKey,JSON.stringify({schema:1,seen:rest,day:WooDeck.localDay(new Date()),today:[],last:rest[0],cycles:0}));
        }''')
        await ready(page);await draw(page)
        for width in [320,360,390,768,1440]:
            await page.set_viewport_size({'width':width,'height':1050})
            check(f'Longest entry fits at {width}px',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            check(f'Flipped title fits card at {width}px',await page.locator('.card.revealed .back strong').evaluate('(e)=>e.scrollHeight<=e.parentElement.clientHeight-20 && e.scrollWidth<=e.parentElement.clientWidth'))
        await page.evaluate('window.scrollTo(0,0)')
        await page.screenshot(path=str(OUT/'longest-woo.png'),full_page=True)
        check('Reduced-motion card has no transition',await page.locator('.inner').first.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s')
        check('No browser JavaScript exceptions',not errors)
        for kind,mode in [('blocked storage','blocked'),('write quota','quota')]:
            ctx=await browser.new_context(reduced_motion='reduce');await ctx.route('**/*',block_external)
            pg=await ctx.new_page();await pg.evaluate('(mode)=>window.__storageMode=mode',mode)
            await ready(pg);x=await draw(pg);await pg.locator('#again').click();y=await draw(pg)
            check(kind+' is disclosed and repeat-safe within page',x!=y and 'Storage is unavailable' in await pg.locator('#picker-status').inner_text())
            await ctx.close()
        nojs=await browser.new_context(java_script_enabled=False);await nojs.route('**/*',block_external)
        np=await nojs.new_page();await np.set_content(rendered)
        check('No-JS fallback stays readable',await np.locator('#fallback-woo').is_visible())
        check('No-JS cards do not pretend to work',await np.locator('.card:disabled').count()==3)
        await np.locator('.how-it-works summary').click()
        check('No-JS privacy explanation is accessible',await np.locator('.explanation').is_visible())
        await browser.close()
    report={'checks_passed':len(checks),'status':'PASS','checks':checks,'browser':'local Chromium','limitations':'Offline inlined production assets; browser storage and lock platform APIs are simulated because sandbox navigation is blocked. Not an all-browser or formal accessibility audit. Live deployment verified separately.'}
    (OUT/'browser-results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
asyncio.run(run())
