'use strict';
const wooData={
relationships:{label:'♡ Relationships',title:'Let people be who they are.',reflection:'An orchid doesn’t need to become a rose to be beautiful. You can appreciate someone as they are while still honoring what you need in a relationship. Acceptance and boundaries can coexist.',question:'What am I wishing were different, and what is actually within my control?',practice:'Take three slow breaths. Name one thing you appreciate and one boundary or need that matters to you.'},
peace:{label:'🌊 Finding peace',title:'You can arrive in this moment.',reflection:'Peace doesn’t require everything around you to be perfect. Sometimes it begins when you stop arguing with the moment you’re already in.',question:'What can I soften my grip on, just for today?',practice:'Unclench your jaw, relax your shoulders, and notice five things you can see.'},
growth:{label:'🌱 Personal growth',title:'Growth can be gentle.',reflection:'You don’t have to reinvent yourself overnight. Becoming more aware of one old pattern is already a meaningful beginning.',question:'What is one response I could choose differently next time?',practice:'Write down one thing you learned recently, without turning it into a demand to improve.'},
overthinking:{label:'☁️ Overthinking',title:'A thought is not a command.',reflection:'Your mind can offer possibilities, worries, and stories. You don’t have to solve every one of them right now.',question:'What do I know for certain, and what am I only imagining?',practice:'Place both feet on the floor. Breathe out slowly for a little longer than you breathe in, three times.'},
spirituality:{label:'✨ Exploring spirituality',title:'Your Woo. Your way.',reflection:'For some people, Woo is meditation. For others, it’s nature, prayer, curiosity, or a quiet cup of tea. You get to explore without needing a label.',question:'What helps me feel most connected, curious, or alive?',practice:'Choose one ordinary moment today and give it your full attention for sixty seconds.'},
curious:{label:'☀️ Just curious',title:'Wonder is enough.',reflection:'You don’t need a big breakthrough to begin. A small question, a new perspective, or a moment of noticing can open a door.',question:'What might I discover if I approached today with curiosity instead of judgment?',practice:'Notice something beautiful you would normally walk right past.'}
};

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
const choices=document.getElementById('wyw-choices'),result=document.getElementById('wyw-result');
let active=null,category=null;
const follow=document.createElement('section');follow.id='wyw-follow';follow.className='wyw-hidden';follow.setAttribute('aria-label','Choose what resonates');follow.innerHTML='<h2 style="font-family:Georgia,serif;font-weight:500;font-size:clamp(29px,4vw,43px)">What feels closest to you?</h2><p style="color:#46606b">Choose what resonates. There is no wrong answer.</p><div id="wyw-follow-options" class="wyw-grid"></div><button id="wyw-back" class="wyw-action secondary" type="button">← All categories</button>';
choices.after(follow);
function showResult(entry){
 active={title:entry[1],reflection:entry[2],question:entry[3],practice:entry[4]};
 document.getElementById('wyw-label').textContent=wooData[category].label+' · '+entry[0];
 document.getElementById('wyw-title').textContent=active.title;
 document.getElementById('wyw-reflection').textContent=active.reflection;
 document.getElementById('wyw-question').textContent=active.question;
 document.getElementById('wyw-practice').textContent=active.practice;
 document.getElementById('wyw-status').textContent='';
 follow.classList.add('wyw-hidden');result.classList.remove('wyw-hidden');
 result.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[data-woo]').forEach(button=>button.addEventListener('click',()=>{
 category=button.dataset.woo;if(!paths[category])return;
 const options=document.getElementById('wyw-follow-options');options.replaceChildren();
 paths[category].forEach(entry=>{
 const b=document.createElement('button');b.type='button';b.className='wyw-choice';
 b.style.minHeight='100px';b.textContent=entry[0];b.addEventListener('click',()=>showResult(entry));options.appendChild(b);
 });
 choices.classList.add('wyw-hidden');result.classList.add('wyw-hidden');follow.classList.remove('wyw-hidden');
 follow.scrollIntoView({behavior:'smooth',block:'start'});
}));
document.getElementById('wyw-back').addEventListener('click',()=>{
 follow.classList.add('wyw-hidden');choices.classList.remove('wyw-hidden');choices.querySelector('button').focus();
});
document.getElementById('wyw-another').addEventListener('click',()=>{
 result.classList.add('wyw-hidden');follow.classList.remove('wyw-hidden');follow.querySelector('button').focus();
});
document.getElementById('wyw-copy').addEventListener('click',async()=>{
 if(!active)return;
 const content=[active.title,active.reflection,active.question,'Try this: '+active.practice,'🤍 WooWooish'].join('\\n\\n');
 try{await navigator.clipboard.writeText(content);document.getElementById('wyw-status').textContent='Copied to clipboard 🤍';}
 catch{document.getElementById('wyw-status').textContent='Copy unavailable in this browser.';}
});
