/**
 * The Weather Engine — the captain's words. Shared by the interpreter rule and the scenario.
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

export const MARIT_WORD = /\b(marit|miss quarrie|ms\.? quarrie|(the|his|quarrie'?s|founder'?s) daughter|the farm)\b/;
export const TULL_WORD = /\b(tull|anwen|steward|meridian hall|the hall|council)\b/;
export const LOWE_WORD = /\b(lowe|bastian|technicians?|apprentice)\b/;
export const SOURCE_POEM = /\b(poems?|poetry|verse|litany|archive)\b/;
export const SOURCE_LETTERS = /\b(letters?|correspondence)\b/;
export const SOURCE_JOURNAL = /\b(journals?|diar(y|ies)|notebooks?|survey log)\b/;

const LOCK_THING = /\b(lock|cipher|challenge|lock ?plate|plate|lock screen|lockout|cypher|puzzle)\b/;
const NOT_WEAPONS = /\b(weapons?|phasers?|torpedo(es)?|target|fire)\b/;

/** Szabo reads the lock (what kind of answer it wants, how many tries, where the failsafe runs). */
export const STUDY = /\b(study|read|look at|examine|analy[sz]e|inspect|pull up|get me|work out|figure out|what does)\b.{0,30}\b(the )?(lock|cipher|challenge|plate|lock screen|cypher)\b/;
/** Szabo works the cipher into a key. */
export const WORK = /\b(work|crack|break|solve|decode|decipher|rebuild|build|reconstruct|assemble|derive|find|start on)\b.{0,40}\b(cipher|cypher|key|code|password|passphrase)\b|\b(crack|break|solve) (it|the lock)\b/;
/** Ask Szabo to narrow an unsure candidate rather than guess. */
export const VERIFY = /\b(verify|check|confirm|narrow|test)\b.{0,30}\b(key|candidate|line|lines|code|it)\b|\btake (your|the) time\b/;
/** Enter a key into the lock. */
export const ENTER = /\b(enter|send|transmit|input|try|submit|key in|type in|feed|use|put in|give the lock)\b.{0,40}\b(key|code|cipher|motto|password|passphrase|phrase|candidate|answer|line|rain is a promise)\b/;
export const MOTTO_WORD = /\b(motto|inscription|over the door|on the door|rain is a promise)\b/;
/** Get one of the founder's sources. */
export const GET_SOURCE = /\b(get|pull|fetch|request|obtain|download|bring|send|open|search|go through|need|ask (for|tull for|the steward for|marit for))\b.{0,40}\b(poems?|poetry|archive|letters?|correspondence|journals?|diar(y|ies)|notebooks?)\b/;
/** Okafor overrides the lock through the control trunk. */
export const OVERRIDE = /\b(override|bypass|brute[- ]?force|hot[- ]?wire|cut (in|into|through)|jump(er)? the)\b.{0,40}\b(lock|engine|station|trunk|controls?|cipher)\b|\b(control trunk|brute[- ]force)\b/;
export const SURVEY_TRUNK = /\b(survey|inspect|check|look at|examine)\b.{0,30}\b(trunk|override|wiring|control lines?)\b|\bcan (we|you) (override|bypass|reach the trunk)\b/;
/** Burn the Engine out to break the storm. */
export const BURN = /\b(burn|blow|crack|destroy|overload|rupture|breach|detonate|wreck|scuttle)\b.{0,30}\b(core|weather engine|the engine|station)\b/;
/** Shelter or evacuate the colony. */
export const SHELTER = /\b(shelter|evacuat\w*|cellars?|take cover|under cover|get (everyone|people|them|the colony) (under|inside|below|to safety|into)|move (the|everyone|people)\b.{0,20}\b(cellars?|shelter)|sound the (alarm|sirens?))\b/;
export const SHUTTLES = /\b(send|launch|fly|use|dispatch|get)\b.{0,30}\b(shuttles?|our shuttles|the shuttles)\b|\bshuttles? (to|for) the (farms?|outlying|homesteads?)\b/;
/** Varga's forecast. */
export const FORECAST = /\b(forecast|landfall|track (the )?storm|model (the )?storm|when (will|does) (the storm|it|the greywall) (hit|land|arrive|reach)|how long (until|before) (the storm|it|the greywall))\b/;
/** Tull: the truth about the founder; a pledge for the Engine; leave to override or burn. */
export const TRUTH = /\b(truth|honest(ly)?|what (did|happened|really)|drove him|worked him|blame|did the council|what you did to|admit|acknowledge|own (it|up))\b/;
export const PLEDGE = /\b(pledge|promise|commit|swear|guarantee|keep (the|his) engine|name (it|the engine)|never (tear|rip|pull)|keep it in his name|his name)\b/;
export const LEAVE = /\b(leave|permission|consent|authori[sz]e|approve|your (word|say)|may we|can we|allow)\b/;
export const FAVOURITE = /\b(favou?rite|loved best|best[- ]loved|read at (his|the) funeral|his poem|which poem)\b/;
/** The unsent letter. */
export const LETTER = /\b(unsent|last|final) letter\b|\bletter (he|your father) (never sent|wrote (to )?you|left (for )?you)\b|\bread (her|it to her|marit|you) (the|his) letter\b|\bhis letter to (her|you|marit)\b/;
/** Ask Marit to go up and enter the key herself. */
export const SHE_ENTERS = /\b(she|marit|you|her)\b.{0,30}\b(enter|type|key|put in|go up|open)\b.{0,30}\b(herself|yourself|key|it|the lock|the engine)\b/;
export const DECLINE = /\b(will not|won'?t|do not|don'?t|refuse|decline|not going to|no)\b.{0,30}\b(burn|blow|destroy|crack|overload|wreck)\b/;
export const HAIL = /\b(hail|call|contact|raise|reach|get|speak (to|with)|talk (to|with)|open a (channel|line) to|patch (me )?through to)\b/;
export const TELL = /\b(tell|say to|let (her|him|them) know|inform|assure|explain to|put it to|make (it )?clear to|ask|offer|show|give)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status|landfall|tries)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will|have)\b/;

