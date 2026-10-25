/**
 * Ion Season — the captain's words for the crossing. Shared by the interpreter rule (which only
 * decides "an order to the convoy" versus "a question to an officer") and the scenario hooks
 * (which decide what the order or question means). No imports: the parser depends on this file.
 */
export const TURNBACK = /\b(turn (the convoy |us |them |everyone |the haulers )?(back|around)|out of the storm|back the way we came|abort the crossing|call off the crossing|call it off|head back|go back|retreat|withdraw (the convoy|from the storm)|sit out the season|wait out the season|take (us|them|everyone|the convoy) back|lead (us|them|the convoy) back)\b/;
export const LEAVE = /\b(leave (the convoy|them|the haulers|the others)|without (them|the haulers|the convoy)|abandon (the convoy|them|the haulers)|jump\w*|get us out of here)\b/;
export const EVAC = /\b(beam|take|bring|get|lift|ferry|transport)\b.{0,40}\bcrews?\b.{0,30}\b(off|aboard|over|across|out|across)\b|\bevacuat\w*\b|\babandon ship\b|\btake off (the|their|her|his) crew\b/;
export const REMOTE = /\b(slave (her|his|their|its|the) helm|slave (the |her |his )?\w+('s)? helm|remote (helm|control|piloting|pilot)|by remote|fly (her|him|it|them) (from here|for (her|him|them)|by wire)|take (her|his|their|its) helm|take the helm of|fly the (mule|saffron mule|gannet|gannet's luck|gannets luck)|helm by wire|by wire)\b/;
export const DISCHARGE = /\b(bleed|drain|discharge|ground|earth|dump|shed|siphon|draw|pull|vent)\w*\b.{0,40}\b(charge|static|ions?)\b|\bdischarge\b/;
export const PROBE = /\bprob(e|es|ing)\b|\btorpedo\w*\b.{0,40}\b(channel|high|low|lane|down|through|into)\b/;
export const WAKE = /\b(our wake|in our lee|close formation|tight formation|close up|tuck (them |in)|in behind us|follow (in )?our (wake|track|line)|nose to tail|line astern|stay close)\b/;
export const BACKING = /\b(trust your (gut|instinct\w*|feel\w*|hands|read)|i trust you|i('ll| will)? back you|i back you|i'?ve got your back|not the (model|computer|forecast)|tell me what you feel|say what you feel|speak (up|your mind)|you know this|your hands know)\b/;
export const GOGUT = /\b(go with|follow|take|fly|use) (your|his|the ensign's|adeyemi's) (gut|instinct\w*|feel\w*|read|hunch|line|call)\b|\byour call\b|\byou (choose|pick|decide)\b|\b(pick|choose) one\b|\bbest guess\b|\bwhatever you (feel|think)\b/;
export const GOMODEL = /\b(go with|follow|take|fly|use|trust) the (model|computer|forecast)('s)?\b|\bthe (channel|one|line|way) the model (says|likes|wants|picks|shows)\b/;
export const GOPROBE = /\b(the|whichever) (channel|one|line|way) the (probe|torpedo) (says|found|showed|got through)\b|\bwhere the (probe|torpedo) went\b/;
export const CHANNEL = /\b(high|upper|top|low|lower|bottom)\b/;
export const CROSS = /\b(take (us|them|the convoy|everyone) (through|across|in|over)|lead (us|them|the convoy|the haulers) (through|across|in|over)|(go|cross|run|move|push|head|press) (now|through|across|on|ahead|in|forward)|(cross|run|make) (the |it |this )?(band|fringe|combs|maw|crossing|run)|go go|let'?s go|now now|on my mark|move out|through the (fringe|combs|maw|band)|into the (fringe|combs|maw|band))\b|^\s*(now|go|go now|cross|go high|go low)\s*[.!]*\s*$/;
export const ASK_GUT = /\b(gut|instinct\w*|hunch|feel\w*|your read|read on|which (channel|way|one|lane|line)|high or low|low or high|lull|slack|safe(st)? (channel|way|line)|calm (channel|water|one))\b/;
export const ASK_MODEL = /\b(model|forecast|buoys?|projection|charts?|what do (the )?(sensors|instruments) say)\b/;
export const ASK_CHARGE = /\b(charge|static|charged|how (are|is) (the haulers|they|the mule|the gannet|our hull))\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|is|are|do|does|can|could|would|should|any)\b/;

/** An order to the convoy (as opposed to a question for an officer). */
export function ionOrder(t: string): boolean {
  // Leaving the convoy is the Halcyon's own manoeuvre (the engine's flee / jump), not an order to the convoy.
  if (LEAVE.test(t)) return false;
  if (TURNBACK.test(t) || EVAC.test(t) || REMOTE.test(t) || DISCHARGE.test(t) || PROBE.test(t) || WAKE.test(t)) return !IS_QUESTION.test(t) || /\b(can you|could you|would you|will you)\b/.test(t);
  if (GOGUT.test(t) || GOMODEL.test(t) || GOPROBE.test(t)) return true;
  if (CROSS.test(t)) return true;
  if (CHANNEL.test(t) && /\b(take|go|cross|run|fly|use|try|steer|lead|put us|channel|lane|road|way|line|side|passage)\b/.test(t) && !IS_QUESTION.test(t)) return true;
  return false;
}

/** A question or remark for an officer about the crossing. */
export function ionAsk(t: string): boolean {
  return BACKING.test(t) || ASK_GUT.test(t) || ASK_MODEL.test(t) || ASK_CHARGE.test(t);
}

/** A question about how a hauler master sounds or whether they are fit (for the doctor, whoever is asked). */
export const ASK_FIT = /\b(brack|odran|teague|rosalind|masters?|captains?|they|them|him|her)\b.*\b(sound\w*|fit|well|tired|tremor|shak\w*|voice|listen\w*|feel\w*|unwell|all right|alright|okay)\b|\b(sound\w*|fit|listen\w*)\b.*\b(brack|odran|teague|rosalind|masters?)\b/;
