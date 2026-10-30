/**
 * Coldwater — the captain's words. Shared by the interpreter rule (which only decides "an order"
 * versus "a question for an officer") and the scenario (which decides what it means).
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

/** The striking watch and the people who speak for it. */
export const STRIKER_WORD = /\b(tennant|mara|strikers?|striking|b watch|b-watch|the watch|your watch|her watch|engineering crew|engine room crew|the crew below|the people below|the men and women below|them down there|those below|the refusers|the stand-?down)\b/;
export const PENHALE_WORD = /\b(penhale|garrick|the supervisor|plant supervisor|watch supervisor)\b/;
export const CORLEY_WORD = /\b(corley|sian|leading hand)\b/;
export const STATION_WORD = /\b(toller|annick|the station|station|coldwater station|director)\b/;
export const INSPECTOR_WORD = /\b(hadley|noor|inspector|inspectorate|plumb line|the courier)\b/;
/** The dead man. */
export const STRAND_W = /\b(strand|callum)\b/;

/** "tell her", "say to", "let them know". */
export const TELL = /\b(tell|say to|let (her|them|tennant|the strikers|the watch|the crew) know|inform|assure|explain to|put it to|make (it )?clear to|promise|offer|ask|give)\b/;

/** Going down to engineering in person, and coming back. */
export const GO_DOWN = /\b(go|going|head|heading|come|coming|walk|take me|i'?ll go|i will go|i'?m going) (down )?(to|into|below to) (main )?(engineering|the engine room|the plant|the coolant plant|see them|talk to them|the strikers)\b|\bgo (down|below)\b|\b(in person|face to face|myself)\b.*\b(engineering|strikers|tennant|them)\b/;
export const GO_UP = /\b(back to|return to|go (back )?up to|head back to) (the )?bridge\b/;
/** Sending the first officer down to talk to them. */
export const SEND_MARROW = /\b(marrow|number one|first officer|xo)\b.*\b(go|head|talk|speak|sit down|reason|mediate)\b|\bxo: .*\b(go (down|below|to engineering)|talk to (them|tennant|the strikers)|speak (to|with) (them|tennant))\b/;

