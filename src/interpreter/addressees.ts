/**
 * v0.7.1: recognising two things the crew-order grammar never covered, compositionally rather
 * than by phrase list:
 *
 *   fleetAddress(t)   — a comms verb ("hail", "get me", "patch me through to", "open a secure line
 *                       to", "send a message to"…) followed, within a few words, by an ISA addressee
 *                       ("the ISA", "Fleet", "Fleet Command", "Command", "HQ", "Training Command"…).
 *   careerQuestion(t) — a question or request about the captain's own training: needs, strengths,
 *                       progress, the record, or a recommended simulation.
 *
 * Input is lower-case, trimmed, without trailing punctuation.
 */

const VERB =
  "(?:hail|contact|call|raise|reach|ring|signal|message|ping|page|notify|inform|tell|ask|get(?: me)?|get (?:me |us )?(?:on the line with|a line to)|patch (?:me |us |it )?through to|put (?:me |us )?through to|connect (?:me |us )?(?:to|with)|link (?:me |us )?(?:to|with|up with)|open (?:a |the |up a )?(?:secure |subspace |priority |direct |private )?(?:channel|line|link|comms?(?: ?link)?|frequency)(?: to| with)?|establish (?:a |the )?(?:secure |direct )?(?:link|channel|line|contact|comms)(?: to| with)?|send (?:a |an )?(?:message|signal|transmission|report|word|note|update)?\\s*(?:to|back to)|(?:speak|talk) (?:to|with)|get in touch with|check in with|report (?:in )?to|call (?:in to|up|back to)|reach out to)";
const ADDRESSEE =
  "(?:(?:the )?i\\.?s\\.?a\\.?(?: fleet)?(?: command| headquarters| hq| ops| operations)?|(?:isa )?fleet(?: command| headquarters| hq| ops| operations)?|(?:isa )?training command|(?:isa )?command(?: hq| headquarters)?|(?:isa )?headquarters|hq|(?:the )?admiralty|admiral kaine|(?:the )?(?:space )?agency|starbase|home base)";
const FILLER = "(?:(?:me|us|the|please|now|immediately|quickly|for me|again)\\s+){0,3}";
const FLEET = new RegExp(`\\b${VERB}\\s+${FILLER}(${ADDRESSEE})\\b(?!\\s+(?:space|territory|border|law|ship|vessel|claim|side|of (?:the|this) (?:ship|bridge)))`);
/** "Command" alone is only an addressee right after the verb, at the end ("hail command"). */
const BARE_COMMAND = /\bcommand\b/;

export type FleetAddressee = 'fleet' | 'training';

export function fleetAddress(t: string): { to: FleetAddressee; rest: string } | null {
  const m = FLEET.exec(t);
  if (!m) return null;
  const who = m[1];
  // "Command" alone ("hail command") must end the order: "call command to battle stations" is not a hail.
  if (/^(?:isa )?command$/.test(who) && !/^\s*(?:please|now|for me)?\s*$/.test(t.slice(m.index + m[0].length))) return null;
  if (BARE_COMMAND.test(who) && /\b(?:on|at|under|in) (?:my |your )?command\b/.test(t)) return null;
  const rest = t.slice(m.index + m[0].length).replace(/^\s*(?:and|then|to|,)?\s*(?:ask|tell|say|about|that)?\s*/, '').trim();
  return { to: /training/.test(who) ? 'training' : 'fleet', rest };
}

export type CareerTopic = 'needs' | 'strengths' | 'progress' | 'record' | 'recommend';

const SELF = /\b(?:i|i'm|im|me|my|myself|mine|captain'?s)\b/;
const SHIP_ORDER = /\b(?:fire|torpedo\w*|phasers?|beams?|lock (?:on|weapons)|shields?|evasive|intercept|approach|hail the|scan the|helm|warp|jump|tractor|transport\w*|beam (?:them|him|her|over|aboard)|red alert|yellow alert)\b/;
const SIM = '(?:sims?|simulations?|exercises?|drills?|scenarios?|training(?: run| missions?| exercises?)?)';

export function careerQuestion(raw: string): CareerTopic | null {
  const t = raw.replace(/^(?:computer|number one|first officer|xo|commander|marrow|varga|science)[,:]?\s+/, '');
  if (SHIP_ORDER.test(t)) return null;
  const recommend =
    new RegExp(`\\b(?:recommend\\w*|suggest\\w*|advis\\w*|propos\\w*)\\b.*\\b(?:${SIM}|next|for me|should i|to (?:run|try|do))\\b`).test(t) ||
    new RegExp(`\\b(?:which|what) ${SIM} (?:should|would|could|do you|ought)\\b`).test(t) ||
    new RegExp(`\\bwhat (?:should|would you have) i (?:run|try|do|practi[cs]e|train on)\\b(?! .*\\b(?:about|with) (?:the|them|it|her|him)\\b)`).test(t) ||
    new RegExp(`\\b(?:next|best) ${SIM} (?:for me|to (?:run|try|do))\\b`).test(t);
  if (recommend) return 'recommend';
  const careerWord = /\b(?:train\w*|competenc\w*|skills?|strengths?|strongest|weak\w*|evaluations?|assessments?|after-action|record|progress\w*|perform\w*|improv\w*|work on|develop\w*|grades?|standing)\b/;
  if (!SELF.test(t) && !/\b(?:training record|competenc\w*)\b/.test(t)) return null;
  if (!careerWord.test(t) && !/\bhow am i doing\b|\bhow'?m i doing\b|\bwhere do i stand\b/.test(t)) return null;
  if (/\b(?:strengths?|strongest|strong (?:at|in|points?)|good at|best at|excel\w*)\b/.test(t)) return 'strengths';
  if (/\b(?:weak\w*|gaps?|lacking|concerns?|improv\w*|work on|need\w* (?:to )?(?:train|training|practi[cs]e|learn|study|develop)|do i need|should i (?:train|practi[cs]e|study|learn))\b/.test(t)) return 'needs';
  if (/\bhow (?:am i|'?m i|is my|are my|has my|have my)\b|\bwhere do i stand\b|\bmy (?:progress|performance)\b|\bhow (?:well )?(?:am i|i am) (?:doing|performing|progressing)\b/.test(t)) return 'progress';
  if (/\b(?:record|evaluations?|assessments?|after-action|competenc\w*|grades?|standing)\b/.test(t)) return 'record';
  if (/\btrain\w*\b/.test(t)) return 'needs';
  return null;
}
