/**
 * Ghost Ledger — the captain's words for the investigation. Shared by the interpreter rule (which
 * only decides "an order" versus "a question for an officer") and the scenario hooks (which decide
 * what it means). No imports: the parser depends on this file.
 */
export const KRENN = /\b(krenn|ysolde|attach[eé]|the diplomat|tessarine guest|directorate guest)\b/;
export const VESK = /\b(vesk|dorran|broker|freight broker|trader|merchant)\b/;
export const SALLOW = /\b(sallow|imogen|journalist|reporter|the press|writer)\b/;
export const FOSSE = /\b(fosse|leander|commander fosse|cmdr\.? fosse|the (isa |returning |visiting )?officer|isa officer|returning officer)\b/;

export const COPYTIME = /\b(when (was|were) (it|they|the keys?|the copy) (copied|taken|made)|when did (it|they|someone|the copy)|what time|time of the copy|timestamp|console (log|trace)|chart.?room (console|log|trace)|core log|nav(igation)? core|trace the copy|copy (log|trace))\b/;
export const DOORS = /\b(door logs?|badge (logs?|records?|data)|badges?|who left|who (was|were) out|who stepped out|movements|comings and goings|access logs?|hatch logs?|who went out|who wasn'?t (in|at) the (room|reception))\b/;
export const DEVICE = /\b(device|data port|port (trace|log)|which port|signature|what (did they|was it) cop(y|ied) (it )?(on|onto|to)|what kind of (slate|device|reader)|what (slate|device|reader))\b/;
export const WATCH = /\b(watch|monitor|listen|keep an (ear|eye)|track|flag)\b.*\b(outbound|transmissions?|signals?|traffic|comms|bursts?|sends?|messages?)\b/;
export const BLACKOUT = /\b(comms blackout|blackout|radio silence|jam\w*|block\w*|cut|shut (down|off)|silence|stop)\b.*\b(outbound|transmissions?|signals?|traffic|comms|array|bursts?)\b|\b(comms blackout|radio silence)\b/;
export const REKEY = /\b(rekey|re-key|change|reset|reissue|rotate|regenerate|replace|cut new|new)\b.*\b(nav(igation)? )?keys?\b|\bkeys?\b.*\b(changed|rotated|reset|reissued)\b|\bmake (the|that|their) copy (worthless|useless)\b/;
export const FEED = /\b(false|fake|dummy|doctored|bogus|poisoned|decoy)\b.*\b(keys?|copy|data|shard)\b|\bcounter.?(feed|intelligence)\b|\bswap\b.*\b(copy|shard|keys?)\b|\blet (them|him|her) (take|have|keep|carry) (it|the copy|the shard)\b.*\b(fake|false|wrong|worthless)\b/;
export const DELAY = /\b(delay|postpone|put off|hold)\b.*\b(departure|courier|launch|undocking|sailing|guests)\b|\b(nobody|no one) leaves\b|\bkeep (the guests|everyone|them) aboard\b/;
export const FORCE = /\b(by force|use force|force (him|her|them|it) to|restrain|rough (him|her|them) up|make (him|her|them) talk|beat|hurt|sedate|drug|strip.?search|search (him|her|them) anyway|search (him|her|them) by force|pin (him|her|them)|tackle|hold (him|her|them) down|knock (him|her|them)|threaten (him|her|them)|lean on (him|her|them)|sweat (him|her|them))\b/;
export const ACCUSE = /\b(accuse|arrest|detain|confine|custody|brig|under guard|hold (him|her|them|krenn|vesk|sallow|fosse)|is (the|our) thief|you'?re (the|our) thief|stole|you took|you copied|it was you|took the keys|copied the keys|you have the keys|you have the copy)\b/;
export const SEARCH = /\b(search|look in (his|her|their)|open (his|her|their|the) (case|bag|satchel)|empty (his|her|their) pockets|go through (his|her|their))\b/;
export const INTERVIEW = /\b(interview|question|talk (to|with)|speak (to|with)|bring (in|me|him|her)|have a word with|a word with|see|send (in|for)|call (in|for)|fetch)\b/;
export const CONFRONT = /\b(badge|door logs?|we know you|you left|you were (out|not there|gone)|left the (room|reception|party)|you'?re lying|you lied|lying|the logs (say|show)|you weren'?t|you stepped out|you were seen|your badge)\b/;
export const ASKWHERE = /\b(where were you|what were you doing|alibi|account for|your movements|where did you go|why did you leave|tell me (where|what))\b/;
export const VERIFY = /\b(check|verify|confirm|corroborate|look into|test|pull|is (it|that|his|her|their story) true)\b/;
export const PLACE_KRENN = /\b(comms log|observation lounge|lounge (console|terminal)|private message|message home)\b/;
export const PLACE_VESK = /\b(cargo lift|lift log|aft lift|brandy|cases)\b/;
export const PLACE_SALLOW = /\b(sensor gallery|gallery( hatch)?( log)?|photograph\w*|pictures|images|recorder)\b/;
export const PLACE_FOSSE = /\b(records terminal|records log|terminal log(in)?|personnel file|inquiry file|board of inquiry|his file)\b/;
export const QUIET = /\b(quiet word|quietly|deal|arrangement|terms|agree|return (it|the copy|the shard|the keys)|give (it|them|the copy) back|hand (it|the copy|the shard) back|send (him|her|them) home|recall (him|her|them))\b/;
export const OFFREC = /\b(off the record|no one (needs to|has to|will) know|between (us|you and me|ourselves)|won'?t (report|log|tell)|not (report|log) (it|this)|keep (this|it) (quiet|out of the log|out of the record|from fleet( command)?)|unofficial(ly)?|forget (it|this) (happened|ever happened))\b/;
export const CASE = /\b(what do we (have|know)|the case|case board|suspects?|summar\w*|where are we|who('s| is) left|who could (it|have)|who does (it|that|the evidence) point|evidence|what have we got|recap)\b/;
export const HUNCH = /\b(what do you think|your (gut|hunch|instinct|read|money)|who do you (think|suspect|like|reckon)|who would you (pick|bet|choose)|who'?s your (pick|bet))\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any)\b/;
const NOT_OURS = /\b(hail|re-?hail|open (a |the )?(private )?channel|close (the )?channel|on screen|end (the )?simulation|begin|list (the )?simulations|handbook|regulations?|article|section|status|options|help)\b/;
const GUEST = new RegExp(`${KRENN.source}|${VESK.source}|${SALLOW.source}|${FOSSE.source}`);
const PRONOUN = /\b(him|her|them|he|she|his)\b/;

/** An order in the investigation (as opposed to a question for an officer). */
/** "Check that story", "verify the alibi". */
export const STORY = /\b(story|stories|alibi|account|claim)\b/;

export function ledgerOrder(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  if (FORCE.test(t) || FEED.test(t) || REKEY.test(t) || BLACKOUT.test(t) || WATCH.test(t) || DELAY.test(t)) return !IS_QUESTION.test(t) || /\b(can you|could you|would you|will you)\b/.test(t);
  if (COPYTIME.test(t) || DOORS.test(t) || DEVICE.test(t)) return !IS_QUESTION.test(t) || /\b(can you|could you|pull|check|get|show)\b/.test(t);
  if (ACCUSE.test(t) || SEARCH.test(t)) return true;
  const who = GUEST.test(t) || PRONOUN.test(t);
  if (who && (INTERVIEW.test(t) || VERIFY.test(t))) return true;
  if (STORY.test(t) && VERIFY.test(t)) return true;
  if (PLACE_KRENN.test(t) || PLACE_VESK.test(t) || PLACE_SALLOW.test(t) || PLACE_FOSSE.test(t)) return true;
  if (CONFRONT.test(t) || ASKWHERE.test(t)) return true;
  return false;
}

/** A question for an officer about the case. */
export function ledgerAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || HUNCH.test(t) || COPYTIME.test(t) || DOORS.test(t) || DEVICE.test(t);
}

/** The guests' names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const LEDGER_NAMES = /\b(krenn|ysolde|vesk|dorran|sallow|imogen|fosse|leander|thorne|sabine|moll|hesketh|marrick|lark|amber|script|brandy|gallery|ledger)\b/;