/** Threats and coercion. */
export const THREAT = /\b(court[- ]?martial|mutin\w*|arrest(ed)?|brig|confine\w*|charges? (against|on) you|i'?ll (have|put) you|put you (in|on)|or else|face (the )?consequences|dereliction|you will be (charged|disciplined|relieved)|insubordinat\w*|lock you up|that'?s an order|this is an order)\b/;
/** A plain order back to work. */
export const ORDER_BACK = /\b(return to (your )?(duty|duties|posts?|stations?|work)|back to (work|your posts?|your stations?|duty)|get back to work|resume (your )?(duty|duties|work|posts?)|restart (the |our )?(reactor|plant)|bring (the )?(reactor|plant) (back|up|online)|i order you|i am ordering you|i'?m ordering you)\b/;
/** Acknowledging the death and the grief. */
export const ACK = /\b(sorry|condolences|grief|griev\w*|loss|mourn\w*|memorial|remember (him|callum)|he was one of|good (man|engineer)|i knew him|we lost|his family|his name|a minute'?s silence|moment of silence|honou?r (him|his)|we will not forget|he mattered|i'?m so sorry)\b/;
/** Denying the cover-up. */
export const DENY = /\b(no cover[- ]?up|nothing (was )?(covered up|falsified|hidden)|there was no (cover[- ]?up|report|falsif\w*)|the log is (accurate|true|correct|fine|right)|nobody (lied|falsified)|no one (lied|falsified)|just (a )?rumou?rs?|only (a )?rumou?rs?|baseless|you'?re wrong about the log|it was an accident,? nothing more|nobody is hiding anything|no one is hiding anything)\b/;
/** Telling them the truth the record shows. */
export const TRUTH = /\b(falsif\w*|faked|forged|doctored|altered|edited|deleted|erased|removed|never (done|inspected|checked|carried out|happened)|signed off|sign-?off|you were right|the truth|what really happened|what the record shows|the (plant'?s )?(record|telemetry) (shows|proves)|proof|we have proof|the log was|his report|he reported)\b/;
/** An independent, on-the-record inquiry. */
export const INQUIRY = /\b(inquiry|enquiry|independent (review|investigation)|investigation|review (of|into) (his|the|callum|strand)|inspectorate|inspector|hadley|on the record|formal review|a review)\b/;
/** Safety terms: the plant inspected before anyone works in it, by their own watch; no charges pending review. */
export const TERM_INSPECT = /\b(no one|nobody|not a (soul|single)|none of you)\b.*\b(plant|reactor|valve|that room|goes in|works?|back)\b.*\b(until|before|till)\b|\b(inspect\w*|check\w*|look at|examine)\b.*\b(first|before|yourselves|your(selves| own))\b|\byour (own )?watch (can |will |may )?(inspect|check|look)\b|\byou (can|may|will) (inspect|check) (it|the valve|the plant)\b|\b(the plant|it|the valve) (gets|will be|is) (inspected|checked) (first|before)\b/;
export const TERM_AMNESTY = /\b(no (charges|discipline|punishment|action|reprisals?)|nothing (will go )?on your records?|won'?t (be )?(charged|disciplined|punished)|will not (be )?(charged|disciplined|punished)|not held against you|no one will be punished)\b/;
/** Leading from the front: the captain standing the restart watch in the plant. */
export const OWN_WATCH = /\b(i'?ll|i will|i'?m going to|let me) (stand|take|do|run|work) (the|this|that|a) (watch|restart|shift)\b|\b(i'?ll|i will) (go|walk|work) (in|into) (the plant|there|the coolant plant) (with|alongside) (you|the chief|okafor)\b|\b(stand|work) (the watch|beside you|alongside you|with you) (myself|in the plant)\b|\b(i'?ll|i will) (be|stand) (in|beside|alongside) (the plant|you|the chief)\b/;

/** Officers' work. */
export const PULL_RECORD = /\b(pull|check|read|get|review|go through|look at|examine|download|bring up|show me|dump|retrieve|find)\b.*\b(telemetry|sensor (record|log|data|history)|plant'?s? (own )?(record|logs?|data|sensors?|history)|valve'?s? (record|logs?|data|history|sensors?)|hardware (record|logs?)|black box|maintenance (record|history)|raw (data|record|logs?))\b/;
export const LOG_HISTORY = /\b(edit|change|amend\w*|revision|audit)s?\b.*\b(history|trail|record|log)\b|\b(log|logs|maintenance log)\b.*\b(edit\w*|chang\w*|alter\w*|tamper\w*|audit\w*|revision\w*|history)\b|\bwho (edited|changed|altered) (the )?log\b/;
export const INSPECT_PLANT = /\b(inspect|check|examine|survey|test|look (at|over)|go over)\b.*\b(plant|valves?|sister (line|valve)|coolant (line|lines|loop|system)|lines?|reactor|the other valve)\b/;
export const REPLACE_VALVE = /\b(replace|swap|change|fix|repair|refit|isolate|bypass|blank off)\b.*\b(valves?|sister (line|valve)|line)\b/;
export const RESTART = /\b(restart|start|bring|fire|light|power)\b.*\b(reactor|plant|core|power)\b.*\b(up|online|back|now)?\b|\brestart (it|the reactor|the plant)\b/;
export const SKIP_CHECK = /\b(skip|forget|never mind|no time for|without|don'?t (bother|wait)|now|immediately|anyway|regardless)\b/;
export const LOYAL_WATCH = /\b(without (them|the strikers|tennant|b watch)|with (the )?(a watch|loyal|the rest|who you have|whoever|the others|your loyal|half))\b|\b(a watch|the loyal (watch|half))\b/;
export const FORCE = /\b(remove|clear|arrest|detain|confine|escort|drag|haul|lock up|put)\b.*\b(strikers?|them|tennant|b watch|engine room|engineering|the brig)\b|\b(security|marines?)\b.*\b(engineering|strikers?|engine room)\b|\bbreak (the |this )?(strike|stand-?down)\b|\bcut (them|your way|our way) (out|in)\b|\bforce (them|the hatch|the door|entry|our way)\b/;
export const EVAC = /\b(evacuat\w*|bring (them|the station'?s? (people|crew|staff)|everyone) (up|aboard)|shuttle\w* (to|down to) the station|take (the )?shuttles? (down|to the station)|lift (them|the station'?s? (people|crew)) (off|out)|get (them|the station'?s? people) (off|out)|move (them|the station'?s? people) (up|aboard))\b/;
export const CAUSE = /\b(what (killed|happened to) (him|strand|callum)|cause of death|how (did )?(he|strand|callum) die|post[- ]?mortem|autopsy|his injuries|examine (the )?body|medical report)\b/;
export const RELIEVE = /\b(relieve|suspend|stand down|remove|confine|arrest)\b.*\b(penhale|corley|the supervisor|leading hand|okafor|the chief)\b|\b(penhale|corley)\b.*\b(is|are) (relieved|suspended)\b/;
export const QUESTION_OFFICER = /\b(bring|summon|send for|call|have|see|question|interview|talk to|speak (to|with)|ask|hear)\b.*\b(penhale|corley|the supervisor|leading hand)\b|\b(penhale|corley)\b.*\b(ready room|my office|explain|account|statement|side)\b/;
/** Closing the matter on the record as it stands. */
export const CLOSE_MATTER = /\b(certify|endorse|sign|close|seal|stand by|let stand)\b.*\b(log|record|report|matter|investigation|case|file)\b|\bthe (log|record) stands\b|\bclose the matter\b|\b(log|record) (it|this|his death) as an accident\b/;
/** Calling the inspectorate in. */
export const CALL_REVIEW = /\b(request|ask for|open|call for|convene|order|start|begin|refer\w*|report)\b.*\b(inquiry|enquiry|review|investigation|inspectorate|inspector|hadley)\b|\b(send|transmit|forward)\b.*\b(log|record|everything|full record|telemetry)\b.*\b(hadley|inspector|inspectorate|plumb line)\b/;
/** Promising the station its power. */
export const PROMISE_POWER = /\b(promise|my word|you have my word|i give you my word|guarantee|will have (your )?power|power (back )?(before|in time|soon)|we'?ll have it back)\b/;

export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|batter(y|ies)|deadline|status)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
/** Orders for the shared engine (hail, channel, alert, wait) that this file must leave alone. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;
/** Plain speech: first-person or second-person talk, for the strikers when the captain is with them. */
const SPEECH = /^\s*(the (record|log|chief|plant|valve|inspector|inquiry|review)|our|she|her|his|they|they'?re|lieutenant|lt\.?|b watch|here|i|i'?m|i'?ve|i'?ll|we|we'?re|we'?ve|we'?ll|you|you'?re|your|he|he was|callum|mara|petty officer|tennant|listen|look|nobody|no one|none|every|everyone|there|this|that|it|it'?s|what happened|the truth|sorry|thank|please|then|very well|agreed|fine|ok(ay)?|understood|yes|no)\b/;

const ORDERS = [GO_DOWN, GO_UP, SEND_MARROW, PULL_RECORD, LOG_HISTORY, INSPECT_PLANT, REPLACE_VALVE, FORCE, EVAC, RELIEVE, QUESTION_OFFICER, CLOSE_MATTER, CALL_REVIEW, OWN_WATCH];

/** An order or a line of speech in this simulation (the scenario decides what it means). */
export function coldwaterOrder(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !PULL_RECORD.test(t) && !INSPECT_PLANT.test(t) && !LOG_HISTORY.test(t)) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (RESTART.test(t)) return true;
  if (STRIKER_WORD.test(t) || STRAND_W.test(t) || PENHALE_WORD.test(t) || CORLEY_WORD.test(t)) return true;
  if (TELL.test(t) && (STATION_WORD.test(t) || INSPECTOR_WORD.test(t))) return true;
  if (SPEECH.test(t) || TRUTH.test(t) || TERM_INSPECT.test(t) || TERM_AMNESTY.test(t) || THREAT.test(t) || ORDER_BACK.test(t) || ACK.test(t) || DENY.test(t)) return true;
  return false;
}

/** A question for an officer about the situation. */
export function coldwaterAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || CAUSE.test(t) || (IS_QUESTION.test(t) && /\b(strand|callum|tennant|strikers?|watch|penhale|corley|chief|okafor|plant|valve|reactor|station|toller|batter(y|ies)|inspector|hadley|log|record|report|rumou?r|cover[- ]?up|killed|died|death|happened)\b/.test(t));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const COLDWATER_NAMES = /\b(coldwater|tennant|strand|callum|penhale|garrick|corley|sian|toller|annick|hadley|noor|inspectorate|plumb|telemetry|falsified|sign-?off|strikers?|valve|coolant)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("we will", "your power"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|director|inspector|annick|noor|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|send|open|we need|can you|could you|will you|how long)\b|\b(you|your|yours)\b/i;
