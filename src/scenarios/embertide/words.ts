/**
 * Ember Tide — the captain's words. Shared by the interpreter rule (which only decides "an order"
 * versus "a question for an officer") and the scenario (which decides what it means).
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

/** The outpost and the people who speak for it. */
export const STROME_WORD = /\b(strome|dagny|overseer|the outpost|outpost|ketter'?s rest|ketters rest|the colony|the miners)\b/;
export const FERRIER_WORD = /\b(ferrier|joss|lifter-?master|the lifter|lifter|mattock|the ore lifter)\b/;
/** The banking crew at the furnace. */
export const BANK_W = /\b(bank(ing)? (crew|team|gang|watch|shift)|furnace (crew|team|gang|watch|shift)|smelter (crew|team)|the crew at the furnace|the people at the furnace|those at the furnace|her crew|your crew|last of them|the last people|the last crew)\b/;
export const FURNACE_W = /\b(furnace|smelter|bank(ing|ed)?|the melt|ore|the pour)\b/;

/** Lt. Varga's forecast. */
export const FORECAST = /\b(forecast\w*|predict\w*|track\w*|monitor\w*|watch\w*|time|timing|read\w*|measur\w*|model\w*|study|studying|narrow\w*|pin (it )?down|work out|figure out)\b.*\b(flare|star|myrr|tide|ember tide|window|hour|when it)\b|\b(flare|star|myrr) (forecast|watch|model)\b|\bkeep (an eye|your eyes|watch) on (the )?(star|myrr|flare)\b/;
export const PROBE_STAR = /\b(probe|drone|buoy|sensor package|instrument package)\b.*\b(star|myrr|sun|toward|towards|corona|sunward|closer|nearer|in close)\b|\b(launch|send|fire|put)\b.*\b(probe|drone|buoy)\b/;
export const BOOST = /\b(boost|increase|raise|more power|extra power|divert (power|everything|all power)|reroute|route (power|more power)|power up|push)\b.*\b(sensors?|science|instruments?|arrays?|forecast)\b|\b(sensors?|arrays?) to (full|maximum|max|overload)\b/;
export const SCAN_MINE = /\b(scan|survey|check|examine|assess|look at|measure|sound|map|inspect)\b.*\b(mine|galleries|gallery|shafts?|workings|tunnels?|underground|overburden|rock (over|above)|shielding|depth)\b/;

/** The general evacuation. */
export const EVAC = /\b(evacuat\w*|begin (the )?lift(s|ing)?|start (the )?lift(s|ing)?|send (down )?(the |our |both |all )?shuttles?|shuttles? (down|away|to the outpost|to the surface)|launch (the )?shuttles?|(get|lift|bring|move|take|ferry|fly) (the |her |their |all the |all )?(people|miners|workers|outpost|everyone|everybody|families|civilians|colonists|them)\b.*\b(up|off|out|aboard|away|to safety))\b/;
/** Pulling the banking crew off the furnace: the last lift. */
export const PULL = /\b(pull|lift|recall|bring|get|evacuate|take|fetch|collect|call)\b.*\b(bank(ing)? (crew|team|gang|watch|shift)|furnace (crew|team|gang|watch|shift)|crew at the furnace|people at the furnace|her crew|your crew|last of them|the last people|the last crew|engineers?|okafor'?s team|our team)\b.*\b(up|off|out|in|aboard|now|away|back)?\b|\blast lift\b|\b(abandon|leave|give up( on)?|forget) (the )?(furnace|smelter|melt|banking)\b|\bstop banking\b|\bget off the furnace\b|\bleave the furnace\b/;
/** Telling the banking crew to stay at the work. */
export const KEEP_WORKING = /\b(keep (working|banking|at it|going)|hold (your|her|the) crew|stay (at|on) (the )?furnace|finish (banking|the furnace|the job)|carry on|don'?t pull|do not pull|you have time|there'?s time|plenty of time|time enough|no rush|not the flare|false dawn|not yet|it'?s not (the flare|it|time))\b/;
export const PLENTY = /\b(plenty of time|time enough|no rush|all the time|lots of time|you'?re safe|you are safe|nothing to worry|it'?s safe|nothing will happen|you'?ll be fine|you will be fine)\b/;
export const FALSE_DAWN = /\b(false dawn|not the flare|isn'?t the flare|is not the flare|wrong spectrum|not it|not yet|keep (working|banking|at it|going)|hold (your|her|the) crew|stay (at|on) (the )?furnace|carry on|don'?t pull|do not pull)\b/;
/** Sending the Halcyon's engineers down to help bank the furnace. */
export const TEAM = /\b(send|beam|put|take|fly|get)\b.*\b(team|engineers?|engineering team|damage control|hands|people|a crew|some of (ours|our people))\b.*\b(furnace|bank\w*|smelter|help|down)\b|\b(help|speed|hurry|faster|quicker)\b.*\b(bank\w*|furnace|smelter)\b|\bteam (down|to the furnace)\b/;
/** Shelter in the mine. */
export const SHELTER = /\b(shelter|take cover|go (down|underground|below)|get (them |everyone )?(underground|below|down the mine|into the mine)|into the (mine|galleries|lower galleries|shafts?|workings)|down the (mine|shaft)|lower galleries|underground)\b/;
/** The moon's shadow. */
export const SHADOW = /\b(shadow|umbra|behind (the )?(moon|ketter)|far side|lee of the (moon|ketter)|put (the )?(moon|ketter) between|other side of the moon|dark side)\b/;
export const BACK_OVER = /\b(back (into|to) orbit over|return to (orbit over )?(the )?outpost|back over the outpost|come back over|out of the shadow)\b/;
/** The lifter's work. */
export const LIFTER_PEOPLE = /\b(carry|take|lift|fly|ferry|load|evacuate|help (us )?(evacuate|lift|carry|with the (lift|evacuation)))\b.*\b(people|passengers|miners|evacuees|workers|souls|families|them|everyone|the outpost)\b|\b(help|join) (us |with )?(the )?(evacuation|lifts?)\b|\bpeople,? not ore\b/;
export const LIFTER_IN = /\b(come in|dock|stand down|ground (her|it|the lifter|yourself)|land|stop (flying|the ore|your runs|the runs)|get (into|in) (the|our) shadow|take shelter|shelter|get clear|no more (runs|ore)|turn back|get under cover|come aboard|warn)\b/;
/** Reasons that move the Lifter-Master: lives and the forecast. */
export const LIVES = /\b(lives?|people|die|dying|kill|killed|deaths?|souls|everyone|families|forecast|window|minutes|flare|tide|ember tide|our science officer|varga)\b/;
/** "tell her", "say to", "let them know". */
export const TELL = /\b(tell|say to|let (her|him|them|strome|ferrier|the overseer|the outpost) know|inform|warn|remind|assure|reassure|explain to|put it to|make (it )?clear to|convince|ask|order|instruct|have)\b/;
export const LEAVE = /\b(leave (the )?(system|outpost|moon|ketter)|abandon (the )?(outpost|miners|colony|ketter)|get us out of (here|the system)|we'?re leaving|we are leaving|set (a )?course (out|away|home)|leave them)\b/;
/** Recklessly launching into the open at the flare (taking a shuttle out after the flare). */

export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status|how many|how far|when (will|does|is) (the )?(flare|tide|it)|window|forecast|eta)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
/** Orders for the shared engine (hail, channel, alert, wait) that this file must leave alone. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;

const ORDERS = [FORECAST, PROBE_STAR, BOOST, SCAN_MINE, EVAC, PULL, TEAM, SHELTER, SHADOW, BACK_OVER, LEAVE];

/** An order in this simulation (the scenario decides what it means). */
export function emberOrder(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !SCAN_MINE.test(t) && !PROBE_STAR.test(t)) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (TELL.test(t) && (STROME_WORD.test(t) || FERRIER_WORD.test(t) || BANK_W.test(t))) return true;
  if (FERRIER_WORD.test(t) && (LIFTER_PEOPLE.test(t) || LIFTER_IN.test(t))) return true;
  if (BANK_W.test(t) && KEEP_WORKING.test(t)) return true;
  return false;
}

/** A question for an officer about the situation. */
export function emberAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(flare|star|myrr|tide|forecast|window|mine|galleries|shelter|deep|furnace|bank\w*|outpost|strome|ferrier|lifter|mattock|shuttles?|shadow|evacuat\w*|people|radiation)\b/.test(t));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const EMBER_NAMES = /\b(ember|tide|ketter|ketters|strome|dagny|ferrier|joss|mattock|myrr|lifter|furnace|galleries|banking|banked|umbra|overseer)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("you have time", "pull your crew"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|there'?s|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|overseer|lifter-?master|dagny|joss|strome|ferrier|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|hold|keep|stay|carry|finish|pull|get|bring|start|send|stop|come|dock|land|take|go|leave|don'?t|do not|carry|fly|help|false dawn|plenty|time|varga|forecast|the window|minutes)\b|\b(you|your|yours)\b/i;
