/* Page-only reflection chooser. Public writing, no requests or saved selections. */
(() => {
  'use strict';
  const labels = Object.freeze({relationships: '♡ Relationships', peace: '🌊 Finding peace',
    growth: '🌱 Personal growth', overthinking: '☁️ Overthinking',
    spirituality: '✨ Exploring spirituality', curious: '☀️ Just curious'});
const paths={
relationships:[
['Feeling misunderstood','Being understood starts with listening to yourself.','You can care about someone and still have a different experience from them.','What do I wish they understood about my experience?','Name your feeling and your need in one kind sentence.'],
['Setting boundaries','A kind no is still a no.','Boundaries describe what you will do to care for yourself; they do not require changing another person.','What would respecting myself look like here?','Practice saying: “That doesn’t work for me.”'],
['Letting go','Love and letting go can coexist.','You can appreciate what was meaningful without needing to hold on to what no longer fits.','What am I ready to release, even a little?','Put a hand on your heart and breathe for thirty seconds.'],
['Appreciating differences','An orchid need not become a rose.','People can be different from you without being wrong. Acceptance also leaves room for your own needs.','Can I see this person clearly without trying to remake them?','Notice one quality you genuinely appreciate.']],
peace:[
['Feeling stressed','Begin with the next breath.','You do not have to solve everything in this moment.','What is actually needed in the next five minutes?','Relax your shoulders and breathe out slowly three times.'],
['Feeling unsettled','You can make room for uncertainty.','Not knowing is uncomfortable, but it does not mean you are doing something wrong.','What can remain unanswered today?','Feel your feet against the ground for one minute.'],
['Needing rest','Rest is not a reward.','You are allowed to pause before everything is finished.','What would genuine rest look like for me?','Take a screen-free two-minute break.'],
['Seeking acceptance','Meet this moment as it is.','Acceptance is seeing what is here, not approving of everything that happens.','What am I resisting that I could simply acknowledge?','Name what is true right now without adding a judgment.']],
growth:[
['Breaking old patterns','Awareness creates a choice.','Noticing an old habit is progress, even before you change it.','What usually happens just before this pattern begins?','Write down one trigger and one alternative response.'],
['Building confidence','You can begin before you feel ready.','Confidence often grows from small actions, not certainty.','What tiny brave action is available today?','Do one small thing you have been postponing.'],
['Being kinder to myself','Speak to yourself like someone you love.','Growth does not have to come from criticism.','Would I say this to a friend?','Rewrite one harsh thought with compassion.'],
['Embracing change','You are allowed to evolve.','Change can bring excitement and grief at the same time.','What am I making room for?','Notice one possibility this change creates.']],
overthinking:[
['Worrying about the future','Come back to what is here.','A possible future is not the same as a present fact.','What do I know for certain right now?','Name five things you can see around you.'],
['Replaying a conversation','You can stop rehearsing.','Your mind may revisit a moment to find certainty, but repetition is not always clarity.','Is there an action to take, or a thought to release?','Write down one takeaway, then close the note.'],
['Second-guessing myself','You can choose without perfect certainty.','A thoughtful decision does not require knowing every outcome.','What matters most to me in this choice?','List your top two values and one next step.'],
['Feeling overwhelmed','One thing at a time.','Not every thought needs attention right now.','What is the smallest useful next step?','Set a two-minute timer and focus on one task.']],
spirituality:[
['Meditation','There is no perfect way to begin.','Meditation can be as simple as noticing your breath and returning when your mind wanders.','What happens when I allow this moment to be enough?','Sit quietly and notice five breaths.'],
['Nature and connection','Wonder lives in ordinary things.','The natural world can invite you to slow down and feel connected.','What catches my attention when I really look?','Observe a leaf, cloud, or patch of light for one minute.'],
['Exploring teachings','Curiosity does not require certainty.','Different traditions offer different lenses. You can explore thoughtfully without adopting every claim.','Which idea invites curiosity rather than pressure?','Write down a question you want to explore.'],
['Finding my own path','Your Woo can be your own.','You do not need a label or a teacher to validate what feels meaningful to you.','What practice helps me feel grounded and alive?','Make space for five minutes of that practice today.']],
curious:[
['Something playful','Let wonder lead.','Not every meaningful moment has to be serious.','What would make today a little lighter?','Try something small and new just for fun.'],
['A fresh perspective','There is more than one way to see this.','Curiosity creates space between your first interpretation and other possibilities.','What else might be true?','Name two possible interpretations of one situation.'],
['A moment of gratitude','Notice what is already here.','Gratitude need not erase difficulty; it can sit alongside it.','What small thing supported me today?','Write down one specific moment you appreciated.'],
['Surprise me','Begin with noticing.','Sometimes the most interesting discovery is something you almost overlooked.','What beauty have I walked past lately?','Pause and notice one ordinary detail.']]
};

  // Export public data for dependency-free content and interaction tests.
  if (typeof module !== 'undefined' && module.exports) module.exports = {paths, labels};
  if (typeof document === 'undefined') return;
  const get = id => document.getElementById(id);
  const required = ['wyw-choices', 'wyw-result', 'wyw-follow', 'wyw-follow-title',
    'wyw-follow-options', 'wyw-back', 'wyw-another', 'wyw-copy', 'wyw-label', 'wyw-title',
    'wyw-reflection', 'wyw-question', 'wyw-practice', 'wyw-status', 'wyw-manual-copy', 'wyw-loading'];
  if (!required.every(id => get(id))) return;
  const choices = get('wyw-choices'), result = get('wyw-result'), follow = get('wyw-follow');
  const copy = get('wyw-copy'), manual = get('wyw-manual-copy');
  const buttons = [...choices.querySelectorAll('[data-woo]')];
  let active = null, category = null, categoryButton = null, pathButton = null, revision = 0;
  function invalidate() {
    revision++;
    active = null;
    copy.disabled = false;
    manual.hidden = true;
    manual.value = '';
    get('wyw-status').textContent = '';
  }
  function show(section, focus) {
    [choices, follow, result].forEach(node => { node.hidden = node !== section; });
    focus.focus({preventScroll: true});
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({behavior: reduce ? 'instant' : 'smooth', block: 'nearest'});
  }
  function showResult(entry, trigger) {
    invalidate(); pathButton = trigger;
    active = {title: entry[1], reflection: entry[2], question: entry[3], practice: entry[4]};
    get('wyw-label').textContent = labels[category] + ' · ' + entry[0];
    get('wyw-title').textContent = active.title;
    get('wyw-reflection').textContent = active.reflection;
    get('wyw-question').textContent = active.question;
    get('wyw-practice').textContent = active.practice;
    show(result, get('wyw-title'));
  }
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const value = button.dataset.woo;
      if (!Object.prototype.hasOwnProperty.call(paths, value)) return;
      invalidate(); category = value; categoryButton = button;
      const options = get('wyw-follow-options'); options.replaceChildren();
      paths[category].forEach(entry => {
        const choice = document.createElement('button'); choice.type = 'button';
        choice.className = 'wyw-choice wyw-path-choice'; choice.textContent = entry[0];
        choice.addEventListener('click', () => showResult(entry, choice)); options.append(choice);
      });
      show(follow, get('wyw-follow-title'));
    });
  });
  get('wyw-back').addEventListener('click', () => {
    invalidate(); show(choices, categoryButton || buttons[0]);
  });
  get('wyw-another').addEventListener('click', () => {
    invalidate(); show(follow, pathButton || get('wyw-follow-title'));
  });
  copy.addEventListener('click', async () => {
    if (!active || copy.disabled || result.hidden) return;
    const stamp = revision;
    const content = [active.title, active.reflection, active.question,
      'Try this: ' + active.practice, '🤍 WooWooish'].join('\n\n');
    copy.disabled = true;
    manual.hidden = true; get('wyw-status').textContent = '';
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      if (stamp === revision) get('wyw-status').textContent = 'Reflection copied. Paste it wherever you choose.';
    } catch (_) {
      // Changing paths during a pending copy must not reveal an older reflection.
      if (stamp !== revision || result.hidden) return;
      manual.value = content; manual.hidden = false; manual.focus(); manual.select();
      get('wyw-status').textContent = 'Select Copy on your device to keep these words.';
    } finally { if (stamp === revision) copy.disabled = false; }
  });
  // Show working controls only after every handler is installed.
  buttons.forEach(button => {button.disabled = false;});
  get('wyw-loading').hidden = true;
})();
