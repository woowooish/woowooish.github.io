'use strict';

const preparedDrafts = new Map();

function emailDraft(subject, message) {
  return 'mailto:woowooish@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
}

function prepareDraft(formId, subject, message) {
  preparedDrafts.set(formId, {subject, message});
  const link = document.getElementById(formId + '-draft');
  link.href = emailDraft(subject, message);
  link.hidden = false;
  const panel = document.getElementById(formId + '-copy');
  const field = document.getElementById(formId + '-copy-text');
  const button = document.getElementById(formId + '-copy-button');
  if (panel && field && button) {
    field.value = 'To: woowooish@gmail.com\nSubject: ' + subject + '\n\n' + message;
    panel.hidden = false;
    panel.open = false;
    button.disabled = false;
    button.textContent = canCopyDraft() ? 'Copy draft' : 'Select draft to copy';
  }
  document.getElementById(formId + '-status').textContent = 'Your draft is ready. Open it in your email app, or copy it below to send from your usual email service.';
  link.focus();
}

function canCopyDraft() {
  return typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
}

function clearDraft(formId) {
  preparedDrafts.delete(formId);
  const link = document.getElementById(formId + '-draft');
  link.hidden = true;
  link.href = 'mailto:woowooish@gmail.com';
  const panel = document.getElementById(formId + '-copy');
  const field = document.getElementById(formId + '-copy-text');
  if (panel) { panel.hidden = true; panel.open = false; }
  if (field) field.value = '';
  document.getElementById(formId + '-status').textContent = '';
}

async function copyDraft(formId) {
  const draft = preparedDrafts.get(formId);
  if (!draft) return;
  const field = document.getElementById(formId + '-copy-text');
  const button = document.getElementById(formId + '-copy-button');
  const panel = document.getElementById(formId + '-copy');
  const status = document.getElementById(formId + '-status');
  button.disabled = true;
  let copied = false;
  if (canCopyDraft()) {
    try {
      await navigator.clipboard.writeText(field.value);
      copied = true;
    } catch (_) {
      // Native selection remains available if clipboard access is unavailable.
    }
  }
  if (preparedDrafts.get(formId) !== draft) return;
  button.disabled = false;
  if (copied) {
    status.textContent = 'Draft copied. Paste it into a new email to woowooish@gmail.com, review it and send when you’re ready.';
  } else {
    panel.open = true;
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    status.textContent = 'Draft selected. Use your device’s Copy command, then paste it into a new email to woowooish@gmail.com. Review and send when you’re ready.';
  }
}

const newsletter = document.getElementById('newsletter-form');
if (newsletter) newsletter.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!newsletter.reportValidity()) return;
  const email = newsletter.elements.namedItem('email').value.trim();
  prepareDraft('newsletter-form', 'Join the Tide — interest list request',
    'Aloha Annie!\n\nI would love to hear about Woowooish reflections, practices and future gatherings. Please let me know when the Tide newsletter is ready and how to subscribe. My email address is: ' + email + '\n\nThank you!');
});

const contact = document.getElementById('contact-form');
if (contact) contact.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!contact.reportValidity()) return;
  const name = contact.elements.namedItem('name').value.trim();
  const email = contact.elements.namedItem('email').value.trim();
  const message = contact.elements.namedItem('message').value.trim();
  if (!name || !message) {
    document.getElementById('contact-form-status').textContent = 'Please include your name and a message.';
    return;
  }
  prepareDraft('contact-form', 'Aloha from ' + name,
    message + '\n\nFrom: ' + name + '\nReply to: ' + email);
});

for (const form of [newsletter, contact].filter(Boolean)) {
  form.addEventListener('input', function () {
    clearDraft(form.id);
  });
  const copyButton = document.getElementById(form.id + '-copy-button');
  if (copyButton) copyButton.addEventListener('click', () => copyDraft(form.id));
}