const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock\b|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|wait|status|help|options|objectives|beam|transport|computer,? (begin|start|run|end|list|stop))\b/;

/** "Do it anyway": confirming an order an officer has just warned about. */
export const CONFIRM = /^\s*(do it|go ahead|proceed|carry on|make the cut|cut it|overload it|that'?s an order|you have your orders|i said do it|i insist)( anyway| now| regardless|,? that'?s an order)?\s*$/;

const ORDERS = [CONFIRM, STUDY, WORK, VERIFY, ENTER, GET_SOURCE, OVERRIDE, SURVEY_TRUNK, BURN, SHELTER, SHUTTLES, FORECAST, LETTER];

/** An order or line of speech in this simulation. */
export function weatherOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  if (NOT_WEAPONS.test(t) && !BURN.test(t) && !DECLINE.test(t)) return false;
  if (/^\s*(marit|miss quarrie|ms\.? quarrie)\b/.test(t)) return true;
  if (CONFIRM.test(t)) return true;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !FORECAST.test(t) && !STUDY.test(t)) return false;
  if (DECLINE.test(t)) return true;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (TELL.test(t) && (MARIT_WORD.test(t) || TULL_WORD.test(t) || LOWE_WORD.test(t))) return true;
  if (addressee === 'comms' && (LOCK_THING.test(t) || /\b(key|cipher|letters?|poems?|journal)\b/.test(t))) return true;
  if (addressee === 'engineering' && /\b(trunk|override|bypass|core|failsafe)\b/.test(t)) return true;
  if (addressee === 'sensors' && /\b(storm|greywall|landfall)\b/.test(t)) return true;
  return false;
}

export function weatherAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(marit|quarrie|founder|tull|steward|lowe|technician|lock|cipher|key|motto|storm|greywall|landfall|shelter|cellars?|engine|trunk|override|poem|letters?|journal|tries|meridian)\b/.test(t));
}

export const WEATHER_NAMES = /\b(meridian|quarrie|marit|elias|tull|anwen|lowe|bastian|greywall|litany|cellars|steward|cipher|motto|trunk|failsafe|landfall)\b/;

export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

export const SPEECHY = /^\s*(report (?=the|what|how|why|your|everything|in |about)|you|you'?re|you'?ve|you'?ll|the|our|your|my|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?d|i'?ll|it|it'?s|there|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|captain|steward|technician|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|tell me|why|what|how|explain|can you|could you|will you|may|did|does|do)\b|\b(you|your|yours)\b/i;
