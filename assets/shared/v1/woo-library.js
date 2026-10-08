/* Original WooWooish editorial. Prefix and row number together form a permanent ID. */
(function (root) {
  "use strict";
  const groups = [
    ["original", "The original collection", `
01|You are already enough.|You don't need to become someone else to deserve love, rest, or joy.|Where can you stop trying to prove yourself today?
02|Let the unknown be open.|Not knowing what comes next doesn't mean you're on the wrong path.|What possibility could you make room for?
03|Come back to this moment.|There is something beautiful here, even if today feels ordinary.|What small thing can you appreciate right now?
04|Softness is strength.|You can hold a boundary and still keep your heart open.|Where can you be both gentle and clear?
05|You are allowed to begin again.|A new chapter doesn't require a perfect ending to the last one.|What's one tiny fresh start available today?
06|Your pace is yours.|You don't have to rush your becoming. Growth can be quiet.|What would moving at your own pace look like?
07|Love can start within.|Offer yourself some of the warmth you so freely give away.|What would kindness toward yourself sound like?
08|You can feel it all.|Joy and grief can exist together. Neither cancels the other.|What feeling needs room instead of fixing?
09|Notice the good.|The smallest moments often carry the most peace.|What made you smile, even briefly, today?
10|Release the grip.|You can care deeply without controlling the outcome.|What might you gently loosen your hold on?
11|Rest is part of the journey.|You don't need to earn a moment of stillness.|How could you give yourself permission to pause?
12|Trust your own wisdom.|You can listen to others and still hear your own inner voice.|What do you already know deep down?
`],
    ["ordinary-wonder", "Ordinary wonder", `
01|The cup has a history.|A familiar object can hold years of ordinary company.|What detail on something nearby have you stopped seeing?
02|Light needs no caption.|A patch of afternoon light can be lovely without becoming a photograph.|What could you enjoy without recording it?
03|A small overlooked color.|There may be a shade in your surroundings you have never named.|Which color deserves a second look?
04|Let the leaf be enough.|Not everything beautiful needs to stand for something else.|What can you appreciate without interpreting it?
05|The window is a beginning.|You do not need a remarkable destination to look with curiosity.|What changes when you look outside for a moment?
06|An ordinary kind of magic.|Warm bread, familiar laughter and clean sheets need no grand explanation.|Which ordinary pleasure would you like to notice?
07|Look at the edges.|The corner of a room can be as interesting as its center.|What lives just outside your usual attention?
08|A shadow takes its time.|Light moves without asking you to hurry along with it.|Where can you watch a small change unfold?
09|An unexpected texture.|The weave of a sleeve offers a tiny detail to meet.|What comfortable texture is close at hand?
10|Listen for one thing.|You can attend to one sound without sorting out the whole world.|What sound would you otherwise pass over?
11|A different way around.|A safe, familiar route may offer something new from another angle.|What could you look at from a different position?
12|The familiar can surprise.|Knowing a place well does not mean you have noticed everything.|What is still unfamiliar about somewhere you know?
13|Notice the spaces between.|Sky between branches belongs to the view as much as the branches.|What do you notice in the gaps?
14|Keep the little detail.|A crooked petal can be more memorable than a perfect arrangement.|Which imperfect detail catches your attention?
15|Wonder without a purchase.|You do not need new things to meet your surroundings differently.|What is already here to explore?
16|A sound from the kitchen.|The everyday soundtrack of making food can have its own small charm.|Which ordinary sound feels familiar today?
17|Let the scene continue.|You can watch a moment without needing to improve it.|What would you leave exactly as it is?
18|A second glance is enough.|Noticing does not have to become a serious new practice.|What deserves just one more glance?
19|Small does not mean empty.|An uneventful moment can still contain color, company or comfort.|What is happening inside this ordinary moment?
20|An unfinished description.|You are allowed to enjoy something you cannot quite put into words.|What would you describe by simply pointing?
`],
    ["nature-nearby", "Nature nearby", `
01|A branch goes sideways.|There is room to enjoy a shape that does not follow a straight line.|What unexpected shape can you find nearby?
02|The sky has company.|A passing cloud need not carry a message to hold your interest.|What does the sky look like from where you are?
03|Borrow a little shade.|A comfortable place outside can be an invitation, not a destination.|Where could you pause safely for a moment?
04|The weather is not a mood.|You can enjoy sunshine without being required to feel sunny.|What is the weather doing while you feel as you do?
05|Let a bird be busy.|Another small life can continue its day without your interpretation.|What living thing can you quietly observe from a distance?
06|A plant at the window.|Nature need not arrive as a mountain or an ocean.|What growing thing shares your everyday surroundings?
07|A season in one detail.|A changed leaf or earlier dusk can mark a shift quietly.|What small seasonal change have you noticed?
08|The puddle gets a sky.|An ordinary surface can offer an unexpected reflection.|Where can you safely notice reflected light?
09|Leave it where it belongs.|You can appreciate a beautiful natural thing without taking it home.|What would you enjoy and leave undisturbed?
10|Listen from the doorway.|A moment outdoors can begin without going very far.|What reaches you when you pause near an open door?
11|Roots stay out of sight.|A tree can invite curiosity about what you cannot see.|What question would you like to ask about a nearby plant?
12|A comfortable distance.|Looking at water does not require getting close to its edge.|Where is a safe place to enjoy the view?
13|One leaf among many.|A whole tree can be too much to take in at once.|Which single detail would you like to notice?
14|The wind makes no appointment.|A little movement may arrive in an otherwise still scene.|What is moving around you without your help?
15|A view from your seat.|Wonder does not require a hike or a standing position.|What can you notice from a comfortable seat?
16|The garden is not a contest.|You can appreciate one pot without having a perfect garden.|What small growing thing would you like to tend?
17|A stone without a lesson.|The natural world does not owe us a moral every time.|What could you observe without making it advice?
18|Dusk changes the room.|Outside light can quietly alter a familiar indoor space.|What looks different as the light changes?
19|Make room for another life.|Not disturbing a nest or flower is also a way of caring.|What could you protect by leaving a little space?
20|Remember an outdoor moment.|A remembered place can be available when going out is not.|Which natural detail would you like to picture today?
`],
    ["room-for-feelings", "Room for feelings", `
01|Two things can be true.|You can be pleased about one thing and sad about another.|Which two feelings could share a sentence today?
02|No bright side required.|A difficult feeling does not need a cheerful ending to be heard.|What could you acknowledge without adding a silver lining?
03|Name it loosely.|You do not need the perfect word for your mood.|What description is close enough for now?
04|Not everything needs fixing.|Sometimes a feeling can be met before a solution is proposed.|What would listening to yourself sound like?
05|Joy can be quiet.|Happiness does not have to look like excitement or celebration.|What small contentment would you recognize as joy?
06|Disappointment can sit here.|Wanting a different outcome does not make you ungrateful.|What wish deserves an honest acknowledgment?
07|You may be undecided.|A mixed response is still a real response.|What are you not ready to label yet?
08|Let relief be simple.|Something feeling easier does not require an explanation to everyone.|What has become a little less heavy today?
09|Missing can mean many things.|You may miss a place, a routine or an earlier version of a day.|What do you miss that you rarely name?
10|A feeling is not an assignment.|You do not have to turn every emotion into productive work.|What could you feel without making a project of it?
11|The sigh can stay a sigh.|An ordinary expression does not always need to be investigated.|What can you allow without overexplaining?
12|No ranking required.|You do not have to compare your difficult day with someone else's.|What is true about your experience on its own?
13|A softer description.|You can describe an awkward moment without making it your whole identity.|What happened, without the unkind label?
14|There is room for irritation.|Being annoyed does not cancel your capacity for care.|What would a respectful response to irritation look like?
15|A gentle check-in.|You can ask yourself how things feel without demanding a useful answer.|What comes up when you ask, without rushing?
16|An ordinary answer counts.|Feeling fine, blank or unsure does not make you bad at reflection.|What is your most honest answer right now?
17|Feeling proud is allowed.|You can appreciate an effort without pretending it was effortless.|What did you do that deserves recognition?
18|Let tenderness have a place.|You need not defend being moved by something small.|What touched you more than you expected?
19|A mood can change.|You are not required to stay in the feeling you woke up with.|What feels different from earlier today?
20|You can pause the analysis.|Understanding a feeling and repeatedly interrogating it are not the same task.|What question could you set down for a while?
`],
    ["kindness-in-action", "Kindness in action", `
01|Make the thank-you specific.|Naming the small thing someone did can make gratitude more personal.|What exactly would you like to thank someone for?
02|Leave a little room.|A generous gesture can include letting someone decline it.|Where could you offer something without pressure?
03|The unglamorous kindness.|Replacing the empty roll may be more useful than a grand speech.|What small practical care is available today?
04|A welcome without a test.|Someone does not need to entertain you to deserve a warm greeting.|How could you make an arrival feel easier?
05|Return the borrowed thing.|Care can look like giving something back clean and on time.|What borrowed item could you return thoughtfully?
06|A note with no agenda.|You can send appreciation without asking for anything afterward.|Who might appreciate a simple, specific hello?
07|Let the helper receive.|Someone who often helps may appreciate being asked what would help them.|Whose preferences could you ask about today?
08|Notice the quiet work.|Useful effort is not always the work that gets announced.|What unseen contribution could you acknowledge?
09|The chair pulled closer.|A small adjustment can make room for someone to join.|What would inclusion look like in this setting?
10|Make an offer concrete.|A specific offer can be easier to consider than a vague promise.|What manageable help could you genuinely offer?
11|Care with permission.|What feels helpful to you may not be what someone else wants.|What could you ask before stepping in?
12|A little less friction.|Kindness can mean making the next person's ordinary task easier.|What could you leave ready for someone else?
13|Speak well in absence.|Care includes how you speak about someone when they are not there.|What fair thing could you say about an absent person?
14|The thoughtful follow-through.|A modest promise kept can matter more than an impressive offer forgotten.|Which small commitment would you like to honor?
15|The useful extra minute.|A brief explanation can help someone feel less lost.|Where could you offer clarity without condescension?
16|A kind correction.|You can point out an error without making someone feel small.|How would you want this correction delivered to you?
17|Let generosity be ordinary.|A caring action does not need an audience.|What good thing could remain unannounced?
18|Ask about the small thing.|Remembering an everyday detail can be a form of attention.|What did someone mention that you could ask about?
19|Include your future self.|Setting out what you need later is a quiet act of care.|What could you make easier for yourself tomorrow?
20|Care is allowed to be small.|A thoughtful sentence can be enough for the time you have.|What kindness fits your actual capacity today?
`],
    ["connection", "Connection", `
01|Listen past your reply.|You can let another person's sentence finish before preparing your own.|What might you hear by waiting a little longer?
02|Ask a smaller question.|A simple question can welcome an answer without demanding a confession.|What ordinary question would you genuinely like to ask?
03|Company without performance.|You do not have to be especially interesting to spend time together.|Who feels comfortable to be ordinary around?
04|Different is not distant.|Someone can care about you without sharing every preference.|Where could difference be allowed without becoming a contest?
05|The honest invitation.|A clear plan is often kinder than a vague suggestion to meet someday.|What simple invitation could you actually follow through on?
06|Let a pause belong.|A quiet moment in conversation does not always need filling.|What happens when you leave a little space?
07|Remember how they take it.|A small preference can be a useful thing to remember.|What everyday preference matters to someone you know?
08|Ask before advising.|A person may want company rather than a proposed solution.|Could you ask whether listening or ideas would help?
09|A familiar shared joke.|Connection can live in something wonderfully unimportant.|What small joke or memory still makes you smile?
10|Be glad they told you.|You can receive a story without making a bigger story of your own.|What would a simple acknowledgment sound like?
11|Make the welcome accessible.|A gathering can be shaped around more than the host's preferences.|What might make joining easier for someone else?
12|The brief check-in counts.|A meaningful hello does not need to become a long conversation.|Who could you check on without requiring a quick reply?
13|Let people surprise you.|An old impression does not have to be the only one you allow.|What could you be curious about instead of assuming?
14|An invitation to clarify.|Asking what someone means can be kinder than guessing badly.|Which assumption could you replace with a question?
15|Take their answer seriously.|An offered choice matters more when either answer is genuinely welcome.|Where could you accept a no without bargaining?
16|Share a small discovery.|You can connect through a recipe, a song or a funny-shaped cloud.|What small discovery would you enjoy passing along?
17|Say what mattered.|Someone may not know which part of their presence you appreciated.|What moment with them would you name?
18|A reunion can be simple.|Reconnecting does not require a perfect explanation for the time between.|What would a low-pressure hello look like?
19|Let closeness have a pace.|Trust does not have to grow on a schedule.|What degree of openness feels comfortable today?
20|Attention is a kind of company.|Putting one distraction aside can be a welcome gesture.|What could wait while you are with someone?
`],
    ["boundaries", "Boundaries", `
01|A clear no can be kind.|You can decline a request without attacking the person who asked.|What would a respectful no sound like?
02|Let yes have meaning.|Agreeing is different when it comes from a choice rather than pressure.|What are you genuinely willing to take on?
03|You may ask for time.|An immediate answer is not always the most honest one.|Where could you say that you need to think?
04|Capacity is information.|A full day does not become empty because another request arrives.|What does your actual schedule have room for?
05|Keep one promise smaller.|A manageable commitment can be more useful than an ambitious yes.|What could you offer realistically?
06|An explanation has an ending.|You can give a clear reason without arguing your whole life into acceptance.|What is enough explanation for this situation?
07|Privacy can be ordinary.|Not every personal detail needs to be shared to keep a conversation warm.|What would you prefer to keep to yourself?
08|The invitation is not an obligation.|Being included does not require you to attend every time.|What choice fits your energy and responsibilities?
09|Make room for a preference.|You are allowed to have an opinion about a small everyday choice.|Which preference could you state plainly today?
10|A pause before volunteering.|You can check your own commitments before filling every gap.|What is already yours to do?
11|Return what is not yours.|Caring about a problem does not automatically make you responsible for solving it.|Which responsibility needs a clearer owner?
12|Choose the quieter plan.|An enjoyable day does not have to contain every available activity.|What could you leave out without regret?
13|Keep the ending you agreed.|A meeting or call can finish when its allotted time is done.|What gentle closing sentence would help?
14|Availability is not affection.|You can care about someone without being reachable every minute.|What expectation could you communicate more clearly?
15|Separate urgency from volume.|The loudest request is not always the most important one.|What deserves attention when you consider the actual stakes?
16|Ask for the missing detail.|You can understand a request before consenting to it.|What would you need to know before agreeing?
17|One boundary at a time.|You do not have to redesign every relationship in one day.|What small limit would make today more workable?
18|A change can be communicated.|Discovering that a plan is too much is a reason to speak up early.|What adjustment should you explain rather than silently resent?
19|Protect the quiet hour.|An unclaimed space on the calendar can still have a purpose.|What time would you like to leave unfilled?
20|Kindness includes clarity.|An uncertain maybe can sometimes be less considerate than an honest answer.|What can you answer more directly?
`],
    ["beginnings", "Beginnings", `
01|Start with the first line.|You do not need to know the ending to write a sentence.|What opening is small enough to try?
02|A rough beginning counts.|The first attempt can be useful without being impressive.|What would you do without trying to look skilled?
03|Use the materials here.|You can begin an idea before collecting perfect supplies.|What do you already have that would do?
04|Open the unused notebook.|A blank page is not a demand for a beautiful thought.|What ordinary words could break the blankness?
05|Return without a ceremony.|You can resume something without making a dramatic promise to never stop again.|What would you simply like to pick up?
06|Choose the smallest door.|A tiny action can be a more practical start than an elaborate plan.|What is the easiest honest first step?
07|Let learning be visible.|You are allowed to be seen not knowing how yet.|Where could you ask a beginner's question?
08|A trial is not a vow.|Trying something once does not commit your whole future.|What could you explore as a small experiment?
09|Begin before the label.|You can enjoy making things without deciding what to call yourself.|What would you try without adopting a new identity?
10|Make room for the second try.|An awkward first attempt does not need to be the final verdict.|What would you change in a gentle retry?
11|Start where the page opens.|You do not always have to begin at the beginning of a project.|Which part feels approachable right now?
12|The invitation can be modest.|A fresh start may look like one cleared corner or one answered message.|What small opening is available today?
13|Borrow a simple structure.|You can use a helpful pattern without copying someone else's whole life.|What simple format would make starting easier?
14|Let the plan be provisional.|A first plan can be a starting point rather than a contract.|What are you willing to adjust as you learn?
15|You may begin quietly.|An intention does not need to be announced to count.|What would you like to try without an audience?
16|One useful question first.|Starting can mean finding out what you need to know.|What question would make the next step clearer?
17|Carry less into the start.|You do not have to solve every possible obstacle before acting.|Which concern matters now, and which can wait?
18|The first five minutes.|A short beginning can fit where a grand undertaking cannot.|What could you give a few unhurried minutes?
19|A new way of returning.|You can come back to an old interest with different expectations.|What would make this return kinder than the last attempt?
20|Endings are not prerequisites.|Some beginnings happen while other things remain unfinished.|What could begin alongside what is still unresolved?
`],
    ["change", "Change", `
01|An old fit can change.|Something that once suited you may deserve a fresh look.|What feels different about a familiar choice?
02|Keep one steady thing.|During a change, a small familiar ritual may still be welcome.|Which ordinary habit would you like to keep?
03|You may miss the old.|Welcoming a change does not require disliking what came before.|What would you like to appreciate about the previous chapter?
04|A transition has middles.|You do not have to feel settled the moment something changes.|What is still finding its place?
05|Update the small plan.|New information can invite a revision without making your earlier effort foolish.|What could you adjust with what you know now?
06|Let the room evolve.|Your surroundings can change a little without becoming a whole makeover.|What small rearrangement would feel useful?
07|Notice what remained.|Not everything disappears when one part of life shifts.|What is still here to count on today?
08|An unfamiliar good thing.|A welcome change can still feel strange at first.|What are you getting used to, even if you chose it?
09|Changing your mind is information.|You can explain a revised view without pretending you never held the old one.|What have you learned that changed your perspective?
10|The handoff matters.|Leaving something can include a thoughtful transition for someone else.|What could you pass on with care?
11|A season without a deadline.|Not every adjustment has a clear day when it is finished.|What would a little more patience with this change look like?
12|Keep the useful part.|You can move on from a routine without discarding everything it offered.|What would you like to bring forward?
13|Let the farewell be specific.|Naming what mattered can make a goodbye more personal.|What detail would you like to remember?
14|Different does not mean wrong.|A new rhythm can feel unfamiliar without being a mistake.|What would you like to observe before judging it?
15|Make space before filling it.|An opening does not always need an immediate replacement.|What could remain undecided for now?
16|An adjustment is not a defeat.|You can change an approach without abandoning what matters to you.|What method could change while the intention stays?
17|You can ask for orientation.|Arriving somewhere new does not require already knowing the way.|What would help you feel less lost?
18|A familiar face in change.|You may welcome ordinary company without needing a big conversation.|Who would be comfortable to spend a little time with?
19|Let the story catch up.|You do not have to explain a transition before you understand it yourself.|What can you describe simply as still unfolding?
20|One small marker.|You can acknowledge a change without making it a public event.|How would you like to mark this moment privately?
`],
    ["creativity", "Creativity", `
01|Make the crooked drawing.|A line can be playful without being good at representing anything.|What would you draw without correcting it?
02|Collect an interesting word.|A single word can become a small object of curiosity.|Which word do you enjoy the sound of?
03|Change one ingredient.|Creativity can begin with a modest variation on something familiar.|What safe, simple variation would you like to try?
04|Keep the odd idea.|An idea does not have to be practical to earn a place in your notes.|What unusual thought would you like to save?
05|Let a draft be messy.|A working version does not need to look ready for an audience.|What could you leave unpolished long enough to finish?
06|Make something nobody grades.|You can create without turning it into a measure of your worth.|What would you make just to see it exist?
07|A different opening sentence.|An ordinary event can be told from more than one starting point.|Where else could your story begin?
08|Arrange what you already own.|A few familiar objects can make a new composition.|What would you place together just for pleasure?
09|Give an idea a margin.|Not every blank space needs to be filled immediately.|Where would leaving room improve what you are making?
10|A tiny collection of details.|Interesting scraps can gather before you know what they are for.|What detail would you add to a private collection?
11|Let the rhythm be strange.|You can tap out a pattern without making a song of it.|What small rhythm would you enjoy trying?
12|The imperfect handmade thing.|An uneven edge can remind you that a person made this.|What handmade detail do you appreciate?
13|Try a smaller format.|A large idea might fit into a sentence, a sketch or a short note.|What is the smallest version you could make?
14|Make the title first.|A playful name can be a doorway into an unfinished idea.|What title would make you curious to continue?
15|Keep your own taste company.|You can like something without building a case for its importance.|What do you enjoy simply because you enjoy it?
16|Leave room for revision.|Editing is allowed to change a thing rather than only fix it.|What would you like to try differently in a draft?
17|A constraint can be playful.|Three colors or five words can be enough for an experiment.|What small limit might make creating more interesting?
18|Notice another person's craft.|Careful making can be visible in everyday objects.|What well-made detail would you like to appreciate?
19|Let the idea rest nearby.|You can leave a project open without thinking about it constantly.|What note would help you return later?
20|Share the work honestly.|You can show something as a work in progress rather than a finished masterpiece.|What would you be comfortable sharing as an experiment?
`],
    ["play", "Play", `
01|Take the silly option.|Not every choice needs to prove that you are sensible.|Where is a harmless bit of silliness available?
02|A game with no prize.|You can enjoy playing without improving or winning anything.|What game would be fun even without a score?
03|Make up a small name.|A familiar object can acquire an amusing nickname for no reason.|What would you rename just to make yourself smile?
04|Sing the bit you know.|You do not need the whole song to enjoy a small part.|What tune would you like to hum quietly?
05|Let the joke be gentle.|Playfulness does not need to make someone else the target.|What could be funny without being unkind?
06|Take a playful detour.|A small optional extra can make an ordinary task more enjoyable.|What harmless variation could you add today?
07|A minute of nonsense.|You are allowed a thought that is not trying to be useful.|What imaginary invention would delight you?
08|Rediscover an old delight.|An enjoyment does not have to be new to be worth revisiting.|What small childhood pleasure still appeals to you?
09|Try the unusual combination.|You can be curious about a surprising pairing without declaring it a lifestyle.|What two things would you enjoy putting together?
10|Find a shape in a shape.|A cloud or a crumb can resemble something for a moment.|What does a harmless little shape remind you of?
11|Allow the accidental laugh.|An unplanned funny moment can belong alongside a serious day.|What made you laugh when you were not expecting to?
12|Let fun be unphotographed.|An enjoyable moment can remain yours without proving it happened.|What could you do for the experience alone?
13|A tiny celebration.|Finishing an ordinary task can merit a private little flourish.|What small completion would you like to acknowledge playfully?
14|Make the ordinary theatrical.|Reading a shopping list dramatically can be ridiculous in a welcome way.|What ordinary sentence could use an absurd voice?
15|The wrong hand experiment.|A safe little drawing with your other hand need not look competent.|What happens when doing it well is not the point?
16|Invent a friendly rule.|A harmless game can begin with one simple made-up condition.|What small game could you invent for this room?
17|You can stop while it is fun.|Play does not have to expand into a commitment.|What would you enjoy briefly, without taking it further?
18|Let delight be personal.|You do not need everyone to understand why something amuses you.|What peculiar little thing reliably delights you?
19|A playful question.|An imaginative question can make room for a different sort of conversation.|What would you ask if practical answers were optional?
20|No audience necessary.|You can be playful even when nobody is there to see it.|What would make you smile on your own?
`],
    ["curiosity-and-uncertainty", "Curiosity and uncertainty", `
01|Interesting is a complete response.|You can notice a coincidence without deciding what caused it.|What could you hold as interesting rather than certain?
02|Separate the moment from the meaning.|What happened and what you think it means are different things to consider.|What did you observe before you interpreted it?
03|Let the question breathe.|Not every unanswered question needs an answer today.|Which question could you leave open?
04|Wonder with ordinary explanations.|A practical explanation does not have to spoil your enjoyment of a moment.|What can remain lovely even when it is explainable?
05|A feeling is not proof.|A moment can feel meaningful without establishing a fact about the world.|What feels meaningful to you, without needing to prove anything?
06|Ask what would change your mind.|Curiosity can include making room for an unexpected answer.|What information would you genuinely consider?
07|You may say you do not know.|Uncertainty can be stated plainly without an apology for being human.|Where would an honest not-sure be useful?
08|Keep the possibility gentle.|You can consider an idea without accepting it as a command.|What interpretation could you hold more lightly?
09|Look for the missing context.|A first impression may not contain the whole situation.|What would you like to understand before concluding?
10|The mystery can stay friendly.|You do not have to solve everything that catches your interest.|What would you enjoy wondering about for its own sake?
11|A practical next step.|A meaningful moment can lead to an ordinary, considered action.|What action makes sense even without a cosmic explanation?
12|Curiosity without conversion.|You can learn about an idea without adopting all of it.|What would you like to understand without needing to agree?
13|Notice the assumption.|A familiar explanation can become so automatic that you stop seeing it.|What are you assuming that you could check?
14|Ask a better-sized question.|Some enormous questions become approachable through one specific part.|What smaller question would help you explore this?
15|Leave room for coincidence.|Good timing can feel striking without being an instruction.|What kind action would you choose on its own merits?
16|A second source of perspective.|You can consider another view without surrendering your own judgment.|Whose perspective would add something you have not considered?
17|Not every pattern is a plan.|You can enjoy spotting a resemblance without treating it as destiny.|What pattern interests you as a pattern?
18|Stay interested in the answer.|A real question leaves space for a reply you did not predict.|What would you like to ask without steering the response?
19|The ish leaves room.|You can be spiritually curious and careful about what you claim to know.|Where would a little less certainty feel honest?
20|An open mind has questions.|Being receptive does not mean accepting every explanation offered.|What thoughtful question would you bring to this idea?
`],
    ["appreciation", "Appreciation", `
01|Name the ordinary support.|A working lamp or a dependable chair can quietly help a day along.|What useful thing are you glad is here?
02|Appreciation without obligation.|Being thankful does not mean owing someone unlimited access to you.|What can you appreciate while keeping a clear boundary?
03|One good detail, not a verdict.|A pleasant moment does not have to make the entire day good.|What single detail would you like to keep?
04|Thank the earlier effort.|Something you prepared before may be helping you now.|What did your earlier self make easier?
05|Let receiving be simple.|A thoughtful gesture does not always require an immediate return gesture.|What could you receive with a straightforward thank-you?
06|Notice a skill you use.|Something that now feels ordinary may once have taken practice.|What learned ability do you quietly rely on?
07|A favorite ordinary tool.|A useful object can deserve appreciation without being expensive.|What simple tool makes life easier?
08|Remember who showed you.|An everyday skill may carry the memory of someone teaching it.|Who helped you learn something you still use?
09|Appreciate without comparing.|You can like what is here without checking whether it is the best.|What is enjoyable on its own terms?
10|A meal has many hands.|Food can invite appreciation for the work involved in bringing it to you.|What part of that effort would you like to notice?
11|Thank-you can come later.|It is not always too late to name a kindness that stayed with you.|What past kindness would you still like to acknowledge?
12|The ordinary reliable thing.|Consistency can be easy to overlook because it does not surprise us.|What has quietly been dependable?
13|Give the good moment a name.|A specific memory can be more personal than a general good-day label.|What would you call one pleasant moment from today?
14|Appreciate the repair.|Something mended can carry a different beauty from something untouched.|What useful repair are you glad someone made?
15|Enough gratitude for now.|Appreciation does not have to become an endless list.|What one thing feels honest to name?
16|Notice a considerate detail.|A sign, a handrail or a thoughtful instruction may reflect someone considering others.|What small design choice makes your day easier?
17|Let pleasure stay uncomplicated.|You can enjoy your favorite mug without turning it into a lesson.|What little preference brings you ordinary pleasure?
18|Acknowledge the good intention carefully.|You can appreciate an intention while still explaining what you need.|What can you thank someone for without pretending everything worked?
19|Keep a line you loved.|Someone's own words may deserve to be remembered accurately and with credit.|What phrase would you like to revisit at its source?
20|The day held this too.|A hard day can still have one detail worth remembering.|What would you add without erasing the difficult parts?
`],
    ["self-trust", "Self-trust", `
01|Hear your preference clearly.|A small choice can begin with noticing what you actually like.|What would you choose without guessing everyone else's answer?
02|Check the facts kindly.|You can question your first impression without scolding yourself for having it.|What could you verify before acting?
03|Your experience is information.|What happened last time can help you ask a better question now.|What did you learn from a similar situation?
04|A decision can be modest.|Not every choice needs to define your entire direction.|What decision is only about today?
05|Listen without outsourcing yourself.|Advice can inform your judgment without replacing it.|What part of the decision remains yours to consider?
06|Notice the quiet yes.|Interest does not always announce itself as a burst of excitement.|What keeps drawing a little of your attention?
07|You can request an explanation.|Understanding something is a reasonable need, not an inconvenience.|What would you like someone to explain more plainly?
08|Keep a record of the real.|A specific memory can be fairer than a sweeping judgment about yourself.|What actually happened, in simple terms?
09|Let a preference be small.|Choosing a seat or a song can simply be choosing a seat or a song.|Where could you stop overjustifying a harmless preference?
10|You may revise thoughtfully.|Changing a decision after learning more is not the same as being careless.|What new information deserves consideration?
11|Trust can include a check.|Confidence and careful verification do not have to be opposites.|What useful check would support your next step?
12|Remember a time you learned.|Not knowing now does not erase your history of learning unfamiliar things.|What have you figured out through practice before?
13|Speak at your own volume.|You do not need to imitate confidence to contribute something useful.|What could you say in your natural voice?
14|Ask what matters to you.|A decision can reflect a value without looking impressive from outside.|Which value belongs in this choice?
15|Separate advice from pressure.|Someone's certainty does not automatically make their preference right for you.|What would you decide with a little more room?
16|The pause is part of choosing.|Thinking before replying can be a deliberate action.|What deserves a considered rather than automatic response?
17|A mistake is specific.|One poor choice does not prove that every future choice will be poor.|What can you learn without condemning your whole judgment?
18|Let evidence join intuition.|Your first reaction can be a starting point rather than the only input.|What other information would help you decide?
19|Know what you do not know.|Recognizing a gap can help you choose where to ask for guidance.|Which part needs someone else's expertise?
20|Take your own comfort seriously.|A small discomfort can be worth adjusting without needing a dramatic reason.|What simple change would make this more comfortable?
`],
    ["enoughness", "Enoughness", `
01|An ordinary self is welcome.|You do not have to arrive with a remarkable story.|What would showing up as you are look like?
02|Let the useful version count.|A workable result can meet the need without meeting an imagined ideal.|What is already good enough for its purpose?
03|Your worth is not a receipt.|A list of completed tasks is not a complete description of you.|What matters about you beyond what you finish?
04|Keep something for enjoyment.|An interest does not have to become a business or an achievement.|What would you rather simply enjoy?
05|Enough can be specific.|Knowing what the task needs can keep it from growing without end.|What would finished reasonably look like here?
06|No improvement project today.|You can live a day without redesigning yourself.|What could you let be ordinary about yourself?
07|A smaller portion of plans.|You can want many things without doing all of them this week.|What amount of activity is actually enough?
08|Leave a little unoptimized.|Every corner of life does not need the most efficient arrangement.|What works well enough as it is?
09|You need not win the comparison.|Someone else's strength does not have to become your assignment.|What can you admire without competing?
10|A plain answer can be enough.|You do not need a profound response to every thoughtful question.|What simple answer feels true?
11|Allow the easy choice.|A useful path is not less worthy because it is straightforward.|What could you make easier without guilt?
12|The whole day need not shine.|One meaningful moment can exist inside a mostly ordinary day.|What part of today is enough to appreciate?
13|An unfinished list is a list.|Remaining tasks do not automatically make the day a failure.|What did your time realistically allow?
14|You can stop adding.|A kind gesture or a finished piece may not need another embellishment.|What would you leave complete at this point?
15|Enjoy without earning.|A small pleasant moment need not be a reward for exceptional performance.|What would you enjoy without making it conditional?
16|Make room for average.|Being average at something can still leave plenty of room to enjoy it.|What do you like doing without needing to excel?
17|Let the quiet contribution count.|You do not have to be the most visible person to contribute.|What useful thing did you add quietly?
18|A number is not a person.|One rating or measurement cannot contain your whole experience.|What important detail is missing from the number?
19|Keep the standard humane.|A plan can account for interruptions, limits and ordinary human needs.|What expectation could become more realistic?
20|Enough is allowed to change.|What is manageable on one day may not be manageable on another.|What would enough mean for this particular day?
`],
    ["rest-and-pauses", "Rest and pauses", `
01|Rest does not need applause.|A pause can be worthwhile without producing a story about renewal.|What would simple, unremarkable rest look like?
02|Leave the next minute unclaimed.|You can have a brief gap without assigning it a purpose.|What could wait for one minute?
03|Sit without making a practice.|Taking a seat does not have to become a formal ritual.|Where could you be comfortably still for a moment?
04|A pause between tasks.|Finishing one thing does not require immediately beginning the next.|What would you notice in the gap?
05|Put the tool down.|The object in your hand can sometimes mark a place to stop.|What could you set aside at a reasonable stopping point?
06|No perfect rest required.|An imperfectly quiet room can still offer a place to pause.|What is comfortable enough right now?
07|The evening can get smaller.|You can choose a simpler ending to a busy day.|What could you remove from tonight's plan?
08|Let the hobby stay gentle.|Leisure does not need to become another field of performance.|What would make your downtime less demanding?
09|Pause before the next tab.|Opening another thing is a choice you can briefly notice.|What are you looking for before you click again?
10|A moment without input.|You can leave a small stretch without adding a podcast, post or message.|What does this moment feel like without another layer?
11|Choose a kinder stopping line.|A task can stop at a workable point rather than at exhaustion.|Where is a sensible place to pause?
12|Rest can include company.|Quiet companionship is an option when being alone is not what you want.|Who might enjoy an undemanding moment together?
13|Let the chair support you.|You can notice the ordinary support beneath you without changing your breathing.|What feels comfortably supported right now?
14|An empty space can stay empty.|A cancelled plan does not always need a replacement.|How would you use the opening if you left it open?
15|Lower the volume of the plan.|An activity can sometimes become a shorter, quieter version of itself.|What would a gentler version look like?
16|Keep one evening simple.|You do not need a special occasion to choose fewer demands.|What would a low-effort evening contain?
17|Set a return note.|A small reminder can make it easier to leave work at a pause point.|What should your later self know when returning?
18|You may prefer quiet.|Wanting less stimulation does not require an elaborate explanation.|What could become a little quieter around you?
19|A pause without a result.|You do not have to feel transformed for a break to have happened.|What can you allow without checking whether it worked?
20|The day can close imperfectly.|You can leave some things unfinished while still acknowledging the day is ending.|What is safe to leave until another time?
`],
    ["patience", "Patience", `
01|The kettle has its own time.|Waiting for an ordinary process need not become a contest with the clock.|What could you notice during a brief wait?
02|Practice does not announce itself.|Small repeated efforts can look unremarkable from the inside.|What are you learning through repetition?
03|One question at a time.|You do not have to answer every part of a complicated situation together.|Which part needs your attention first?
04|Give the sentence a moment.|Another person may need a little room to find their words.|Where could you wait without filling in the answer?
05|Slow is sometimes appropriate.|The useful pace depends on what the situation requires.|What deserves careful rather than hurried attention?
06|Let a process have steps.|Wanting the result does not remove the middle parts.|Which step is actually in front of you?
07|A gentle retry.|Repeating a task can include changing how you speak to yourself.|What would make this attempt less punishing?
08|Progress may be specific.|A tiny improvement can be easier to see when you name it precisely.|What is slightly easier than it used to be?
09|Wait without forecasting everything.|A pending answer does not require rehearsing every possible future.|What is known while you wait?
10|There is time to clarify.|A careful question can prevent a rushed misunderstanding.|What needs one more sentence of explanation?
11|An uneven learning curve.|A difficult session does not erase what you understood yesterday.|What part is worth practicing again gently?
12|Let the draft mature slowly.|Some ideas need more than one sitting to find their shape.|What would you like to revisit rather than force?
13|A queue can hold a detail.|An ordinary wait might contain a sound or color worth noticing.|What is available to your senses while you wait safely?
14|Your pace can be considerate.|Taking your time can include communicating with people who are waiting.|What update would help someone understand your timing?
15|Do not grade every minute.|The usefulness of a day does not have to be assessed continuously.|When could you leave the scorekeeping alone?
16|A skill has small parts.|A whole ability may feel daunting while one component is approachable.|Which small part could you practice today?
17|Let the reply arrive.|Sending a message does not require repeatedly checking for its answer.|What would you like to do while the conversation rests?
18|Patient does not mean passive.|You can give something time while still asking necessary questions.|What useful action is available without forcing an outcome?
19|Try a slower reading.|A sentence you skimmed may offer more when read once carefully.|What line would you like to read again?
20|Keep the next step visible.|You do not need the entire route to make the next reasonable move.|What is the nearest clear step?
`],
    ["presence", "Presence", `
01|Meet this exact moment.|An ordinary moment does not need to resemble the one you planned.|What is actually here, rather than what you expected?
02|One thing in your hands.|A familiar task can be met one movement at a time.|What are your hands doing right now?
03|A meal without a verdict.|One bite can be noticed without reviewing the entire meal.|What flavor or texture is comfortable to attend to?
04|Return without scolding.|Noticing that your attention wandered can simply be a place to return.|What would you like to come back to gently?
05|Let the room be specific.|This is not just a room; it has particular light, shapes and sounds.|Which detail makes this place itself?
06|Finish hearing the music.|A favorite song can be more than the background to another task.|What part would you like to listen to more closely?
07|The doorway between things.|Crossing into another space can mark a small change in attention.|What are you leaving, and what are you entering?
08|Notice before naming.|A brief glance can come before deciding whether something is good or bad.|What do you observe before the judgment arrives?
09|The ordinary contact point.|Your feet, chair or sleeve can offer a simple detail to notice.|Which comfortable point of contact is available?
10|Put the phone face down.|A short pause in checking can be a choice, not a rule for the whole day.|What would you give your attention to instead?
11|One sentence heard fully.|You can be present for a small part of a conversation.|What did the person actually say?
12|No special state required.|Noticing can happen while you are distracted or unconvinced.|What can you observe exactly as you feel now?
13|Let the task be the task.|Folding a towel does not have to become a test of how mindful you are.|What simple action is enough on its own?
14|A breath without instructions.|You can let breathing happen naturally without adjusting or measuring it.|What else nearby would you like to notice?
15|Choose where attention rests.|You can move your attention away from something uncomfortable.|What feels neutral or pleasant to notice instead?
16|The moment after finishing.|Completion sometimes passes unnoticed in the rush to continue.|What have you just finished doing?
17|Listen to the ordinary goodbye.|A familiar closing phrase can still carry care.|What would you like to mean when you say goodbye?
18|A little attention for the familiar.|Someone or something reliable can deserve a fresh moment of attention.|What have you been overlooking because it is usually there?
19|Be here without reporting.|An experience need not be narrated while it happens.|What would you like to experience before describing it?
20|Notice what you reached for.|An automatic action can become a small question rather than a self-criticism.|What were you hoping to find?
`],
    ["belonging", "Belonging", `
01|You can arrive quietly.|Joining a space does not require making an entrance.|What would a comfortable arrival look like for you?
02|A place at your own table.|Your preferences can have a place in the life you organize.|What would make your surroundings feel more like yours?
03|Familiarity begins somewhere.|A place that now feels ordinary may once have been completely new.|What helped you feel more at home there?
04|Keep a welcome wide.|People can participate in different ways without being less welcome.|What form of participation could you make room for?
05|You are more than a role.|What you do for others is not the only thing about you.|What part of yourself exists outside your usual roles?
06|An old recipe can connect.|An ordinary practice can carry a memory without recreating the whole past.|What familiar recipe or routine feels meaningful to you?
07|Let a name matter.|Learning how someone wishes to be addressed is a small form of respect.|Whose name or preference could you learn more carefully?
08|Connection need not be constant.|A relationship can include space as well as contact.|What rhythm of connection feels realistic and kind?
09|A room for different stories.|Shared space does not require identical experiences.|What could you listen to without comparing it to yourself?
10|The welcome you needed.|You can offer a modest version of the welcome you once appreciated.|What helped you feel included that you could pass on?
11|A small local familiarity.|Recognizing an ordinary place can be a quiet form of connection.|Which nearby detail has become familiar to you?
12|Let people join imperfectly.|Someone need not know every custom to be treated considerately.|What could you explain warmly to a newcomer?
13|Your interests may differ.|You do not have to enjoy everything your friends enjoy.|What separate interest would you like to keep?
14|A remembered ordinary kindness.|Feeling welcome can begin with a detail rather than a grand gesture.|When did a small action help you feel included?
15|There is room for your accent.|Your natural way of speaking can belong in the conversation.|Where would you like to use your own voice more comfortably?
16|Make one space inviting.|A welcoming corner does not require a perfectly arranged home.|What small detail would make someone comfortable?
17|A seat without a performance.|You can spend time with others without being the one who keeps everything lively.|Where could you let yourself be a quieter participant?
18|Let tradition be considered.|You can value a familiar practice and still ask how it fits now.|What would you preserve, and what would you adapt?
19|Ordinary companionship counts.|Doing separate things nearby can still be a way of being together.|Who might enjoy undemanding company?
20|You can belong and differ.|Agreement on every subject is not the only way to share a space.|What difference could remain without needing to be resolved?
`],
    ["gentle-courage", "Gentle courage", `
01|Ask the small honest question.|Courage can look like admitting that you did not understand.|What would you like to ask again?
02|Say the sincere compliment.|A kind observation can be shared without making it elaborate.|What genuine appreciation have you been keeping to yourself?
03|Try while slightly awkward.|You do not have to feel completely smooth before participating.|What small thing is worth a little awkwardness?
04|Let your answer be truthful.|An ordinary honest answer can be braver than a polished one.|Where could you be a little more straightforward?
05|Request the practical help.|Asking for something specific can give another person a useful way to respond.|What help would actually make a difference?
06|Make room for correction.|Learning that you were mistaken can become an opportunity to revise.|What could you correct without turning it into self-punishment?
07|A modest step outside habit.|Exploration can be small and safe rather than dramatic.|What unfamiliar but manageable thing interests you?
08|Name what you appreciate aloud.|Affection does not need a special occasion to be expressed.|What would you like someone to know you value?
09|Let yourself be a learner.|You can try something while clearly saying that it is new to you.|Where would you like permission to be inexperienced?
10|Apologize for the actual thing.|A useful apology can be specific rather than a speech about being terrible.|What action could you acknowledge and repair?
11|Ask for a different approach.|You can request a change without rejecting everything someone offered.|What adjustment would help you participate?
12|Keep courage proportionate.|A small meaningful step does not need to become a grand transformation.|What would be brave enough for today?
13|Let a caring message be imperfect.|A sincere note does not need to be beautifully phrased to be sent.|What kind words could you send simply?
14|Give the idea a small test.|You can explore whether something works without staking everything on it.|What low-stakes experiment would teach you something?
15|Say you need a moment.|Taking a pause can be more considered than forcing an immediate response.|Where would a moment help you answer honestly?
16|Return to the conversation gently.|An unfinished conversation can sometimes be reopened with a clear, respectful invitation.|What would you like to revisit without forcing a reply?
17|Be specific about the need.|People may understand a concrete request better than a hidden expectation.|What could you ask for plainly?
18|Let the choice be visible.|You can express a preference without making everyone share it.|What would you like to choose openly?
19|A fair word for yourself.|You can describe your own effort without either boasting or minimizing.|What accurate thing could you say about what you did?
20|Choose the considered next step.|Courage can include caution when the consequences matter.|What step respects both your interest and the real risks?
`],
    ["small-rituals", "Small rituals", `
01|Mark the start with a detail.|A cup placed down deliberately can mark the beginning of a task.|What small action would help you begin?
02|The first sip can wait.|You can notice the cup and its warmth before moving on.|What is pleasant about this ordinary pause?
03|A light at day's end.|Switching on a lamp can be a simple marker of evening.|What small signal would welcome a quieter part of the day?
04|Write one line, not a life.|A brief note can hold a moment without explaining the whole day.|What would you put in a single sentence?
05|Leave a kind reminder.|A short message to yourself can be practical rather than inspirational.|What would your later self be glad to remember?
06|A little clearing of space.|Moving one object can create a useful opening without becoming a cleaning project.|What small space would you like to make usable?
07|Choose a closing song.|An ordinary piece of music can mark a stopping point.|What sound would you like to end this task with?
08|A small arrival ritual.|You can greet a familiar space without immediately starting the next demand.|What would help you arrive before doing more?
09|Fold with a little care.|An everyday action can be done considerately without making it ceremonial.|What familiar task could you do a little more gently?
10|Keep a question nearby.|A written question can invite reflection without demanding a scheduled answer.|What question would you leave somewhere you will see it?
11|Set out tomorrow's useful thing.|Preparation can be one object rather than a complete plan.|What could you place where you will need it?
12|The doorway goodbye.|Leaving a place can include one moment of noticing it.|What would you like to appreciate before going?
13|A ritual may be optional.|A missed day does not cancel the meaning of a practice.|What could you enjoy without keeping a streak?
14|Keep the simple version.|A personal ritual can fit the time and resources you actually have.|What is the least elaborate version that still appeals?
15|A moment for the completed task.|You can mark finishing without adding another task to the end.|What would a small acknowledgment of completion look like?
16|Let the routine change.|A practice is allowed to become different when your needs change.|What part no longer needs to stay the same?
17|A place for small memories.|A note or a sketch can hold a detail without becoming a polished journal.|What small moment would you like to keep?
18|Make an ordinary transition kind.|A change between activities can include a little care for yourself.|What would make this transition less abrupt?
19|Come back when it suits.|A useful ritual can welcome you without keeping attendance.|What would you like to return to freely?
20|Carry only what is useful.|This Woo is an invitation, not a rule or prediction.|What part would you keep, and what would you leave?
`],
  ];
  const entries = groups.flatMap(([prefix, theme, text]) => text.trim().split('\n').map(line => {
    const [number, title, body, question] = line.split('|');
    return Object.freeze({id: prefix + '-' + number, theme, title, body, question});
  }));
  const catalog = Object.freeze({version: "20261007-412", entries: Object.freeze(entries)});
  if (typeof module === "object" && module.exports) module.exports = catalog;
  else root.WooLibrary = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this);
