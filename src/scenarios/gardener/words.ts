/**
 * The Gardener — the captain's words. Shared by the interpreter rule (which only decides "an order"
 * versus "a question for an officer") and the scenario (which decides what it means).
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

/** The growth, by any of its names. */
export const GROWTH_WORD = /\b(growth|gardener|organism|tendrils?|crystals?|crystallisation|crystallization|mou?ld|fungus|lichen|the thing|that thing|the rock|it)\b/;
/** Killing it: burning, firing on it, cutting it away. */
export const BURN = /\b(burn|burns|burning|torch|incinerate|vapori[sz]e|destroy|kill|blast|fire (on|at|into|upon)|shoot|sterili[sz]e|cauteri[sz]e|wipe (it )?out|scorch|purge|exterminate|eradicate)\b/;
/** Letting the miners burn it. */
export const PERMIT_BURN = /\b(go ahead|fire (your|the) charges|set (off|them off) (your|the) charges|light (it|your charges|the charges)|you may (burn|fire|cut)|you can (burn|fire|cut)|you have (my )?(permission|leave|blessing)|burn it,? then|do it,? then|we (won'?t|will not) stop you)\b|\b(let|have|allow) (the miners|crake|the claimwarden|them|her) (to )?(burn|torch|fire|set off|light|cut)\b/;
/** Asking Crake to wait. */
export const HOLD = /\b(hold|wait|don'?t (burn|fire|light|touch)|do not (burn|fire|light|touch)|stand down|hold off|hold fire|give (us|me|my (science )?officer|her|lieutenant varga|varga) (time|an hour|some time|a few minutes|a chance)|not yet|stay your hand|keep (your|the) charges (safe|cold|aboard)|leave (it|the growth) alone|before you burn)\b/;
/** Promising Crake the Halcyon will protect her claims. */
export const PROTECT = /\b(protect|guard|stand between|watch over|look after|keep (it|the growth) (off|away from) (your|the) claims|we won'?t let it|we will not let it|you have my word|i give you my word|i promise)\b/;
export const ALIVE_W = /\b(alive|living|life ?form|organism|lives|a life|it'?s life|is life|sentient|aware)\b/;
export const SPORE_W = /\b(spores?|sporing|scatter|seed (it|the field|your claims|every rock)|spread it (everywhere|across))\b/;
export const STONE_W = /\b(stone|mineral|crystal\w*|not alive|isn'?t alive|is not alive|dead rock|just rock|only rock|nothing alive)\b/;
export const GAP_W = /\b(gap|open space|can'?t cross|cannot cross|can not cross|won'?t cross|by contact|only by touch)\b/;
/** Cutting the link between the growth's rock and the claims. */
export const CUT_LINK = /\b(cut|sever|break|disconnect|uncouple|detach|unhook|release|drop|cast off)\b.*\b(rail|ore rail|tethers?|cables?|lines?|links?|connection)\b|\b(pull|draw) (the |your )?(claim|claims|rock|rocks) (back|away|apart)\b/;
/** Putting it in the dark. */
export const DIM = /\b(dim|douse|kill|put out|turn (off|down|out)|switch (off|out)|shut (off|down)|darken|black ?out|cut)\b.*\b(lamps?|lights?|floodlights?|floods|work ?lights?|lighting|arc lights?)\b|\b(in(to)? (the )?(dark|shadow)|shade (it|the growth|the rock)|starve it of light)\b/;
/** Varga's study of the growth. */
export const STUDY = /\b(study|analy[sz]e|examine|investigate|survey|look (at|into|closely)|find out (what|whether|if)|work out (what|whether|if)|identify|assess|figure out|learn what|scan)\b.*\b(growth|gardener|it|organism|rock|thing|crystals?|tendrils?)\b|\bwhat (is|exactly is) (it|that|the growth|the gardener)\b|\bis (it|the growth|the gardener) alive\b/;
export const SAMPLE = /\b(sample|samples|specimen|piece|scraping|core|cutting|fragment|swab)\b/;
export const PROBE = /\b(probe|drone|remote|robot|robotic|sampler|waldo|arm)\b/;
export const TEAM = /\b(team|away team|party|crew|someone|people|eva|spacewalk|suit up|go (across|over)|send (a |an )?(team|party|crew|someone))\b/;
export const ABOARD = /\b(bring|beam|transport|take|carry|fetch)\b.*\b(aboard|on board|onto the ship|into the ship|to the lab|to sickbay|to the science lab|back here)\b/;
export const CONTAINED = /\b(contain(ed|ment)?|sealed|isolat(ed|ion)|barrier|quarantine|hazard suits?|hazmat|full protection|protective (suits|gear)|stasis|clean ?room)\b/;
/** A lure, and what it is baited with. */
export const LURE = /\b(lure|bait|baited|decoy|draw (it|the growth|the gardener) (away|off|out|toward|towards)|lead (it|the growth|the gardener) (away|off|out)|buoy|tempt it|entice it)\b/;
export const HEAT_W = /\b(heat|thermal|warm|warmth|hot|infra-?red|heater)\b/;
export const METAL_W = /\b(metal|iron|nickel|ore|scrap|steel|hull plat(e|ing)|plating|alloy)\b/;
export const LIGHT_W = /\b(light|lights|lamp|lamps|flare|flares|glow|bright|floodlight|lantern)\b/;
/** Running the Halcyon cold. */
export const COLD = /\b(run (cold|dark|quiet)|go (cold|dark)|power down|cut (our|the ship'?s|the) (heat|emissions|thermal)|vent (our )?heat|reduce (our )?(heat|emissions|thermal (output|signature))|cool (the ship|us|the hull) down|lower (our )?heat)\b/;
/** Opening the range. */
export const BACK_OFF = /\b(back (off|away|us off)|pull (us )?back|fall back|open (the )?range|move (us )?away|withdraw|stand off|get (us )?clear|keep (our|a) distance|increase (the )?(range|distance)|put distance)\b/;
/** Leaving the field to its fate. */
export const LEAVE = /\b(leave (the )?(field|cobble field|them to it|it to them)|abandon (the )?(field|claims|miners)|get us out of (here|the field)|we'?re leaving|we are leaving|set (a )?course (out|away|home)|resume (our|the) survey)\b/;
/** "tell her", "say to", "let them know". */
export const TELL = /\b(tell|say to|let (her|them|crake|the miners|haskett|the station) know|inform|warn|remind|assure|explain to|put it to|make (it )?clear to|convince|ask|show|send)\b/;
export const CRAKE_WORD = /\b(crake|claimwarden|bettine|hobnail|the tender|the cutter|miners?|cooperative|her)\b/;
export const STATION_WORD = /\b(haskett|assayer|lorne|spindle|the station|station|claims station)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|when will it reach|how fast|how far)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
/** Orders for the shared engine (lock, shields, hail, jump) that this file must leave alone, unless they name the growth. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|computer,? (begin|start|run|end|list|stop))\b/;
const GROWTH_STRICT = /\b(growth|gardener|organism|tendrils?|crystals?|mou?ld|fungus|lichen|the thing|the rock)\b/;

export const burnOrder = (t: string) => BURN.test(t) && GROWTH_WORD.test(t) && !/\b(don'?t|do not|never|no one|nobody|not)\b[^.]*\b(burn|torch|fire|destroy|kill)\b/.test(t);

/** An order in the field (the scenario decides what it means). */
export function gardenerOrder(t: string): boolean {
  if (burnOrder(t) && (GROWTH_STRICT.test(t) || !NOT_OURS.test(t))) return true;
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !STUDY.test(t)) return false;
  if (q && /\bwhat (is|exactly is) (it|that|the growth|the gardener)\b|\bis (it|the growth|the gardener) alive\b/.test(t)) return false;
  if (LURE.test(t) || COLD.test(t) || BACK_OFF.test(t) || LEAVE.test(t) || DIM.test(t) || CUT_LINK.test(t)) return true;
  if (TELL.test(t) && (CRAKE_WORD.test(t) || STATION_WORD.test(t))) return true;
  if (PERMIT_BURN.test(t)) return true;
  if (SAMPLE.test(t) || STUDY.test(t)) return true;
  return false;
}

/** A question for an officer about the growth. */
export function gardenerAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(growth|gardener|alive|it|spores?|claims?|crake|claimwarden|haskett|station|miners?|charges|lure|rail|tethers|drawn|heat|metal|light|sample|study|findings?)\b/.test(t));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const GARDENER_NAMES = /\b(gardener|cobble|spindle|hobnail|crake|bettine|claimwarden|haskett|lorne|assayer|tendrils?|spores?|sporing|lure|bait|tethers?|claims|floodlights?)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("we need time", "it's alive"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|they|they'?re|this|that|these|those|here|not|no|yes|please|may|might|thank|thanks|sorry|listen|look|understood|claimwarden|assayer|bettine|lorne|nobody|no one|every|everyone|all|some|she|he|her|his|one|two|three|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|hold|wait|don'?t|do not|give|cut|go ahead|stand down|leave)\b|\b(you|your|yours)\b/i;