for (const link of document.querySelectorAll('[data-interest]')) {
  link.addEventListener('click', function () {
    if (!contact) return;
    const title = link.dataset.interest;
    contact.elements.namedItem('message').value = 'Aloha Annie! I like the idea of ' + title.toLowerCase() + '. Please keep me in mind when you are planning a gathering and let me know if there are any updates. Thank you!';
    clearDraft('contact-form');
    document.getElementById('contact-form-status').textContent = 'Tell Annie you’re interested below. There is no scheduled event or booking yet.';
    contact.elements.namedItem('name').focus({ preventScroll: true });
  });
}

const motionToggle = document.getElementById('motion-toggle');
if (motionToggle) {
  const reduceMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let userPaused = false;

  function renderMotionPreference() {
    const systemPaused = Boolean(reduceMotion && reduceMotion.matches);
    document.documentElement.classList.toggle('motion-paused', systemPaused || userPaused);
    motionToggle.hidden = systemPaused;
    motionToggle.setAttribute('aria-pressed', String(userPaused));
    motionToggle.textContent = userPaused ? 'Play moving decorations' : 'Pause moving decorations';
  }

  motionToggle.addEventListener('click', function () {
    userPaused = !userPaused;
    renderMotionPreference();
  });
  if (reduceMotion) {
    if (typeof reduceMotion.addEventListener === 'function') reduceMotion.addEventListener('change', renderMotionPreference);
    else if (typeof reduceMotion.addListener === 'function') reduceMotion.addListener(renderMotionPreference);
  }
  renderMotionPreference();
}

const pauseToggle = document.getElementById('pause-toggle');
if (pauseToggle && typeof WoowooishPause !== 'undefined') {
  const timer = WoowooishPause.createTimer();
  const clock = document.getElementById('pause-clock');
  const progress = document.getElementById('pause-progress');
  const reset = document.getElementById('pause-reset');
  const status = document.getElementById('pause-status');
  const steps = [0, 1, 2].map(i => document.getElementById('pause-stage-' + i));
  const prompts = [
    'Minute one: arrive. Feel your feet and the support beneath you.',
    'Minute two: notice. Let your attention rest on one small thing.',
    'Minute three: be kind. What is one kind thing you can offer yourself next?',
  ];
  let interval = null;
  let lastAnnouncement = '';

  function render() {
    const current = timer.snapshot();
    clock.textContent = Math.floor(current.remaining / 60) + ':' + String(current.remaining % 60).padStart(2, '0');
    progress.value = current.elapsed / 1000;
    reset.hidden = current.state === 'idle';
    pauseToggle.textContent = ({idle:'Start my pause ✺', running:'Pause', paused:'Continue my pause', complete:'Take another pause ✺'})[current.state];
    steps.forEach((step, i) => {
      step.classList.toggle('is-current', current.state !== 'idle' && current.state !== 'complete' && current.phase === i);
    });
    const announcement = current.state + ':' + current.phase;
    if (announcement !== lastAnnouncement) {
      status.textContent = current.state === 'running' ? prompts[current.phase]
        : current.state === 'paused' ? 'Paused. Continue whenever you’re ready.'
        : current.state === 'complete' ? 'Your pause is complete. Take one small kindness into the rest of your day.'
        : 'Begin whenever you’re ready.';
      lastAnnouncement = announcement;
    }
    if (current.state !== 'running' && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  pauseToggle.disabled = false;
  pauseToggle.addEventListener('click', function () {
    if (timer.snapshot().state === 'running') timer.pause();
    else timer.start();
    render();
    if (timer.snapshot().state === 'running' && interval === null) interval = setInterval(render, 250);
  });
  reset.addEventListener('click', function () {
    timer.reset();
    render();
    pauseToggle.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', render);
  render();
}

// Submit controls stay disabled in HTML until event handlers are ready.
for (const form of [newsletter, contact].filter(Boolean)) {
  if (typeof form.querySelectorAll === 'function') {
    for (const button of form.querySelectorAll('[type="submit"]')) button.disabled = false;
  }
}
