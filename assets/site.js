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
  prepareDraft('newsletter-form', 'Join the Tide — newsletter request',
    'Aloha Annie!\n\nI would love to join the Tide and receive Woowooish newsletter updates. Please add this email address: ' + email + '\n\nThank you!');
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

for (const link of document.querySelectorAll('[data-gathering]')) {
  link.addEventListener('click', function () {
    const title = link.dataset.gathering;
    contact.elements.message.value = 'Aloha Annie! I am interested in ' + title + '. Could you confirm the date, location and availability? Thank you!';
    document.getElementById('contact-form-draft').hidden = true;
    document.getElementById('contact-form-status').textContent = 'Ask Annie about ' + title + ' below. Your place is confirmed by email.';
    contact.elements.name.focus({ preventScroll: true });
  });
}
