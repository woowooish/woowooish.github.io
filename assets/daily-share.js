'use strict';
/* Portrait PNG sharing, entirely in the visitor's browser. No SDK, login or upload.
   Prepare before the click: awaiting image/font work inside a click can lose the
   transient user activation that Safari and other browsers require for sharing. */
(function (root) {
  const WIDTH = 1080, HEIGHT = 1350, MARGIN = 88, TEXT_WIDTH = WIDTH - MARGIN * 2;
  const NAVY = '#052453', AQUA = '#c5e9e5';
  const FORMATS = Object.freeze({post: Object.freeze({height: HEIGHT, offset: 0}), story: Object.freeze({height: 1920, offset: 220})});

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

  function drawCard(canvas, content, family = 'Arial, sans-serif', format = 'post') {
    const frame = FORMATS[format];
    if (!frame) throw new Error('Unknown image format');
    canvas.width = WIDTH; canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const fitted = layout(ctx, content, family);
    ctx.fillStyle = '#f8faf7'; ctx.fillRect(0, 0, WIDTH, frame.height);
    // Story content stays between 290 and 1510px, away from the top/bottom app controls.
    ctx.save(); ctx.translate(0, frame.offset);
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
    ctx.lineTo(WIDTH, frame.height - frame.offset); ctx.lineTo(0, frame.height - frame.offset); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8faf7'; ctx.font = '700 32px ' + family;
    ctx.fillText('woowooish.com', MARGIN, 1252);
    ctx.restore();
    return {...fitted, offset: frame.offset, imageHeight: frame.height};
  }

  function deadline(promise, milliseconds) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Image preparation timed out')), milliseconds);
    })]).finally(() => clearTimeout(timer));
  }

  // Kept in this page only: no new browser storage, identifiers or analytics events.
  let preferredFormat = 'story';
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
    function button(className, text) {
      const node = element('button', className, text); node.type = 'button'; return node;
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
      const lead = element('p', 'ww-daily-share-lead', 'The whole reflection, ready to share. No screenshot or caption needed.');
      const body = element('div', 'ww-daily-share-body');
      const figure = element('figure', 'ww-daily-share-figure');
      const preview = element('img', 'ww-daily-share-preview'); preview.hidden = true;
      preview.id = 'daily-share-preview'; preview.width = WIDTH; preview.height = FORMATS[preferredFormat].height;
      preview.alt = 'Share image: ' + content.title + '. Includes the full reflection, question, date and credit shown above.';
      const imageSize = element('figcaption', 'ww-daily-share-size');
      figure.append(preview, imageSize);
      const controls = element('div', 'ww-daily-share-controls');
      const formats = element('fieldset', 'ww-daily-share-formats');
      formats.append(element('legend', '', 'Image shape'));
      const radios = Object.keys(FORMATS).reverse().map(key => {
        const label = element('label');
        const input = element('input'); input.type = 'radio'; input.name = 'daily-image-shape';
        input.value = key; input.id = 'daily-format-' + key; input.checked = key === preferredFormat;
        label.append(input, element('span', '', key === 'story' ? 'Story' : 'Post'));
        formats.append(label); return input;
      });
      const actions = element('div', 'ww-daily-share-actions');
      const share = button('ww-daily-share-primary', 'Preparing image…');
      share.id = 'daily-instagram-share'; share.disabled = true;
      const save = element('a', 'ww-daily-share-save', 'Save image'); save.hidden = true; save.id = 'daily-image-save';
      const help = element('p', 'ww-daily-share-help'); help.id = 'daily-share-help';
      share.setAttribute('aria-describedby', help.id); save.setAttribute('aria-describedby', help.id);
      const feedback = element('p', 'ww-daily-share-status');
      feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
      const extras = element('div', 'ww-daily-share-extras');
      const copy = button('ww-daily-share-caption', 'Copy caption');
      const send = button('ww-daily-share-send', 'Send the words');
      extras.append(copy, send);
      const next = element('div', 'ww-daily-share-next'); next.hidden = true;
      next.append(element('p', '', 'Next: open Instagram and choose the saved image.'));
      const open = element('a', 'ww-daily-share-open', 'Open Instagram ↗');
      open.href = 'https://www.instagram.com/'; open.target = '_blank'; open.rel = 'noopener noreferrer';
      next.append(open);
      const details = element('details', 'ww-daily-share-details'); details.id = 'daily-share-details';
      details.append(element('summary', '', 'Instagram not listed?'));
      details.append(element('p', '', 'Use Save image, then add it in Instagram. For a Story, choose Story in Instagram; the image shape alone does not select a posting destination. You still review and publish there.'));
      details.append(element('p', '', 'On iPhone, a download may be in Files. Open it, then use Share and Save Image to put it in Photos. You can also touch and hold the preview above for your browser’s save options.'));
      details.append(element('p', '', 'Opened this page inside Instagram or Facebook? If sharing or saving is blocked, use that app’s menu to open it in Safari or Chrome, then try again.'));
      details.append(element('p', '', 'Other social apps: use the same image share menu when available, or upload the saved image. Send the words opens a separate text share menu for messaging apps. Not every app accepts every type of content.'));
      const caption = content.title + '\n\n' + content.reflection + '\n\nA question to carry with you: ' + content.question +
        '\n\nOriginal WooWooish reflection, inspired by ' + content.teacher + '. Not a quotation or endorsement.' +
        '\n\nDaily Dose of Woo · ' + content.date + '\nhttps://woowooish.com/daily-woo.html (a fresh reflection each day)';
      const manual = element('textarea', 'ww-daily-share-manual'); manual.hidden = true;
      manual.readOnly = true; manual.rows = 5; manual.value = caption;
      manual.setAttribute('aria-label', 'Full reflection and caption to copy manually');
      actions.append(share, save); controls.append(actions, help, formats, extras, feedback, next);
      body.append(figure, controls); panel.append(heading, lead, body, details, manual); feature.append(panel);

      let active = true, serial = 0, busy = false, preparing = false;
      let selectedFormat = preferredFormat;
      const images = new Map();
      const current = () => active && panel.isConnected;
      const status = text => { if (current()) feedback.textContent = text; };
      dispose = () => {
        active = false; serial++;
        for (const image of images.values()) URL.revokeObjectURL(image.url);
        images.clear(); panel.remove();
      };
      function canShareFile(file) {
        try { return !!file && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({files: [file]}); }
        catch (_) { return false; }
      }
      function sync() {
        if (!current()) return;
        const image = images.get(selectedFormat);
        const native = !!image && canShareFile(image.file);
        radios.forEach(radio => { radio.checked = radio.value === selectedFormat; radio.disabled = busy; });
        // Clearing stale src/href matters if someone switches before this format is ready.
        preview.hidden = !image; save.hidden = !image;
        share.hidden = !!image && !native; share.disabled = busy || (!image && preparing);
        if (image) {
          preview.src = image.url; preview.height = FORMATS[selectedFormat].height;
          save.href = image.url; save.download = image.name;
        } else {
          preview.removeAttribute('src'); save.removeAttribute('href'); save.removeAttribute('download');
        }
        share.textContent = image ? 'Share to Instagram' : preparing ? 'Preparing image…' : 'Try image again';
        save.textContent = native ? 'Save image' : 'Save for Instagram';
        save.classList.toggle('ww-daily-share-primary', !!image && !native);
        imageSize.textContent = selectedFormat === 'story' ? 'Story image · 1080 × 1920' : 'Post image · 1080 × 1350';
        help.textContent = image && !native
          ? 'Save the image in one tap, then add it in Instagram.'
          : 'Choose Instagram or another app in your share menu. You finish sharing there.';
        send.disabled = busy;
        send.hidden = typeof navigator.share !== 'function';
      }
      async function prepare() {
        if (preparing || !current()) return;
        const generation = ++serial;
        preparing = true; sync(); status('');
        try {
          let family = 'Arial, sans-serif';
          if (document.fonts && typeof document.fonts.load === 'function') {
            try {
              await deadline(Promise.all([document.fonts.load('700 76px "Bricolage Grotesque"'), document.fonts.load('400 46px "Bricolage Grotesque"')]), 1500);
              if (document.fonts.check('700 76px "Bricolage Grotesque"')) family = '"Bricolage Grotesque", Arial, sans-serif';
            } catch (_) { /* Sharing remains usable with the local system font. */ }
          }
          // Both sizes are prepared before sharing. A failure in one leaves the other usable.
          const order = [selectedFormat, ...Object.keys(FORMATS).filter(key => key !== selectedFormat)];
          for (const format of order) {
            if (!current() || generation !== serial) return;
            if (images.has(format)) continue;
            try {
              const canvas = document.createElement('canvas'); drawCard(canvas, content, family, format);
              const blob = await deadline(new Promise((resolve, reject) => {
                canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image encoding failed')), 'image/png');
              }), 8000);
              canvas.width = 1; canvas.height = 1;
              if (!current() || generation !== serial) return;
              const slug = content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'reflection';
              const name = 'woowooish-daily-' + slug + '-' + format + '.png';
              let file = null;
              try { file = new File([blob], name, {type: 'image/png'}); } catch (_) { /* Saving still works without File support. */ }
              images.set(format, {file, name, url: URL.createObjectURL(blob)}); sync();
            } catch (_) { /* Report below, keeping any other ready image intact. */ }
          }
        } finally {
          if (current() && generation === serial) {
            preparing = false; sync();
            if (!images.has(selectedFormat)) status('This image could not be prepared. Try again, choose the other shape, or copy the words.');
          }
        }
      }
      function openRecovery(message) {
        if (!current()) return;
        details.open = true; status(message);
        // No automatic download after failure or cancellation. Save stays an explicit choice.
      }
      function sharePayload(payload, imageShare) {
        if (!current() || busy) return;
        busy = true; sync(); status('Choose an app, then finish sharing there.');
        let operation;
        try { operation = navigator.share(payload); } catch (error) { operation = Promise.reject(error); }
        Promise.resolve(operation).then(() => {
          status('The share menu has closed. Finish in the app you chose; publishing is not confirmed here.');
        }).catch(error => {
          if (error && error.name === 'AbortError') status('Sharing was cancelled or no app was available. Your Woo is still here.');
          else if (imageShare) openRecovery('This browser could not share the image. Save it instead, then add it in Instagram.');
          else openRecovery('This browser could not send the words. Use Copy caption, then paste them into your message.');
        }).finally(() => { busy = false; sync(); });
      }
      share.addEventListener('click', () => {
        if (!current() || busy) return;
        const image = images.get(selectedFormat);
        if (!image) { prepare(); return; }
        if (!canShareFile(image.file)) {
          sync(); openRecovery('Image sharing is unavailable. Use Save for Instagram instead.'); return;
        }
        // No font/image awaits, clipboard operation or popup before native sharing.
        // Sending only the PNG avoids filtering out image-only app targets.
        sharePayload({files: [image.file]}, true);
      });
      save.addEventListener('click', event => {
        if (!current() || !images.has(selectedFormat)) { event.preventDefault(); return; }
        next.hidden = false;
        status('Image download requested. Choose the saved image in Instagram; nothing is posted automatically.');
      });
      radios.forEach(radio => radio.addEventListener('change', () => {
        if (!radio.checked || busy || !current()) return;
        selectedFormat = radio.value; preferredFormat = selectedFormat;
        next.hidden = true; status(''); sync();
        if (!images.has(selectedFormat) && !preparing) prepare();
      }));
      async function copyWords(source) {
        if (source.disabled || !current()) return;
        source.disabled = true;
        try {
          if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(caption); status('Words copied. Paste them into your caption or message.');
        } catch (_) {
          if (current()) { manual.hidden = false; manual.focus(); manual.select(); status('Select Copy on your device to copy these words.'); }
        } finally { if (current()) source.disabled = false; }
      }
      copy.addEventListener('click', () => copyWords(copy));
      send.addEventListener('click', () => {
        if (busy || !current()) return;
        if (typeof navigator.share !== 'function') { copyWords(send); return; }
        // The full text travels with the message, not only a link that changes tomorrow.
        sharePayload({text: caption}, false);
      });
      sync(); prepare();
    }
    new MutationObserver(refresh).observe(today, {childList: true});
    refresh();
  }
  const api = Object.freeze({wrapLines, layout, drawCard, WIDTH, HEIGHT, FORMATS});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WooDailySharing = api;
  if (typeof document !== 'undefined') init();
})(typeof window !== 'undefined' ? window : globalThis);
