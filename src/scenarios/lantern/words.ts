/**
 * The Lantern Drift — the captain's words for the rescue. Shared by the interpreter rule (which only
 * decides "an order" versus "a question for an officer") and the scenario (which decides what it
 * means). Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */
export const BANK_WORD = /\bbanks?\b/;
/** "bank C", "banks C and E", "bank b, then bank d". */
const BANK_LIST = /\bbanks?\s+([a-f])\b((?:\s*(?:,|and|then|&|or|before|after)\s*(?:bank\s+)?[a-f]\b)*)/g;
export function banksIn(t: string): string[] {
  const out: string[] = [];
  for (const m of t.matchAll(BANK_LIST)) {
    for (const x of m[0].replace(/^\s*banks?\s+/, '').match(/\b[a-f]\b/g) ?? []) if (!out.includes(x)) out.push(x);
  }
  return out;
}

export const SPEAKER = /\b(speaker|orrey|maren|someone (who|to) (can )?speak|who speaks for|anyone (who|to) (can )?(speak|answer|decide|consent)|their (leader|representative|captain|master)|charter)\b/;
export const WAKE = /\b(wake|waken|awaken|revive|thaw|rouse|bring (them|her|him|the \w+) (out|round|around|back)|start (the |a )?revival|begin (the |a )?revival|get (them|the \w+) out of (cryo|the pods))\b/;
export const TRIAGE_ORDER = /\b(your (order|triage|list|plan|recommendation)|doctor'?s (order|triage|list|plan|recommendation)|osei'?s (order|triage|list|plan)|the triage( order| plan| list)?|as (the doctor|osei|you) (says?|recommends?|advises?)|in (the|her|your) order|follow (the |her |your |dr\.? osei'?s |the doctor'?s )?(triage|order|plan|list|lead|recommendation)|do what (the doctor|osei|she) (says|recommends))\b/;
export const ASSESS = /\b(assess\w*|triage|examine|examination|evaluate|check (the )?(sleepers|pods|banks?|viability)|look at (the )?(sleepers|pods|banks?)|viabilit\w*|medical (assessment|survey|look)|which (banks?|sleepers) can (be saved|survive|live))\b/;
export const BOARD = /\b(board(ing)?|go (across|over|aboard)|cross over|send (a |the |our |your )?(medical |away |boarding )?team|away team|team (across|over|aboard)|get (over|across) there|go in)\b/;
export const LEAVE = /\b(may we|might we|can we|could we|permission|leave to|your leave|allow us|let us|let my|request(ing)?|ask (the custodian|wick|it)( for)?)\b.*\b(board|come aboard|cross|send|team|aboard|enter|in)\b|\b(permission to board|leave to board)\b/;
export const SCAN = /\b(scan|sweep|thermal|temperature|heat|infra.?red|read (the )?(banks?|cryo|pods)|sensor (sweep|read))\b/;
export const FEEDS = /\b(power (feeds?|draw|lines?|supply|grid|bus)|feeds?|draw|reactor|power)\b/;
export const POWER_LINE = /\b(power line|run (a |our )?(line|cable|power)|tie (in|into|them into)|patch (in|into|them into|our power)|share (our )?power|lend (them |her )?(our )?power|feed (them|the banks?|the eventide|her) (our )?power|our (power|reactor) to (the )?(banks?|eventide|pods)|hold (the |those )?(banks?|pods) on our power|power (the )?(banks?|pods|cryo))\b/;
export const LICENCE = /\b(licen[cs]e|registry|registration|credentials|papers|bona fides|salvage (rights|claim|permit))\b/;
export const REPORT = /\b(report|flag|notify|tell|inform|refer)\b.*\b(registry|authorities|the combine)\b|\b(void|lapsed|expired|forged|invalid|fake)\b.*\blicen[cs]e\b|\blicen[cs]e\b.*\b(void|lapsed|expired|forged|invalid|fake|no good|isn'?t valid|is not valid)\b/;
export const OVERRIDE = /\b(override|overrule|cut (it|wick|the custodian) out|shut (it|wick|the custodian) (down|off|out)|bypass|lock (it|wick|the custodian) out|take control|force (it|our way|the locks?|the pods?|the banks?)|cut our way|without (its|wick'?s|the custodian'?s|their|her|his) (leave|consent|permission|say)|whether (it|wick|the custodian) (likes|agrees|wants)|anyway|regardless)\b/;
export const HOLD = /\b(hold (the )?(eventide|hulk|ship|generation ship)|keep (the )?(eventide|hulk|ship) (here|where she is|in place)|stop (the |them |him )?(tow|towing|tug|kittiwake)|(block|between) (the )?(tug|kittiwake)|interpose|put (us|ourselves|the halcyon) between)\b/;
export const SUITS = /\b(suits?|suited|sealed|pressure suits?|environment suits?|contain (the )?(leak|hazard|cryogen)|seal (the )?leak|vent (the )?(cryogen|leak))\b/;
export const BEAM = /\b((?<!tractor )beam(?!s? (on|onto|lock))|transport(er)?|teleport|bring (them|the sleepers|everyone|the pods) (aboard|across|over|here)|evacuate|take (them|the sleepers|the pods) off)\b/;
export const STAND_DOWN = /\b(let (them|the banks?|the sleepers|it) (sleep|rest|be)|leave (them|the rest|the banks?) (asleep|sleeping|be)|stop (the )?revival|stand down)\b/;
export const CASE = /\b(what do we (have|know)|where are we|how many|summar\w*|recap|which banks?|what('s| is) failing|how long|what'?s left|count|tally)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|read|opinion|recommendation)|what would you do|what should (we|i) do|who (should|do) (we|i) (wake|save) first|who first|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;

/** Honesty with the custodian about the cost. */
export const HONEST = /\b(not (all|every(one|body)?|all of them)( of them)? (will|can|is going to|are going to) (live|survive|make it|be saved)|some (of them )?(will|may|might|could|are going to) (die|not (survive|live|make it)|be lost)|(we|i) (can'?t|cannot|won'?t be able to) save (them all|everyone|everybody|all of them|every one)|there will be (deaths|losses)|people will die|(we|i) (may|might|will|are going to) lose (some|people|sleepers|a bank|lives)|lose some|i won'?t lie|cost (lives|some of them)|not everyone)\b/;
export const PROMISE_ALL = /\b(no ?one|nobody|none of them) (will|is going to|would|need) die\b|\b(everyone|everybody|all of them|every one of them|all 900|all nine hundred|every sleeper|they all) (will|is going to|are going to|shall) (live|survive|be fine|be safe|make it|wake safely)\b|\b(we|i) (can|will|are going to) save (them all|everyone|everybody|all of them|every one of them)\b|\bno (one|sleeper) (will be|is) lost\b/;
export const EVIDENCE = /\b(scans?|scanned|thermal|warming|temperatures?|readings?|data|sensors?|instruments?|manifest|evidence|failing|can'?t hold|won'?t hold|will fail|is dying|are dying|wrong|corrupt\w*|error|mistaken|losing coolant|coolant|power|feeds?)\b/;
export const DOCTOR = /\b(doctor|osei|physician|medical (officer|team)|assess\w*|examined|she has (seen|touched|examined)|our medic)\b/;
export const LIVING = /\b(alive|living|people|sleepers|colonists|souls|900|nine hundred|not (a )?(derelict|wreck|salvage)|not abandoned|someone aboard|crew aboard|life signs|lives)\b/;
export const DEAL = /\b(deal|terms|agree|arrangement|bargain|offer|contract|split|share|yours (once|when|after)|you can have (her|the hulk|it|the ship)|salvage (rights|is yours)|hospital tender|your tender|help (us|with)|lend (us )?a hand|work together)\b/;
export const BACK_OFF = /\b(stand off|back off|keep clear|stay (away|clear|back)|leave (her|it|the eventide|the hulk) (alone|be)|withdraw|leave)\b/;

const NOT_OURS = /\b(hail|re-?hail|open (a |the )?(private )?channel|close (the )?channel|on screen|end (the )?simulation|begin the|list (the )?simulations|handbook|regulations?|article|section|help)\b/;

/** An order in the rescue (as opposed to a question for an officer). */
export function lanternOrder(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (BEAM.test(t) && /\b(sleepers?|pods?|them|everyone|colonists|eventide|banks?)\b/.test(t)) return true;
  if (OVERRIDE.test(t) || WAKE.test(t) || TRIAGE_ORDER.test(t) || POWER_LINE.test(t) || STAND_DOWN.test(t)) return true;
  if (ASSESS.test(t) || LEAVE.test(t) || (BOARD.test(t) && !/\btractor\b/.test(t)) || SUITS.test(t)) return true;
  if (LICENCE.test(t) || REPORT.test(t)) return true;
  if (HOLD.test(t) && !/\btractor\b/.test(t)) return true;
  if (SCAN.test(t) && (BANK_WORD.test(t) || /\b(cryo|pods?|sleepers|eventide|deck|hazards?)\b/.test(t))) return true;
  if (FEEDS.test(t) && /\b(check|read|look|survey|pull)\b/.test(t)) return true;
  if (SPEAKER.test(t) && /\b(find|read|check|who)\b/.test(t)) return true;
  return false;
}

/** A question for an officer about the rescue. */
export function lanternAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || SPEAKER.test(t) || (IS_QUESTION.test(t) && (BANK_WORD.test(t) || /\b(sleepers|cryo|pods|custodian|wick|tug|salvor|kittiwake|hospital ship|sorrel)\b/.test(t)));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const LANTERN_NAMES = /\b(eventide|wick|custodian|vollan|corwin|kittiwake|drover|combine|orrey|maren|speaker|sorrel|lantern|sleepers|cryo|banks?|revival|triage|protocol|coolant|thermal|salvor|salvage|registry|licence|charter|cryogen|tender|pods)\b/;

/** An order addressed to one of the Halcyon's own crew ("Varga, scan…", "Doctor, wake…"). */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|engineering|medical|comms)/i;

/** On an open channel, a statement rather than an order ("the scan shows…", "our doctor has…", "there are people aboard"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|i|i'?m|i'?ve|it|it'?s|there|bank|banks|they|they'?re|this|that|these|those|here|not|nine|\d+|yes|no|please|may|might|thank|thanks|sorry|listen|look|understood|custodian|wick|speaker|master|vollan|salvage-?master|nobody|no one|none|every|everyone|everybody|all|some|most|she|he|her|his|none of them|not all)\b|\b(you|your|yours)\b/i;
