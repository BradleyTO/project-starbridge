/** Words for The Ninefold Lock: orders to the helm, Rask, Varga, Szabo, the Chief and the doctor, and lines to the team and the cutter. */

/** Helm: into the Watch's reach, and how. */
export const APPROACH = /\b(take us in|bring us in|move (us )?in|go in|close (on|with) the depot|approach( the)? (depot|hall|istra|moon|pad)|move (us )?(closer|toward|towards) (the )?(depot|hall|moon|istra)|into (transporter|beaming) range|within (transporter|beaming) range|drift (us )?in|coast (us )?in|creep (us )?in|ease (us )?in|edge (us )?in|inch (us )?in)\b/;
export const SLOW = /\b(slow(ly)?|dead slow|gently|gentle|careful(ly)?|creep|inch|ease|edge|easy|one quarter|quarter impulse|crawl)\b/;
export const COLD = /\b(cold|dark|drift|coast|powered down|power(ed)? down|engines (off|down|cold)|no power|unpowered|ballistic|silent running|running dark)\b/;
/** Helm: back out of the Watch's reach. */
export const BACK_OUT = /\b(back (us )?out|pull (us )?back|back off|out of (its|their|the watch'?s?|the guns'?) (reach|range)|withdraw (from|out of) (the )?(reach|range)|get us out of (its |their )?(range|reach)|take us back out|open the range|stand off|clear of the (guns|watch|depot))\b/;
/** Probes: test the Watch. */
export const PROBE = /\b(launch|send|fire|drop|put)\b.{0,20}\b(a |another |the )?probe\b|\bprobe (the|it|toward|towards|at)\b/;
export const ACTIVE = /\b(scan(ning)?|ping(ing)?|active|sweep(ing)?|emitting|loud|lit up|sensors on)\b/;
/** Szabo: the shuttle's flight recorder. */
export const LOG = /\b(pull|get|download|read|check|retrieve|access|recover|play back|open)\b.{0,25}\b(log|logs|recorder|flight record|flight recorder|black box|telemetry)\b|\b(pipit'?s|shuttle'?s) (log|recorder|record)\b/;
/** Watching the screen without lighting anything up. */
export const WATCH_SCREEN = /\b(watch|monitor|time|clock|listen (for|to)|track|keep (an )?(eye|ear) on|note|count)\b.{0,25}\b(screen|hum|gaps?|cycle|capacitors?|flicker|drops?)\b|\btell me when (the )?(screen|hum)\b/;
/** Varga: an active scan of the screen. */
export const SCAN_SCREEN = /\b(scan|sweep|ping|probe|measure|read)\b.{0,20}\b(the )?(screen|capacitors?|cycle|dampener|damping field|field over the hall)\b/;
/** The transporter. */
export const BEAM = /\b(beam|transport|energi[sz]e|lock on to)\b.{0,40}\b(team|them|kaminski|tran|whitlock|ibarra|everyone|our people|survey team|out|aboard|up)\b|\b(transporter|transport) (window|lock)\b|\benergi[sz]e\b/;
export const NEXT_GAP = /\b(next|following|coming) (gap|drop|window|cycle)\b|\b(on|at|in|during) the (gap|drop|window)\b|\bwhen the screen (drops|opens|falls|goes down)\b/;
export const AT_MINUTE = /\b(?:at|on) (?:minute|turn|the minute) (\d{1,2})\b|\bminute (\d{1,2})\b/;
/** The keystone's answer. */
export const ANSWER = /\b(answer|reply|respond|enter|key in|type in|input|tell (the )?(grid|keystone|depot|lock|panel|board|question)|say to (the )?(grid|keystone|depot)|the answer is|our answer is|punch in)\b/;
/** Kovar and the stand-down. */
export const STANDDOWN = /\b(stand (it|the (grid|depot|lock|ninefold)) down|stand[- ]down|shut (it|the (grid|depot)) (down|off)|switch (it|the grid) off|turn (it|the grid) off|your (code|authority)|override code|release (our|my) (people|team)|let (our|my) (people|team) (go|out)|open (it|the depot)|help us)\b/;
export const HONEST = /\b(survey(ing)?|our (team|people) (woke|touched|set)|we woke|woke it|touched (it|the panel)|by accident|accident(al|ally)?|treaty|notice|our fault|our mistake|we set it off|tripped it|i won'?t pretend|honestly|the truth)\b/;
export const LIE = /\b(never touched|didn'?t touch|did not touch|wasn'?t us|was not us|nothing to do with us|woke (up )?on its own|we weren'?t (in|inside)|were not inside|no one touched|nobody touched)\b/;
export const PROMISE_NOTHING = /\b(take nothing|won'?t take|will not take|not take anything|leave (it|everything) (as it is|untouched|alone)|touch nothing|no salvage|nothing (leaves|will leave)|not (go|enter|step) (beyond|past|further|deeper)|stay in the hall|you have my word|on the record|i give you my word)\b/;
export const PROMISE_NOSCAN = /\b(no (more )?scans?|stop scanning|won'?t scan|will not scan|not scan|no sensors|look away|eyes off)\b/;

/** Fire on the depot's guns (Rask warns first) or on the hall (refused). */
export const FIRE_DEPOT = /\b(fire|shoot|open fire|destroy|take out|knock out|disable|blast|torpedo|phaser|target)\b.{0,30}\b(turrets?|guns?|gun emplacements?|emplacements?|the watch|batteries|battery|grid|depot|hall|istra)\b/;
export const GUNS_ONLY = /\b(turrets?|guns?|gun emplacements?|emplacements?|the watch|batteries|battery)\b/;
/** The Chief's cutting team. */
export const CUT = /\b(cut|burn|torch|breach|drill)\b.{0,30}\b(them out|through|wall|hall|in|a way|way in|way out|hole)\b|\b(send|land|put down)\b.{0,25}\b(a |the )?(team|rescue team|cutting team|crew|shuttle|party)\b.{0,30}\b(cut|pad|depot|hall|down|them out)\b/;
/** Dr. Osei: talk the team through treating Tran. */
export const TREAT = /\b(treat|stabili[sz]e|patch|help|talk (them|her|kaminski) through|look at|see to|first aid|tourniquet|seal)\b.{0,30}\b(tran|wound|wounded|injur\w*|hurt|bleed\w*|him|the crewman)\b/;

/** Bridge questions. */
export const DOCTRINE = /\b(doctrine|ninefold|nine locks?|rings?|what is (this|it|that)|what are we (dealing|up against)|what do you know about (it|this|the (grid|depot|lock)))\b/;
export const WATCH_Q = /\b(watch|guns?|turrets?|what (sets|set) it off|trigger\w*|what does it (fire|shoot) at|hostile|what (makes|made) it (fire|shoot)|why did it (fire|shoot)|answers? to)\b/;
export const BOARD_Q = /\b(board|panel|lamps?|lights?|glyphs?|how many (locks )?(hold|are holding|still hold))\b/;
export const HALL_Q = /\b(seals?|doors?|which ring|what ring|ring (are|is) (they|the hall)|where (are|is) (they|the team|the hall))\b/;
export const BAYS_Q = /\b(bays?|stores?|racks?|what('?s| is) in|what does (it|the depot) keep|keeps?)\b/;
export const KEY_Q = /\b(keystone|question|riddle|challenge|what (did|does) it (ask|want))\b/;
export const SCREEN_Q = /\b(screen|gaps?|cycle|hum|capacitors?|transporter window|next drop|when (does|will) it drop)\b/;
export const AIR_Q = /\b(air|oxygen|how long (do|have) (they|we)|time left|how much time)\b/;

export const HAIL = /\b(hail|call|contact|raise|reach|get|speak (to|with)|talk (to|with)|open a (channel|line) to)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|status|sitrep)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will|have)\b/;

const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|lock\b|arm\b|raise (the )?shields|lower (the )?shields|shields|red alert|yellow alert|stand down alert|jump|engage the jump|charge the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;
/** Leaving altogether is the shared helm's business, not this scenario's. */
const LEAVE = /\b(out of (the |this )?(system|area|orbit)|leave (the |this )?(system|area|orbit|moon)|withdraw( from the (area|system))?$|abandon)\b/;
const SHARED_FIRE = /\b(ordinal|cutter|kovar)\b/;

/** "Do it anyway": confirming an order an officer has just warned about. */
export const CONFIRM = /^\s*(do it|go ahead|proceed|carry on|that'?s an order|you have your orders|i said do it|i insist|understood,? do it|make it so|send it)( anyway| now| regardless|,? that'?s an order)?\s*[.!]?\s*$/;

const ORDERS = [CONFIRM, APPROACH, BACK_OUT, PROBE, LOG, WATCH_SCREEN, SCAN_SCREEN, BEAM, ANSWER, CUT, TREAT];

/** An order in this simulation. */
export function ninefoldOrder(t: string, addressee?: string | null): boolean {
  if (FIRE_DEPOT.test(t) && !SHARED_FIRE.test(t)) return true;
  if (NOT_OURS.test(t) || LEAVE.test(t)) return false;
  if (/\b(fire|torpedo(es)?|phasers?)\b/.test(t) && !/\bprobe\b/.test(t)) return false;
  if (CONFIRM.test(t)) return true;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (addressee === 'helm' && /\b(in|closer|back|out|slow|cold|drift)\b/.test(t)) return true;
  if (addressee === 'comms' && /\b(log|recorder|pipit)\b/.test(t)) return true;
  if (addressee === 'sensors' && /\b(screen|watch|monitor)\b/.test(t)) return true;
  if (addressee === 'medical' && /\b(tran|team|treat|wound|help)\b/.test(t)) return true;
  if (addressee === 'engineering' && /\b(cut|wall|team)\b/.test(t)) return true;
  return false;
}

export function ninefoldAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(depot|grid|ninefold|locks?|watch|guns?|turrets?|screen|gaps?|cycle|keystone|question|board|lamps?|glyphs?|seals?|ring|bays?|stores?|team|kaminski|tran|air|probe|log|pipit|ordinal|kovar|directorate|doctrine|hostile|trigger\w*)\b/.test(t)) || (!IS_QUESTION.test(t) && /^(tell me about|explain|describe)\b/.test(t));
}

export const NINEFOLD_NAMES = /\b(ninefold|istra|depot|pipit|kaminski|odette|tran|whitlock|greer|ibarra|mateo|ordinal|kovar|ottilie|quartermaster|keystone|screen|turrets|glyphs|seals|capacitor)\b/;

export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant commander|lieutenant (varga|szabo)|lt\.? (varga|szabo)|lt\.? cmdr\.?|commander(?!,? kovar)|cmdr\.?(?! kovar)|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

export const SPEECHY = /^\s*(you|you'?re|you'?ve|you'?ll|the|our|your|my|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?d|i'?ll|it|it'?s|there|they|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|lieutenant|odette|kaminski|commander|quartermaster|every|all|if|then|very well|agreed|fine|ok(ay)?|nothing|tell me|why|what|how|who|where|which|explain|describe|can you|could you|will you|may|did|does|do|stay|hold|keep|stand|enter|key|answer|count|read)\b|\b(you|your|yours)\b/i;
