/**
 * Hollow Crown — the captain's words. Shared by the interpreter rule and the scenario.
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

export const STANNARD_WORD = /\b(stannard|rhea|acting governor|government house|the successor|successor)\b/;
export const MALLORY_WORD = /\b(mallory|severin|(?<!acting )governor|hostage[- ]taker)\b/;
export const ROOK_WORD = /\b(rook|tamsin|the (hostages?|staff|technicians?)|hostages?|marsh|dace|castell)\b/;

/** Dr. Osei assesses the governor's condition from his voice. */
export const ASSESS = /\b(assess|read|evaluate|diagnose|listen to|profile|judge|study|observe|watch)\b.{0,30}\b(him|mallory|the governor|severin|his (condition|state|voice|mind|health))\b|\b(his|mallory'?s|the governor'?s) (condition|state of mind|mental state|health|frame of mind)\b|\bwhat'?s wrong with (him|mallory|the governor)\b/;
/** Check who the hostages really are. */
export const ROSTER = /\b(check|verify|pull|get|compare|cross[- ]?check|confirm|request|send)\b.{0,40}\b(roster|duty (list|roster)|staff (list|records?)|personnel (list|records?|files?)|crew list|manifest|who (is|was) on (shift|duty))\b|\b(identify|verify|confirm) (the|every|each|all the) (hostages?|staff)\b|\bwho are the hostages\b/;
/** Szabo traces transmissions from inside the relay. */
export const TRACE = /\b(trace|monitor|intercept|listen (in )?(to|for)|sniff|track|watch|analy[sz]e)\b.{0,40}\b(signals?|transmissions?|traffic|bursts?|bands?|frequencies|comms|her transmitter|the relay'?s (traffic|signals?))\b/;
/** A close scan of the relay's core for the charge he claims. */
export const SCAN_CORE = /\b(scan|check|sweep|look)\b.{0,40}\b(core|charge|explosives?|bomb|device|detonator|wired)\b|\bis (the core|it|the relay) (really )?wired\b/;
/** Jam a transmitter or a trigger. */
export const JAM = /\b(jam|block|cut|kill|scramble|suppress|disable|drown out|null)\b.{0,40}\b(transmitter|trigger|detonator|wrist(?: unit)?|signal|band|burst|frequenc(y|ies)|her comms|the charge)\b/;
/** Send food, water or medicine across in a pod. */
export const SUPPLY = /\b(send|offer|drop|deliver|get|launch|pass|float)\b.{0,40}\b(food|water|rations?|supplies|medicine|medication|meds|drugs?|supply pod|a pod|blankets|something to eat)\b/;
export const MEDICINE = /\b(medicine|medication|meds|drugs?|prescription|his (pills|treatment|dose))\b/;
/** Transport people out of the relay. */
export const BEAM = /\b(beam|transport|energi[sz]e|evacuate|pull)\b.{0,40}\b(hostages?|staff|technicians?|them|everyone|rook|tamsin|her|out|aboard|across|mallory|him|the governor)\b|\b(transporter|transport) (lock|window)\b/;
/** Storm the relay with the Halcyon's own security team. */
export const STORM = /\b(storm|board|breach|raid|assault|rush|take)\b.{0,30}\b(the relay|relay|station|it|the room|the control room|him)\b|\b(send|put|move) (in )?(a |the |our )?(security|boarding|tactical) (team|party|detail)\b|\bgo in (hard|by force|with force)\b/;
/** Declining force when it is urged. */
export const DECLINE = /\b(will not|won'?t|do not|don'?t|refuse|decline|not going to|no)\b.{0,30}\b(storm|board|breach|raid|go in|force|send (our|a) team|assault)\b/;

/** Lines to the governor. */
export const THREAT = /\b(deadline|last chance|or else|or we|we will (come|go) in|we'?ll (come|go) in|storm|force|surrender now|you have (\d+|one|two|three|five|ten) minutes|we will (make|take) you|kill you|end you|shoot|weapons? (on|at) you|no more talk)\b/;
export const RESTORE = /\b(restore|reinstate|governor again|give (you|it) back|put you back|get you (back|aubrel)|you'?ll be governor|make you governor|your office back|return you to office)\b/;
export const HEARING = /\b(asylum|protection|protect you|fair hearing|a hearing|be heard|heard properly|review|inquiry|isa custody|our custody|custody of the isa|not hand you|won'?t hand you|will not hand you|safe conduct|your case|fleet command|a court|a fair trial|stay (with|aboard) (us|the halcyon))\b/;
export const LISTEN = /\b(listen|i hear you|we hear you|tell me|what happened|your side|i understand|we understand|why|what do you want|talk to me|help me understand|go on|i'?m listening)\b/;
export const SURRENDER = /\b(surrender|come out|let (them|the hostages|the staff|everyone|those people) go|release (them|the hostages|the staff|everyone)|lay (it )?down|stand down|end this|give yourself up|put (it|the weapon|that) down|walk out|come aboard|hand yourself)\b/;
export const HUMILIATE = /\b(you lost|you'?re finished|you'?re done|you'?re nobody|nobody now|disgrace\w*|criminal|terrorist|coward|pathetic|has[- ]been|failure|you deserve)\b/;
export const EXPOSE = /\b(one of (them|the hostages|your hostages|those people)|the woman|rook|tamsin|she)\b.{0,40}\b(spy|agent|plant|not who|lying|isn'?t (rook|who)|working for|guard|informer|impostor|imposter|fake)\b/;
export const REST = /\b(rest|sleep|no (deadline|rush|hurry|clock)|take (your|all the|as much) time|we can wait|we have time|no one (is|will be) coming in|nobody (is|will be) coming in|tired|sit down|breathe|eat something)\b/;
export const GRIEF = /\b(aris|your son|your boy|your loss|sorry (about|for) (your son|aris|your loss|what happened)|grief|grieving|lost (your|a) son|what happened to (him|your son))\b/;
export const RIGGED = /\b(rigged|bought|vote|council|stole|stolen|coup|what happened)\b/;
/** Lines to the successor. */
export const HANDOVER_YES = /\b(we'?ll hand (him|mallory) (over|to you)|we will hand (him|mallory) (over|to you)|hand (him|mallory) over to you|he'?s yours|you can have him|you'?ll have him|he will be yours|deliver him to you|turn him over to you)\b/;
export const HANDOVER_NO = /\b(isa custody|our custody|not hand(ing)? him|won'?t hand him|will not hand him|asked for (our|the isa'?s|isa) protection|asylum|fleet command (will|decides|shall)|he stays with us|he stays aboard|under (our|isa) protection|not (yours|going to you))\b/;
export const HOLD = /\b(hold|wait|delay|stand (down|by)|give (me|us) (time|more time|a few minutes)|call (it|them|the guard|your team) off|pull (them|your team|the guard) back|stop (the|your) (team|guard|strike)|keep (them|your team|the guard) back|not yet|postpone)\b/;
export const PROOF = /\b(proof|evidence|audit|ledger|rigged|bought the vote|electoral|marsh)\b/;
export const AGENT_WORD = /\b(your (agent|corporal|guard|plant|spy|operative|woman|officer|informer)|dace|one of your (people|own)|we know (about )?(her|your)|you put (her|someone) (in|there))\b/;
export const CHARGE_WORD = /\b(charge|wired|explosive|bomb|core|detonator)\b/;
export const LIVES = /\b(lives?|hostages?|people|killed|die|dying|massacre|blood|everyone)\b/;
/** Lines to the false hostage. */
export const WHO_ARE_YOU = /\b(who are you|your (real )?name|not (tamsin|rook|a technician)|you'?re not|you are not|roster|on leave|we know|the truth about you|who you really are|what are you doing there)\b/;
export const PROTECT_HER = /\b(protection|protect you|asylum|you'?ll be safe|you will be safe|keep you safe|isa will|we will|we'?ll (look after|keep|protect)|safe with us)\b/;
export const SEND_IT = /\b(send (it|me|us|the|your)|proof|evidence|ledger|show (me|us))\b/;

export const HAIL = /\b(hail|call|contact|raise|reach|get|speak (to|with)|talk (to|with)|open a (channel|line) to|patch (me )?through to|put (her|rook|the hostages) on)\b/;
export const TELL = /\b(tell|say to|let (her|him|them) know|inform|assure|explain to|put it to|make (it )?clear to|ask|offer|show|give|warn)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will|have)\b/;

const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock\b|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;
const NOT_WEAPONS = /\b(weapons?|phasers?|torpedo(es)?|target|fire)\b/;

/** "Do it anyway": confirming an order an officer has just warned about. */
export const CONFIRM = /^\s*(do it|go ahead|proceed|carry on|go in|send them in|that'?s an order|you have your orders|i said do it|i insist)( anyway| now| regardless|,? that'?s an order)?\s*$/;

const ORDERS = [CONFIRM, ASSESS, ROSTER, TRACE, SCAN_CORE, JAM, SUPPLY, BEAM, STORM];

/** A bridge order rather than a line of speech, even with a channel open ("Doctor, assess him"). */
export function hollowCommand(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  if (/^\s*(we|we'?ll|we will|i|i'?ll|i will|you|you'?ll|your)\b/.test(t)) return false;
  return [ASSESS, ROSTER, TRACE, SCAN_CORE, JAM, BEAM, STORM].some((re) => re.test(t)) || CONFIRM.test(t);
}

/** An order or line of speech in this simulation. */
export function hollowOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  if (NOT_WEAPONS.test(t) && !DECLINE.test(t)) return false;
  if (/^\s*(rook|tamsin)\b/.test(t)) return true;
  if (CONFIRM.test(t)) return true;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !ASSESS.test(t) && !SCAN_CORE.test(t)) return false;
  if (DECLINE.test(t)) return true;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (TELL.test(t) && (STANNARD_WORD.test(t) || MALLORY_WORD.test(t) || ROOK_WORD.test(t))) return true;
  if (addressee === 'medical' && /\b(him|mallory|governor|condition|voice|state|medicine|medication)\b/.test(t)) return true;
  if (addressee === 'comms' && /\b(roster|signals?|transmissions?|bursts?|band|jam|trace|names?)\b/.test(t)) return true;
  if (addressee === 'tactical' && /\b(security|team|storm|board|breach|guard|core|charge)\b/.test(t)) return true;
  if (addressee === 'sensors' && /\b(core|charge|relay|life signs?|lower ring|guard)\b/.test(t)) return true;
  return false;
}

export function hollowAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(mallory|severin|governor|stannard|rook|tamsin|hostages?|guard|strike|team|charge|core|relay|condition|aubrel|roster|son|aris)\b/.test(t));
}

export const HOLLOW_NAMES = /\b(aubrel|ostrin|mallory|severin|stannard|rhea|rook|tamsin|aris|marsh|selene|dace|liane|castell|mira|roster|hostages|relay)\b/;

export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

export const SPEECHY = /^\s*(report (?=the|what|how|why|your|everything|in |about)|you|you'?re|you'?ve|you'?ll|the|our|your|my|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?d|i'?ll|it|it'?s|there|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|captain|governor|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|tell me|why|what|how|who|explain|can you|could you|will you|may|did|does|do|hand|release|let|surrender|come|rest|take|send|aris|severin|mallory|rhea|hold|call|stand|give)\b|\b(you|your|yours)\b/i;
