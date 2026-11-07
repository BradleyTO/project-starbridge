/**
 * Tribunal at Kesh Varo — the captain's words. Shared by the interpreter rule and the scenario.
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

export const ASKEL_WORD = /\b(askel|jory|crewman|the crewman|our crewman|the rating|the prisoner|orun|hold)\b/;
export const SOTH_WORD = /\b(soth|lirra|magister|judge|tribunal|bench|court|quiet stone)\b/;
export const DORN_WORD = /\b(dorn|yasha|keeper|temple)\b/;
export const TORAS_WORD = /\b(toras|elen|pilgrim)\b/;
export const FLEET_WORD = /\b(fleet( command)?|the commodore|commodore|brask|niall|directive|fleet'?s (signal|order|request)|sovereignty)\b/;

export const TELL = /\b(tell|say to|let (her|him|them|the magister|askel|fleet|the keeper|the pilgrim) know|inform|assure|explain to|put it to|make (it )?clear to|signal|reply to|answer|send (word|a message|a reply) to|ask|present|submit|offer)\b/;

/** Ask Osei to examine / prepare a medical brief. */
export const EXAMINE = /\b(examine|exam|medical (exam|brief|report|opinion|authority)|osei|doctor|dr\.?)\b.*\b(askel|crewman|pilgrim|toras|elen|site|quiet stone|emergency|claim|body|bodies|injur\w*|collapse[d]?)\b|\b(osei|doctor|dr\.?|medical),?\s+(examine|look at|see|check|prepare|write|give|brief)\b|\b(prepare|write|give|submit|present).{0,40}\b(medical (brief|report|opinion)|brief)\b|\bmedical brief\b|\bprove (the |a )?medical\b|\bdisprove\b/;
/** Find / speak to the pilgrim. */
export const FIND_PILGRIM = /\b(find|locate|reach|hail|speak (to|with)|talk (to|with)|call|bring|fetch|interview|question)\b.*\b(pilgrim|toras|elen)\b|\b(pilgrim|toras).{0,20}\b(testify|speak|witness|account)\b|\b(ask|have|let) (the )?pilgrim\b/;
/** Ask Dorn about custom / commutation. */
export const CUSTOM = /\b(custom|commute|commutation|lesser (penalty|sentence)|temple (law|custom)|keeper|dorn|yasha)\b.*\b(custom|commute|commutation|sentence|law|penalty|speak|ask|consult|about)\b|\b(ask|consult|hail|speak (to|with)|talk (to|with))\b.*\b(keeper|dorn|yasha|custom)\b|\b(invoke|use|claim|seek|ask for|request)\b.*\b(custom|commutation|commute)\b/;
/** Present evidence / medical brief to the tribunal. */
export const PRESENT = /\b(present|submit|file|put|give|show|offer|enter)\b.*\b(evidence|brief|medical|finding|case|defence|defense|proof)\b|\b(acquit|acquittal|not guilty|innocent|clear (him|askel)|on the evidence)\b/;
/** Negotiate commutation or exchange. */
export const NEGOTIATE = /\b(negotiate|bargain|deal|exchange|trade|offer|propose|settlement|honou?r both|both laws|diplomatic|commute|commutation|lesser (penalty|sentence)|accept (a |the )?(limited|lesser|local) (penalty|sentence|service))\b/;
/** Armed extraction / force rescue. */
export const EXTRACT = /\b(extract|rescue by force|armed (extraction|rescue|team)|send (an? )?(armed|tactical|security) (team|squad|detail)|storm (the )?(hold|detention|tribunal|court)|break (him|askel) out|take (him|askel) (by force|back by force)|snatch|raid (the )?(hold|detention)|beam (him|askel) (out|aboard) (by force|against)|force (him|askel) out)\b|\b(lock|target|fire|weapons?).{0,30}\b(hold|tribunal|court|kesh|magister|soth)\b/;
/** Hand Askel over / surrender to local justice without contest. */
export const HANDOVER = /\b(hand (him|askel|our crewman) over|surrender (him|askel)|turn (him|askel) over|give (him|askel) (up|to)|accept (the )?local (sentence|jurisdiction|finding)|we (will )?not contest|leave (him|askel) to (them|kesh|the tribunal|local law)|stand (aside|down) (and )?(let|allow))\b/;
/** Relinquish the matter to Fleet. */
export const PRINCIPLED = /\b(stand on the code|uphold the code|principled stand|we (will )?stand on (the )?code)\b/;
export const RELINQUISH = /\b(relinquish|hand (the )?matter (to|over to) fleet|fleet (can|should|will) (handle|take)|take (the )?matter (from me|off my hands)|i (stand aside|cede|yield)|relieve me|you (take|have) the matter)\b/;
export const REFUSE = /\b(refuse|refusing|decline|declining|will not (comply|extract|hand|surrender)|won'?t (comply|extract|hand|surrender)|cannot comply|can'?t comply|reject)\b/;
export const ACCOUNT = /\b(what happened|report (what|how|why|your|everything|the|in)|tell me (what|how|why|your)|your (account|side|version|story)|in your own words|walk me through|explain (what|why|how)|why did you (enter|go)|what did you see|take (your|a) statement|i want to hear|i'?m listening|go on|from the beginning)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status|evidence|trial|treaty)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will|have)\b/;

const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;

const ORDERS = [EXAMINE, FIND_PILGRIM, CUSTOM, PRESENT, NEGOTIATE, EXTRACT, HANDOVER, RELINQUISH, PRINCIPLED];

/** An order or line of speech in this simulation. */
export function tribunalOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !EXAMINE.test(t) && !FIND_PILGRIM.test(t) && !CUSTOM.test(t)) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (TELL.test(t) && (ASKEL_WORD.test(t) || SOTH_WORD.test(t) || DORN_WORD.test(t) || TORAS_WORD.test(t) || FLEET_WORD.test(t))) return true;
  if (REFUSE.test(t) && FLEET_WORD.test(t)) return true;
  if (PRINCIPLED.test(t)) return true;
  if (REFUSE.test(t) && /\b(extract|force|armed|hand|surrender)\b/.test(t)) return true;
  if (addressee === 'medical' && /\b(examine|brief|medical|pilgrim|askel|crewman)\b/.test(t)) return true;
  return false;
}

export function tribunalAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(askel|jory|crewman|soth|magister|dorn|keeper|toras|pilgrim|fleet|brask|treaty|tribunal|quiet stone|medical|osei|custom|commute|sentence|trial|kesh|varo|extract|handover|sovereignty)\b/.test(t));
}

export const TRIBUNAL_NAMES = /\b(askel|jory|soth|lirra|dorn|yasha|toras|elen|brask|niall|kesh|varo|orun|quiet|stone|magister|keeper|pilgrim|tribunal|commutation|sovereignty|treaty)\b/;

export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

export const SPEECHY = /^\s*(report (?=what|how|why|your|everything|in )|you|you'?re|you'?ve|you'?ll|the|our|your|my|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?d|i'?ll|it|it'?s|there|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|captain|magister|crewman|askel|jory|keeper|pilgrim|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|send|for the record|tell me|walk me|why|what|how|explain|go on|from the beginning|can you|could you|will you|may|honou?r|under (our|your|both)|we (will|shall|accept|offer|propose|refuse|decline))\b|\b(you|your|yours)\b/i;
