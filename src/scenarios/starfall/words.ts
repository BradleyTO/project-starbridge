/**
 * Starfall — the captain's words. Shared by the interpreter rule (which only decides "an order"
 * versus "a question for an officer") and the scenario (which decides what it means).
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

/** The habitat and the person who speaks for it. */
export const KEMBLE_WORD = /\b(kemble|idris|the factor|factor|thistledown|the habitat|habitat)\b/;
/** The company's agent and her yacht. */
export const QUELL_WORD = /\b(quell|sabra|the agent|agent|dividend|the yacht|yacht|the company)\b/;
/** The relief helmsman. */
export const DUARTE_WORD = /\b(duarte|rafe|relief helm(sman)?|relief pilot|senior pilot|the lieutenant at the helm)\b/;

/** Flying the Halcyon down to the habitat. */
export const DESCEND = /\b(take us (down|in|back down)|take (her|the ship) down|begin (the )?(descents?|rescue|run)|start (the )?(descents?|rescue|runs?)|commence (the )?(descents?|rescue)|go (back )?down( again)?|back down|descend\w*|dive|into the (clouds?|storm|cloud deck)|fly (us |her )?(down|in)|(another|one more|1 more|the next|a second|a third|a fourth|2nd|3rd|4th) (descent|trip|run|dive|lift)|get (them|those people|everyone) (out|off|up)|bring (them|those people|everyone|the people) (up|out|off)|dock (with|at) (the )?(habitat|ring|thistledown)|resume (the )?(descents?|rescue)|carry on (the )?(descents?|rescue)|keep going)\b/;
/** Handing the descent to the pilot. */
export const DELEGATE = /\b(the (helm|conn|ship|descent|rescue|stick) is yours|you have the (helm|conn|ship|descent|stick|rescue)|your (helm|ship|call|judg(e)?ment|discretion|descent|show)|fly (it|her|this|the descent|the rescue|us down) (your way|as you see fit|how you see fit|yourself|on your own)|(i'?m|i am) (leaving|giving|handing) (it|this|the descent|the helm|the rescue|her) (to|over to|with) you|you fly (it|her|this|the descent|the rescue)|you run (it|the descent|the rescue)|over to you|in your hands|it'?s yours|she'?s yours|on your judg(e)?ment|i won'?t second-guess you)\b/;
/** Steadying him. */
export const BACK = /\b(i trust you|trust you|i believe in you|you can do (this|it)|you'?ve got (this|it)|take a (breath|moment|second)|deep breath|(i'?m|i am) (with you|right here|behind you)|i have (faith|confidence) in you|confidence in you|you'?re (ready|the best|good enough|the right (man|person|pilot))|best pilot|proud of you|i know you can|nobody (flies|does it) better|you were made for this|well flown|good flying)\b/;
/** Telling the pilot how to fly while he is flying. */
export const MICRO = /\b(bank (left|right|hard|to)|come (left|right|about|around)|hard (a?port|starboard|left|right|over)|nose (up|down)|pitch (up|down)|more (thrust|power|speed)|less (thrust|power|speed)|ease (off|up|back)|throttle|slow (down|it down|her down|us down)|faster|speed up|watch (your|the) (altitude|speed|heading|drift|attitude|wind)|keep (her|it|us) (level|steady|straight)|hold (her|it|us) (steady|level|straight)|steady as she goes|correct (your|the|for the) (course|heading|drift|attitude|wind)|trim (her|the)|level (out|off)|rudder|on my mark|let me fly|i'?ll fly|give me the (helm|controls|stick)|i have the (helm|controls|conn|stick)|left a bit|right a bit|more to the (left|right))\b/;
/** Stopping the descents. */
export const ABORT = /\b(abort|break off|pull (us )?out|climb out|get us out of (the )?(clouds?|storm)|belay (that|the descent|it)|hold off|hold (the )?(descents?|rescue)|hold above|stop the (descents?|rescue|runs?)|no more (descents?|trips?|runs?|dives?)|stand down the (descents?|rescue)|don'?t go (back )?down|do not go (back )?down|stay above the (clouds?|storm|cloud deck)|wait above)\b/;
/** Approving the pilot's own line through the storm. */
export const APPROVE = /\b(approved|do it|fly (your|that|the|his) (line|column|way|updraft)|ride (the|that|your) (column|updraft|lift|line)|take (your|that) line|make it so|go with (your|that|it|his)|your line|i agree|agreed|let'?s do it|try it|as you (suggest|say|propose)|use (the|that|your) (column|updraft|line)|permission granted|go ahead)\b/;
/** A standing limit on the descents. */
export const LIMIT = /\b(limit|safe(ty)? margin|red ?line|hard stop|break off (if|when|at|the moment)|stop (if|when|at|the moment)|pull out (if|when|at)|the chief'?s (number|limit|word|call)|when the chief (says|calls)|if the chief (says|calls)|chief says|okafor says|no further than|(don'?t|do not|never) (go |push |take (us|her) )?(past|beyond|over) (the|her|what)|if the hull|when the hull)\b/;
/** Asking the Chief about the hull. */
export const HULL = /\b(hull|strain|stress|frame|spars?|how much (more )?(can|will) (she|it|the ship|we|the hull) take|how many more (descents?|trips?|runs?|dives?)|structural|integrity|what can (she|the hull|we) take|can (she|we) take (it|another|one more))\b/;
/** Reading the storm. */
export const STORM_READ = /\b(read|scan|analy[sz]e|study|survey|assess|look at|map|check)\b.*\b(storm|clouds?|cloud deck|weather|winds?|shear|atmosphere|turbulence|updraft)\b/;
/** Counting the living aboard the habitat. */
export const LIFESIGNS = /\b(life ?signs?|head ?count|count (the |everyone|the people|heads|them)|heat signatures?|scan (the )?(habitat|thistledown|station|lower (works|decks?)|scoop (works|deck)))\b/;
/** Cutting the scoop works away. */
export const CUT = /\b(cut|drop|jettison|release|shed|cast off|blow|detach|sever|let go( of)?|ditch)\b.*\b(scoop( works| deck| plant)?|lower (works|decks?|section)|plant|works|gas-?works|ballast|dead weight|weight)\b/;
/** Lightening or towing, as an idea (a question for the Chief). */
export const LIGHTEN = /\b(lighten|lose weight|shed weight|make (her|it) lighter|stop (her|it|the habitat|thistledown) (sinking|falling)|keep (her|it|the habitat) up|slow (her|its|the) (sink|fall|descent)|tow|tractor|cut (her|it) (loose|free)|scoop works)\b/;
/** Towing the lightened habitat up. */
export const TOW = /\b(tow|tractor|haul|lift)\b.*\b(habitat|thistledown|her|it|up|clear|out)\b|\btake (her|it|the habitat|thistledown) in tow\b/;
/** Putting the relief helmsman on the helm, or giving it back. */
export const HELM_SWAP = /\b(take (the )?(helm|conn|stick|controls)|relieve|stand (him )?down|on the helm|at the helm|to the helm|take over|fly (it|her|us|the descent)|(you('?re| are)|you'll be) (flying|piloting|our pilot))\b/;
/** "tell him", "say to", "let them know". */
export const TELL = /\b(tell|say to|let (him|her|them|kemble|quell|the factor|the agent|the habitat) know|inform|warn|remind|assure|reassure|explain to|put it to|make (it )?clear to|convince|ask|order|instruct|have)\b/;
/** About the people the manifest may leave out. */
export const WORKERS = /\b(contract\w*|off the books|unregistered|undeclared|scoop (hands|crew|works|deck|workers)|lower (works|decks?)|everyone aboard|all told|exact(ly)?|manifest|head ?count|how many|anyone else|anybody else|missing|not on (the|your) (manifest|books|list)|payroll|roster|life ?signs?|more (people|souls|life signs) than)\b/;
/** Reasons: lives, and the habitat lost either way. */
export const REASON = /\b(lives?|die|dying|kill\w*|deaths?|souls|people|crush\w*|sinking|going down|lost anyway|no other way|only way|(habitat|it|she) is (lost|gone|finished)|it'?s (lost|gone)|either way|or (they|everyone) (die|dies))\b/;
/** Promising the company its habitat, or its plant, whole. */
export const PROMISE = /\b(we('?ll| will| can)|i('?ll| will| can)) (save|tow|lift|bring up|keep|rescue) (the |your )?(habitat|thistledown|plant|scoop works|her whole|it whole|both|everything)\b|\btow (her|it|the habitat|thistledown) (out )?whole\b|\bsave (both|the plant|the scoop works|your plant)\b/;
export const LEAVE = /\b(leave (the )?(system|habitat|planet|caradoc|them)|abandon (the )?(habitat|rescue|thistledown|them)|get us out of (here|the system)|we'?re leaving|we are leaving|set (a )?course (out|away|home))\b/;

export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status|how many|how far|how deep|depth|crush|eta)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read|thoughts|plan|idea|line|take)|what would you do|what should (we|i) do|recommend|how would you fly|how should we fly|any (ideas|thoughts)|talk me through)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
/** Orders for the shared engine (hail, channel, alert, wait) that this file must leave alone. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower (the )?shields|shields|red alert|yellow alert|stand down alert|jump|engage the jump|charge the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;

const ORDERS = [DESCEND, DELEGATE, BACK, ABORT, LIMIT, STORM_READ, LIFESIGNS, CUT, TOW, LEAVE, APPROVE];

/** An order in this simulation (the scenario decides what it means). */
export function starfallOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (DUARTE_WORD.test(t) && HELM_SWAP.test(t)) return true;
  if (addressee === 'helm' && (HELM_SWAP.test(t) || MICRO.test(t))) return true;
  if (MICRO.test(t) && !/\b(shields?|weapons?|power to)\b/.test(t)) return true;
  if (TELL.test(t) && (KEMBLE_WORD.test(t) || QUELL_WORD.test(t))) return true;
  return false;
}

/** A question for an officer about the situation. */
export function starfallAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(storm|clouds?|habitat|thistledown|kemble|factor|quell|agent|yacht|dividend|hull|strain|descents?|trips?|ring|dock\w*|people|souls|manifest|count|crush|depth|sink\w*|helm|fly|flying|pilot|adeyemi|duarte|lighten|tow|tractor|scoop|works|limit|line|column|updraft)\b/.test(t));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const STARFALL_NAMES = /\b(starfall|caradoc|thistledown|kemble|idris|quell|sabra|dividend|duarte|rafe|factor|scoop|updraft|chimney|crush)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|duarte|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("bring everyone to the ring", "how many are aboard?"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|there'?s|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|factor|agent|idris|sabra|kemble|quell|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|hold|keep|stay|get|bring|start|send|stop|come|cut|drop|take|go|leave|don'?t|do not|help|how|what|who|why|when|where|are|is|can|could|will|would|do|does|anyone|anybody|tell|clear|count|ready|have)\b|\b(you|your|yours)\b/i;
