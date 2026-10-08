'use strict';
/* Portrait PNG sharing, entirely in the visitor's browser. No SDK, login or upload.
   Prepare before the click: awaiting image/font work inside a click can lose the
   transient user activation that Safari and other browsers require for sharing. */
(function (root) {
  const WIDTH = 1080, HEIGHT = 1350, MARGIN = 88, TEXT_WIDTH = WIDTH - MARGIN * 2;
  const NAVY = '#052453', AQUA = '#c5e9e5';

  function wrapLines(ctx, text, width) {
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      let line = '';
      for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
        const candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        // Also handle a long, unbroken word without clipping or dropping text.
        for (const letter of Array.from(word)) {
          if (line && ctx.measureText(line + letter).width > width) { lines.push(line); line = ''; }
          line += letter;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function layout(ctx, content, family = 'Arial, sans-serif') {
    for (let scale = 1; scale >= 0.28; scale -= 0.02) {
      const specs = [
        [content.title, 76, 700, 1.12, 34],
        [content.reflection, 46, 400, 1.38, 54],
        ['A QUESTION TO CARRY WITH YOU', 20, 700, 1.3, 16],
        [content.question, 42, 600, 1.3, 0]
      ];
      let height = 0;
      const blocks = specs.map(([text, size, weight, leading, gap]) => {
        const fontSize = Math.floor(size * scale);
        const font = weight + ' ' + fontSize + 'px ' + family;
        ctx.font = font;
        const lines = wrapLines(ctx, text, TEXT_WIDTH);
        const block = {font, fontSize, lines, lineHeight: fontSize * leading, gap: gap * scale};
        height += lines.length * block.lineHeight + block.gap;
        return block;
      });
      if (height <= 730) return {blocks, height, startY: 292 + (730 - height) / 2};
    }
    throw new Error('Reflection is too long for this image.');
  }

  function drawCard(canvas, content, family = 'Arial, sans-serif') {
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const fitted = layout(ctx, content, family);
    ctx.fillStyle = '#f8faf7'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#e0f0ed'; ctx.beginPath(); ctx.arc(1010, 70, 305, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = AQUA; ctx.beginPath(); ctx.arc(1040, 45, 220, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = NAVY; ctx.textBaseline = 'top';
    ctx.font = '700 44px ' + family; ctx.fillText('woowooish', MARGIN, 70);
    // A small sun mark is drawn, rather than relying on an emoji font.
    ctx.save(); ctx.translate(947, 118); ctx.strokeStyle = NAVY; ctx.lineWidth = 3;
    for (let n = 0; n < 12; n++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(37, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    ctx.font = '700 22px ' + family; ctx.fillText('DAILY DOSE OF WOO', MARGIN, 174);
    ctx.font = '400 23px ' + family;
    ctx.fillText(content.date, MARGIN, 213);
    let y = fitted.startY;
    fitted.blocks.forEach((block, index) => {
      ctx.font = block.font; ctx.fillStyle = index === 2 ? '#32666a' : NAVY;
      block.lines.forEach(line => { ctx.fillText(line, MARGIN, y); y += block.lineHeight; });
      y += block.gap;
    });
    ctx.strokeStyle = '#b6d7d2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(MARGIN, 1063); ctx.lineTo(WIDTH - MARGIN, 1063); ctx.stroke();
    ctx.fillStyle = '#32666a'; ctx.font = '400 22px ' + family;
    const credits = wrapLines(ctx, 'Original WooWooish reflection. Inspired by ' + content.teacher + '.', TEXT_WIDTH);
    credits.forEach((line, i) => ctx.fillText(line, MARGIN, 1092 + i * 28));
    ctx.font = '400 19px ' + family;
    ctx.fillText('Not a quotation or endorsement.', MARGIN, 1100 + credits.length * 28);
    ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(0, 1202);
    ctx.quadraticCurveTo(300, 1178, 620, 1209); ctx.quadraticCurveTo(850, 1232, WIDTH, 1195);
    ctx.lineTo(WIDTH, HEIGHT); ctx.lineTo(0, HEIGHT); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8faf7'; ctx.font = '700 32px ' + family;
    ctx.fillText('woowooish.com', MARGIN, 1252);
    return fitted;
  }

  function deadline(promise, milliseconds) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Image preparation timed out')), milliseconds);
    })]).finally(() => clearTimeout(timer));
  }

  function init() {
    const today = document.getElementById('daily-today');
    const feature = document.getElementById('daily-feature');
    if (!today || !feature || typeof MutationObserver !== 'function') return;
    let lastArticle = null, dispose = () => {};
    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    }
    function refresh() {
      const article = document.getElementById('daily-current-dose');
      if (article === lastArticle) return;
      dispose(); lastArticle = article;
      if (!article) return;
      const read = selector => article.querySelector(selector)?.textContent.trim() || '';
      const content = {
        title: read('h3'), reflection: read('.ww-daily-reflection'), question: read('.ww-daily-question'),
        teacher: read('.dose-attribution').replace(/^Inspired by\s+/, ''),
        date: (document.getElementById('daily-date')?.textContent || '').replace(/^Today\s*·\s*/, '')
      };
      if (!content.title || !content.reflection || !content.question) return;
      const panel = element('section', 'ww-daily-share');
      panel.setAttribute('aria-label', 'Share this Daily Dose of Woo');
      const heading = element('h3', '', 'Pass a little Woo along.');
      const actions = element('div', 'ww-daily-share-actions');
      const share = element('button', 'ww-daily-share-primary', 'Preparing image…');
      share.id = 'daily-instagram-share'; share.type = 'button'; share.disabled = true;
      const save = element('a', 'ww-daily-share-save', 'Save image'); save.hidden = true;
      save.id = 'daily-image-save';
      const help = element('p', 'ww-daily-share-help', 'Tap Share to Instagram, then choose Instagram in your phone’s share menu. If it is not listed, save the image and add it in Instagram.');
      help.id = 'daily-share-help'; share.setAttribute('aria-describedby', help.id);
      const feedback = element('p', 'ww-daily-share-status');
      feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
      const details = element('details', 'ww-daily-share-details'); details.id = 'daily-share-details';
      const summary = element('summary', '', 'Preview image & Instagram help');
      const preview = element('img', 'ww-daily-share-preview'); preview.hidden = true;
      preview.width = WIDTH; preview.height = HEIGHT;
      preview.alt = 'Share card: ' + content.title + '. The full reflection and question are also available above.';
      const instructions = element('p', '', 'Save the image, then open Instagram and add it to a post, Story or message. On iPhone, a download may go to Files: open it there and choose Share, then Save Image to put it in Photos. You can also touch and hold the preview to see your browser’s save options.');
      const open = element('a', 'ww-daily-share-open', 'Open Instagram ↗');
      open.href = 'https://www.instagram.com/'; open.target = '_blank'; open.rel = 'noopener noreferrer';
      const copy = element('button', 'ww-daily-share-caption', 'Copy caption'); copy.type = 'button';
      const caption = content.title + '\n\n' + content.reflection + '\n\nA question to carry with you: ' + content.question +
        '\n\nOriginal WooWooish reflection, inspired by ' + content.teacher + '. Not a quotation or endorsement.' +
        '\n\nDaily Dose of Woo · ' + content.date + '\nhttps://woowooish.com/daily-woo.html (a fresh reflection each day)';
      const manual = element('textarea', 'ww-daily-share-manual'); manual.hidden = true;
      manual.readOnly = true; manual.rows = 5; manual.value = caption;
      manual.setAttribute('aria-label', 'Caption to copy manually');
      const detailActions = element('div', 'ww-daily-share-actions'); detailActions.append(open, copy);
      details.append(summary, preview, instructions, detailActions, manual);
      actions.append(share, save); panel.append(heading, actions, help, feedback, details); feature.append(panel);
      let active = true, serial = 0, file = null, objectURL = '', busy = false;
      const current = () => active && panel.isConnected;
      const status = text => { if (current()) feedback.textContent = text; };
      dispose = () => {
        active = false; serial++;
        if (objectURL) URL.revokeObjectURL(objectURL);
        panel.remove();
      };
      const fallback = message => {
        if (!current()) return;
        details.open = true; status(message);
      };
      function canShareFile() {
        try { return !!file && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({files: [file]}); }
        catch (_) { return false; }
      }
      async function prepare() {
        const generation = ++serial;
        share.disabled = true; share.textContent = 'Preparing image…';
        try {
          let family = 'Arial, sans-serif';
          if (document.fonts && typeof document.fonts.load === 'function') {
            try {
              await deadline(Promise.all([document.fonts.load('700 76px "Bricolage Grotesque"'), document.fonts.load('400 46px "Bricolage Grotesque"')]), 1500);
              if (document.fonts.check('700 76px "Bricolage Grotesque"')) family = '"Bricolage Grotesque", Arial, sans-serif';
            } catch (_) { /* A local system font keeps sharing usable when fonts fail. */ }
          }
          if (!current() || generation !== serial) return;
          const canvas = document.createElement('canvas'); drawCard(canvas, content, family);
          const blob = await deadline(new Promise((resolve, reject) => {
            canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image encoding failed')), 'image/png');
          }), 8000);
          if (!current() || generation !== serial) return;
          const name = 'woowooish-daily-' + content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.png';
          // File support is not required to save the PNG in older browsers.
          try { file = new File([blob], name, {type: 'image/png'}); } catch (_) { file = null; }
          objectURL = URL.createObjectURL(blob);
          preview.src = objectURL; preview.hidden = false;
          save.href = objectURL; save.download = name; save.hidden = false;
          share.textContent = 'Share to Instagram'; share.disabled = false;
          if (!canShareFile()) help.textContent = 'This browser cannot open an image share menu. Save the image, then add it to a post, Story or message in Instagram.';
          status('');
        } catch (_) {
          if (!current() || generation !== serial) return;
          share.textContent = 'Try image again'; share.disabled = false;
          status('The image could not be prepared. Try again, or take a screenshot of the reflection above.');
        }
      }
      share.addEventListener('click', () => {
        if (!current() || busy) return;
        if (!objectURL) { prepare(); return; }
        if (!canShareFile()) { fallback('Save the image, then upload it in Instagram. Nothing has been posted.'); return; }
        busy = true; share.disabled = true;
        status('Choose Instagram if it is listed, then finish sharing there.');
        // Only the image is sent. Mixing a URL or text with the file can hide
        // image-only targets. Instagram decides what destinations it offers.
        let operation;
        try { operation = navigator.share({files: [file]}); }
        catch (error) { operation = Promise.reject(error); }
        Promise.resolve(operation).then(() => {
          status('The share menu has closed. Finish in Instagram if you selected it. You can also save the image here.');
        }).catch(error => {
          if (error && error.name === 'AbortError') {
            status('Sharing was cancelled or no app was available. You can try again or save the image.');
          } else {
            fallback('This browser could not share the image. Save it instead, then add it in Instagram.');
          }
        }).finally(() => { busy = false; if (current()) share.disabled = false; });
      });
      save.addEventListener('click', () => {
        details.open = true;
        status('The image download has been requested. Add the saved image in Instagram; nothing is posted automatically.');
      });
      copy.addEventListener('click', async () => {
        if (copy.disabled || !current()) return;
        copy.disabled = true;
        try {
          if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(caption); status('Caption copied. Paste it into Instagram when you share.');
        } catch (_) {
          if (current()) { manual.hidden = false; manual.focus(); manual.select(); status('Select Copy on your device to copy this caption.'); }
        } finally { if (current()) copy.disabled = false; }
      });
      prepare();
    }
    new MutationObserver(refresh).observe(today, {childList: true});
    refresh();
  }
  const api = Object.freeze({wrapLines, layout, drawCard, WIDTH, HEIGHT});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WooDailySharing = api;
  if (typeof document !== 'undefined') init();
})(typeof window !== 'undefined' ? window : globalThis);
