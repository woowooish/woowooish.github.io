'use strict';

function emailDraft(subject, message) {
  return 'mailto:woowooish@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
}

function prepareDraft(formId, subject, message) {
  const link = document.getElementById(formId + '-draft');
  link.href = emailDraft(subject, message);
  link.hidden = false;
  document.getElementById(formId + '-status').textContent = 'Your draft is ready. Open it below and send it from your email app.';
  link.focus();
}

const newsletter = document.getElementById('newsletter-form');
newsletter.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!newsletter.reportValidity()) return;
  const email = newsletter.elements.email.value.trim();
  prepareDraft('newsletter-form', 'Join the Tide — interest list request',
    'Aloha Annie!\n\nI would love to hear about Woowooish reflections, practices and future gatherings. Please let me know when the Tide newsletter is ready and how to subscribe. My email address is: ' + email + '\n\nThank you!');
});

const contact = document.getElementById('contact-form');
contact.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!contact.reportValidity()) return;
  const name = contact.elements.name.value.trim();
  const email = contact.elements.email.value.trim();
  const message = contact.elements.message.value.trim();
  if (!name || !message) {
    document.getElementById('contact-form-status').textContent = 'Please include your name and a message.';
    return;
  }
  prepareDraft('contact-form', 'Aloha from ' + name,
    message + '\n\nFrom: ' + name + '\nReply to: ' + email);
});

for (const form of [newsletter, contact]) {
  form.addEventListener('input', function () {
    document.getElementById(form.id + '-draft').hidden = true;
    document.getElementById(form.id + '-status').textContent = '';
  });
}

for (const link of document.querySelectorAll('[data-interest]')) {
  link.addEventListener('click', function () {
    const title = link.dataset.interest;
    contact.elements.message.value = 'Aloha Annie! I like the idea of ' + title.toLowerCase() + '. Please keep me in mind when you are planning a gathering and let me know if there are any updates. Thank you!';
    document.getElementById('contact-form-draft').hidden = true;
    document.getElementById('contact-form-status').textContent = 'Tell Annie you’re interested below. There is no scheduled event or booking yet.';
    contact.elements.name.focus({ preventScroll: true });
  });
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
