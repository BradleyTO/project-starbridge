/**
 * The Glass Nebula — the captain's words. Shared by the interpreter rule and the scenario.
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

export const SHUTTLE_WORD = /\b(citrine|shuttle|surveyor|vale|nessa)\b/;
export const BUOY_WORD = /\b(prism|buoy|relay|beacon)\b/;
export const RIM_WORD = /\b(rim|edge|margin|periphery|outer (edge|rim)|stay (at|on|near) the (rim|edge))\b/;
export const GLASS_WORD = /\b(looking glass|looking-glass|mirror (locus|return|image|position)|false (locus|return|position|echo)|deep(er)? (into|in) (the )?(nebula|glass)|into the (looking )?glass)\b/;
export const FOLD_WORD = /\b(fold|time[- ]?shear|shear|through the (fold|shear)|use the (fold|shear)|ride the (fold|shear)|take the (fold|shear))\b/;
export const MODEL = /\b(model|map (the|of the)? (nebula|glass|physics)|study (the )?(nebula|signals?|physics|messages?)|analyse|analyze|what (is|are) (the )?(nebula|signals?|physics|messages?)|build (a |the )?model|science (report|read|model)|varga,? (study|model|map|analyse|analyze|what))\b/;
export const MESSAGES = /\b(messages?|signals?|which (message|signal|one)|stay away|help (us|me|signal|message)|contradict\w*|echo|which is (real|true|later|the echo)|time[- ]?stamp|stamp)\b/;
export const PROBE = /\b(probe|drone|sensor (pod|buoy)|relay (chain|probe)|probe relay|chain of probes)\b/;
export const GO_DEEP = /\b(go (in|deep|after them)|commit (the ship|us)|plunge|enter (the )?(nebula|glass)|take us (in|deep|after)|head (in|deep|after)|make for (the )?(shuttle|citrine|help)|follow (the )?(help|distress|signal))\b/;
export const HOLD = /\b(hold (here|position|at the rim|off)|stay (here|put|at the rim|off)|do not enter|don't enter|wait (here|at the rim)|stand off)\b/;
export const TURN_BACK = /\b(turn(ed)? back|believe the (warning|stay[- ]away)|the help (is|was) (an )?echo|stay away)\b/;
export const RESCUE = /\b(rescue|recover|bring (them|her|the crew) (aboard|home|across)|tractor (the )?(shuttle|citrine)|tow (the )?(shuttle|citrine)|send (a )?(rescue|medical) team|beam (them|her) (aboard|over)|pick (them|her) up)\b/;
export const LEAVE = /\b(leave|withdraw|get us out|we'?re leaving|we are leaving|jump|abandon|give up on them|end the search)\b/;
export const FORCE = /\b(fire|burn|destroy|blast|torpedo|weapons? (on|at)|lock (weapons?|torpedoes) on)\b.*\b(shuttle|citrine|vale|nebula|fold|glass)\b|\b(force (our |a )?(way|path)|punch through|ram (through|the)|burn (a |our )?path)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status|how many|how far|eta|situation|sitrep)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read|thoughts|plan|idea|take)|what would you do|what should (we|i) do|recommend|any (ideas|thoughts)|talk me through|options)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
export const TELL = /\b(tell|say to|let (her|him|them|vale|the surveyor) know|inform|warn|assure|explain to|offer|ask)\b/;
export const NEG = /\b(not|never|no|won'?t|will not|don'?t|do not|can'?t|cannot|nothing)\b/;

const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower (the )?shields|shields|red alert|yellow alert|stand down alert|jump|engage the jump|charge the jump|wait|status|help|options|objectives|evasive|computer,? (begin|start|run|end|list|stop))\b/;

const ORDERS = [RIM_WORD, GLASS_WORD, FOLD_WORD, MODEL, PROBE, GO_DEEP, HOLD, TURN_BACK, RESCUE, LEAVE, FORCE];

/** An order in this simulation (the scenario decides what it means). */
export function glassOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (PROBE.test(t) && /\b(launch|send|drop|deploy|put|release|rig|set)\b/.test(t)) return true;
  if (addressee === 'helm' && /\b(take|move|bring|get|head|steer|fly|hold|stay)\b/.test(t)) return true;
  if (addressee === 'sensors' && /\b(study|model|map|analyse|analyze|scan)\b/.test(t)) return true;
  if (TELL.test(t) && SHUTTLE_WORD.test(t)) return true;
  return false;
}

/** A question for an officer about the situation. */
export function glassAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || MESSAGES.test(t) || (IS_QUESTION.test(t) && (SHUTTLE_WORD.test(t) || BUOY_WORD.test(t) || /\b(nebula|glass|fold|shear|rim|model|physics|echo|locus|probe|crew|vale)\b/.test(t)));
}

export const GLASS_NAMES = /\b(glass|nebula|citrine|prism|vale|nessa|fold|looking|rim|shear|echo|buoy)\b/;

export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|there'?s|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|surveyor|vale|nessa|hold|stay|help|how|what|who|why|when|where|are|is|can|could|will|would|do|does|anyone|anybody|tell|come|we('?re| are) coming|hang on)\b|\b(you|your|yours)\b/i;
