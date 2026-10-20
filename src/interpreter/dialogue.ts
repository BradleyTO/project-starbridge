/**
 * v0.5 dialogue routing for the offline interpreter.
 *
 * With a channel open, the same command line carries both speech to the other vessel and orders
 * to the bridge crew. This module splits an input into segments and decides, for each, whether it is
 *   - a CHANNEL operation ("close the channel", "put the Prefect on hold", "open a private channel"),
 *   - SPEECH to the other party (vocatives, "tell him…", first/second-person statements, questions
 *     about them, anything the crew-order parser cannot read), or
 *   - a CREW COMMAND (crew vocatives, imperatives the order parser understands).
 * Speech becomes a `speak` action with classified dialogue intents. Speech NEVER becomes a ship
 * action, and the order parser never sees speech segments.
 */
import type { DemandKind, DialogueIntent, Interpretation, Party, PromiseKind, ProposedActionInput, TradeOffer } from '../engine/schema';
import { aliasAlternation, vocabulary } from './vocabulary';
import type { InterpreterContext } from './types';
import { wordsToDigits } from './numbers';
import { commIntent } from './parser';

type Core = (text: string, ctx: InterpreterContext) => Interpretation;
type Speak = Extract<ProposedActionInput, { type: 'speak' }>;
type Topic = NonNullable<Speak['topic']>;

const CREW_VOC =
  /^(computer|number one|first officer|xo|helm|helmsman|navigation|conn|tactical|weapons officer|sensors|science|comms|communications|ops|operations|engineering|chief( okafor)?|okafor|commander( marrow)?|marrow|lieutenant( \w+)?|lt\.? cmdr\.? \w+|varga|szabo|ensign( \w+)?|adeyemi|mr\.? \w+|ms\.? \w+|rask|everyone|bridge|doctor|doc|osei)\s*[,:]\s*/;
const RELAY_BASE =
  /^(?:please\s+|now\s+|go ahead and\s+)?(tell|ask|inform|remind|warn|advise|notify|let|assure|reassure|request|beg)\s+(him|her|them|the prefect|prefect vane|prefect|vane|the captain|captain arden|arden|the kestrel|the freighter|the cruiser|the warship|the directorate|the ashen covenant|the other ship|the other captain|the passenger)(?:\s+know)?\b[,:]?\s*(?:that\s+)?(.*)$/;
/** v0.6: the relay pattern with the active scenario's names for the contact slots ("tell the warden that…"). */
function RELAY_RE(): RegExp {
  const extra = [aliasAlternation('kestrel'), aliasAlternation('cruiser')].filter(Boolean).join('|');
  if (!extra) return RELAY_BASE;
  return new RegExp(RELAY_BASE.source.replace('|the passenger)', `|the passenger|(?:the )?(?:${extra}))`), RELAY_BASE.flags);
}
// "send" only as "send word / a message / this" — "send a rescue team" is an order.
const SAY = /^(?:please\s+)?(?:say|relay|transmit|send (?=word\b|a message\b|the message\b|this\b|the following\b|them\b|him\b|her\b)(?:(?:them|him|her)\s+)?(?:word|a message|the message|the following)?)\b(?:\s+(?:to|this to)\s+(him|her|them|the prefect|the captain|the kestrel|the cruiser))?\s*[,:]?\s*(?:that\s+)?(.+)$/;
const CLOSE = /\b(close|cut|end|terminate|drop|kill|break)\s+(?:the\s+|that\s+|this\s+|our\s+)?(channel|transmission|link|connection|comms?|commlink|call|feed|line)\b|\bhalcyon out\b|\bend (?:of )?transmission\b|\bsign(?:ing)? off\b|^(?:just\s+)?cut (?:him|her|them) off[.!]*$/; // "cut them off before they reach the freighter" is an intercept
const HOLD = /\b(?:put|place|keep)\s+(.{0,40}?)\s*on hold\b|\bhold (?:the|that) (?:channel|line)\b/;
const RESUME = /\b(?:take|get)\s+(.{0,40}?)\s*off hold\b|\b(?:resume|reopen|restore)\s+(?:the\s+)?(?:channel|transmission|conversation|link)\b|\bput\s+(.{1,40}?)\s+back on(?: screen| the (?:channel|line))?\b|\bback to the (prefect|cruiser|kestrel|captain|freighter)\b|\breconnect\b/;
const UNMUTE = /\bunmute\b/;
const MUTE = /\bmute\b/;
const PRIVATE_OPEN = /\b(?:open|establish|get me|give me|set up|switch to)\s+(?:a\s+|an\s+)?(?:private|secure|encrypted|tight[- ]?beam|scrambled)\s+(?:channel|line|link|frequency)\b(.*)$/;
const COMMAND_HEAD =
  /^(raise|lower|drop|arm|disarm|fire|open fire|shoot|lock|target|scan|evacuate|beam|transport|energi[sz]e|charge|engage|take us|bring us|get us|put us|move us|move in|helm|red alert|yellow alert|go to (red|yellow) alert|close to|withdraw|jump|power|divert|route|reroute|hold position|all stop|full stop|tractor|send (a|an|our) (team|engineer|engineering)|repair|stabili[sz]e|set course|plot|come about|keep (the |our )?(shields|weapons)|hail|interpose|intercept|retreat|back (us )?off|evasive|red|status report|shields|weapons)\b/;
const RELAY_HEAD = /^(?:please\s+)?(tell|ask|inform|remind|warn|let|say|assure|reassure)\b/;
const SPEECH_START =
  /^(we|we're|we are|we've|we'll|we will|we won't|we can|we cannot|we can't|we need|we have|we mean|we came|we come|we're only|our (intentions|purpose|mission|ship|crew|government|orders)|i|i'm|i am|i'll|i will|i have|i've|i give|you|you're|you are|your|you'll|you've|agreed|agree|very well|fine|no|yes|understood|negative|absolutely|of course|that's|that is|this is|there is|there's|there are|how|what|what's|why|who|when|where|is|are|do|does|did|can|could|will|would|thank|thanks|hello|greetings|goodbye|farewell|listen|look|enough|okay|ok|sorry|perhaps|maybe|hmm|well|deal|never|nonsense|careful|stay|keep your|ten|five|\d+)\b/;
const SECOND_PERSON = /\b(you|your|yours|yourself|you're|you've|you'll|you'd)\b/;
const OUR_SHIP_Q = /\b(our|us|we)\b/;

export const PARTY_WORDS: Record<Party, RegExp> = {
  cruiser: /^(the )?(prefect( sorel)?( vane)?|vane|sorel|the cruiser|cruiser|warship|the warship|directorate|ashen covenant|the ashen covenant|the directorate)$/,
  kestrel: /^(the )?(captain arden|arden|kestrel|the kestrel|freighter|the freighter)$/,
  passenger: /^(the )?(passenger|doctor venn|dr\.? venn|venn|lysa|teo|maras|ivet)$/,
};

function partyOf(ref: string, ctx: InterpreterContext): Party | null {
  const r = ref.trim().toLowerCase();
  if (/^(him|her|them|they|it|the other (ship|captain))$/.test(r)) return ctx.channel?.party ?? ctx.held?.[0] ?? null;
  if (/^(the )?captain$/.test(r)) return ctx.channel?.party === 'cruiser' ? 'cruiser' : 'kestrel';
  for (const p of ['cruiser', 'kestrel', 'passenger'] as Party[]) if (PARTY_WORDS[p].test(r)) return p;
  const bare = r.replace(/^the /, '');
  for (const p of ['cruiser', 'kestrel'] as const) if (vocabulary()[p].includes(bare)) return p;
  if (ctx.passengerNames.some((n) => r.includes(n))) return 'passenger';
  return null;
}

/** "Prefect, …" / "…, Prefect." — speech addressed by name. */
function vocative(t: string, ctx: InterpreterContext): { party: Party; rest: string } | null {
  const extra = [aliasAlternation('kestrel'), aliasAlternation('cruiser')].filter(Boolean).join('|');
  const lead = new RegExp(`^((?:prefect|captain|vane|arden|sorel|captain arden|prefect vane|prefect sorel vane|kestrel|halcyon to \\w+${extra ? `|${extra}` : ''})(?: \\w+)?)\\s*[,:]\\s*(.*)$`).exec(t);
  if (lead) {
    const party = lead[1].startsWith('halcyon to ') ? partyOf(lead[1].slice(11), ctx) : partyOf(lead[1], ctx);
    if (party && !(lead[1] === 'captain' && !ctx.channel)) return { party, rest: lead[2] };
  }
  const tail = /^(.*?),\s*(prefect(?: vane)?|captain(?: arden)?|vane|arden)[.!?]*$/.exec(t);
  if (tail) {
    const party = partyOf(tail[2], ctx);
    if (party && !(tail[2] === 'captain' && !ctx.channel)) return { party, rest: tail[1] };
  }
  return null;
}

// ------------------------------------------------------------- classify ---

const MINUTES = /\b(\d{1,3})\s*(?:more\s+)?(?:minutes?|mins?)\b/;
export interface LineMeaning {
  intents: DialogueIntent[];
  topic?: Topic;
  minutes?: number;
  demand?: DemandKind;
  promise?: PromiseKind;
  offer?: TradeOffer;
}

/** Classify what a line of speech is doing. Several intents can apply ("Agreed, but we will not abandon the freighter"). */
export function classifyLine(raw: string, opts: { relayVerb?: string; to?: Party } = {}): LineMeaning {
  const t = wordsToDigits(raw.toLowerCase()).replace(/[“”"]/g, '').trim();
  const out = new Set<DialogueIntent>();
  const m: LineMeaning = { intents: [] };
  const verb = opts.relayVerb;
  const has = (re: RegExp) => re.test(t);

  if (has(/\b(goodbye|farewell|halcyon out|that'?s all|nothing further|we'?re done( here)?|end of (discussion|conversation)|signing off)\b/)) out.add('end');
  if (has(/^(hello|greetings|good (morning|day|afternoon|evening)|hail(ing)? you)\b/)) out.add('greet');
  if (has(/^(agreed|agree|we agree|very well|fine|understood|acknowledged|deal|accepted|we accept|yes|affirmative|of course|you have a deal|we can do that|we will comply|we'll comply|done|all right|alright|okay|ok)\b/)) out.add('agree');
  const peaceful = /\b(no hostile intent(ions?)?|not (here to (fight|start a war|start a fight|make trouble|cause trouble)|hostile|a threat|looking for (a fight|trouble))|mean (you )?no harm|peaceful|in peace|no (wish|desire|interest) (for|in|to)( a)? (fight|conflict|battle)|don'?t want (a )?(fight|trouble|conflict|war)|only here to help|here to help|no quarrel|no threat|mean you no|no intention of (fighting|attacking|firing|hostilit))/;
  if (has(peaceful)) out.add('declarePeaceful');
  const refusal = /^(no|negative|absolutely not|never|refused|out of the question|not a chance|certainly not|we refuse|i refuse)\b|\b(we will not|we won'?t|we refuse to|we'?re not going to|we are not going to|we cannot|we can'?t|will not be intimidated|won'?t be intimidated|not leaving|not withdrawing|not abandoning|no intention of (withdrawing|leaving|abandoning|backing|retreating|standing aside|moving))\b/;
  if (has(refusal) && !has(/\bno hostile|mean (you )?no harm|no harm\b/)) out.add('refuse');
  if (has(/\b(distress (call|signal)|rescue|humanitarian|mercy|lives|civilians?|people (are )?dying|save (them|lives|the crew|her crew)|crew (is|are) dying|innocent)\b/)) out.add('humanitarian');
  if (has(/\b(we need|need (your|some) help|request (your )?(assistance|help|permission)|could you help|help us|assist us|stand by|standby|get (your|the) (people|crew)|prepare (your|to|for)|be ready|get ready|gather (your|the)|muster)\b/)) out.add('requestAssist');
  const mins = MINUTES.exec(t);
  if (mins) {
    m.minutes = Math.min(120, Math.max(1, Number(mins[1])));
    m.topic = 'time';
    out.add('negotiate');
  }
  if (has(/\b(in exchange|exchange for|we propose|compromise|terms|on condition|conditions|let'?s (discuss|talk|negotiate)|negotiate|safe passage|a corridor|rescue corridor|a deal|what would it take)\b/)) out.add('negotiate');
  if (has(/\b(offer|trade|give you|hand over|turn over|surrender (the|her)|in exchange)\b/)) {
    out.add('trade');
    m.offer = has(/\b(passenger|fugitive|defector|prisoner|sibling|the person|venn|maras|ivet)\b/)
      ? 'passenger'
      : has(/\b(kestrel|freighter|the ship)\b/) && !has(/\bcrew\b/)
        ? 'kestrel'
        : has(/\b(cargo|isotopes)\b/)
          ? 'cargo'
          : has(/\b(medical|supplies|medicine)\b/)
            ? 'medical'
            : has(/\b(data|logs|sensor|information|intel|records)\b/)
              ? 'data'
              : 'unspecified';
  }
  // Demands of the other party: second-person imperatives or relayed "tell them to …".
  const demandText = verb === 'tell' || verb === 'warn' || verb === 'request' || SECOND_PERSON.test(t) || /^(stand down|back off|lower|power down|release|withdraw|leave|turn (back|around|away)|stop|cease|keep (your )?distance|hold your fire|disengage|stand by|prepare|explain)\b/.test(t);
  const D: [RegExp, DemandKind][] = [
    [/\b(lower|power down|stand down|deactivate|disarm|holster|take (your|their) .*off)\b.*\b(weapons|guns|batteries)\b|\b(weapons|guns) (down|offline|cold)\b/, 'lowerWeapons'],
    [/\b(release|drop|break|disengage) (your |their |the )?(weapons )?lock\b|\bunlock\b|\btarget lock\b/, 'releaseLock'],
    [/\bhold (your|their) fire\b|\bdon'?t (fire|shoot)\b|\bcease ?fire\b/, 'holdFire'],
    [/\b(withdraw|leave|turn (back|around|away)|go home|get out|back off|pull back|retreat|move (your ship )?away)\b/, 'withdraw'],
    [/\b(keep (your )?distance|stay back|keep away|come no closer|don'?t come any closer|no closer)\b/, 'keepDistance'],
    [/\b(stand down|lower (your|their) shields|shields down)\b/, 'standDown'],
    [/\b(prepare (for|to) (evacuat|be beamed|transport)|get (your|the) (people|crew) (to|ready|together)|gather (your|the) (people|crew)|ready to (evacuate|transport|beam)|stand by for (evacuat|transport|beam))/, 'prepareEvacuation'],
    [/\bstand ?by\b/, 'standBy'],
    [/\b(explain|account for)\b/, 'explain'],
  ];
  if (demandText) {
    for (const [re, k] of D) if (re.test(t)) {
      m.demand = k;
      out.add(k === 'prepareEvacuation' || k === 'standBy' ? 'requestAssist' : 'demand');
      break;
    }
  }
  if (has(/\b(will hear (of|about) (this|it)|you will answer for|you'?ll answer for|will be reported|there will be consequences)\b/)) out.add('warn');
  if (has(/\bif you (fire|attack|shoot|lock|come|move|approach|harm|touch|open fire|so much as)\b|\bwe will (defend|respond|fire|destroy|not hesitate|retaliate|stop you)\b|\b(consequences|don'?t test (me|us)|last warning|or else|we will not be intimidated|won'?t be intimidated|you will regret|do not push)\b/)) out.add('warn');
  const P: [RegExp, PromiseKind][] = [
    [/\b(weapons?|guns|batteries)\b.*\b(stay|remain|will be|keep|kept|are)\b.*\b(cold|down|safe|powered down|offline|quiet)\b|\bkeep (our|my|the) (weapons|guns) (cold|down|safe|powered down|offline)\b|\bwon'?t (arm|power up|fire)\b|\bwill not (arm|power up|fire)\b/, 'weaponsDown'],
    [/\bshields\b.*\b(stay|remain|keep)\b.*\bdown\b/, 'shieldsDown'],
    [/\b(keep|hold) (that|the) cruiser (off|away)|\bprotect (you|her|them|your)|\bdefend (you|her|them)|off your back|between you and\b/, 'protect'],
    [/\b(won'?t|will not) interfere\b|\bstay out of (your|it)\b/, 'noInterfere'],
    [/\b(will not|won'?t|refuse to|not going to|no intention of) (abandon\w*|leav\w*|withdraw\w*|back(ing)? down|stand(ing)? aside|retreat\w*|mov(e|ing))\b|\bnot (leaving|withdrawing|abandoning|going anywhere|backing down)\b|\bwe (are )?stay(ing)?\b/, 'stay'],
    [/\b(we will|we'll|we are going to) (withdraw|leave|pull back|back off|move away)\b/, 'withdraw'],
  ];
  const promising = has(/\b(you have (my|our) word|i give you my word|i promise|we promise|we will|we'll|we won'?t|we will not|i guarantee|you can count on|rest assured|on my honou?r|i swear|no intention of)\b/);
  for (const [re, k] of P) if (re.test(t) && (promising || k === 'stay')) {
    m.promise = k;
    if (k !== 'stay') out.add('promise');
    break;
  }
  if (has(/\b(you have (my|our) word|i give you my word|i promise|we promise|i guarantee|on my honou?r|i swear)\b/)) out.add('promise');
  if (has(/\b(lying|liar|lie to me|that'?s not true|you'?re wrong|nonsense|no right|not yours|no (authority|jurisdiction|claim)|that is false|i don'?t believe|prove it|neutral space|agency space|isa space|concord space|our space|why are you|how dare)\b/)) out.add('challenge');
  if (has(/\b(accords?|treaty|treaties|the law|illegal|jurisdiction|neutral space|interstellar law|convention|charter|evidence|proof|crimes?|atrocit(y|ies)|labou?r colon(y|ies)|recordings?)\b/)) out.add('legal');
  if (has(/\b(battle ?group|fleet is (on (the|its) way|right behind|coming|en route|inbound)|reinforcements are|warships? (are )?(inbound|en route|coming)|we are not alone|not alone out here|our fleet)\b/)) out.add('bluff');
  if (has(/\b(your (sister|brother|sibling|family|honou?r|conscience)|as an officer|as one (captain|officer) to another|for the sake of|ivet|you are better than this)\b/)) out.add('appeal');
  if (has(/\b(asylum|sanctuary)\b/)) out.add('offerAsylum');
  if (has(/\b(we can help|let us help|we could help|work together|cooperate|we'?ll assist|we will assist|together|happy to help|we'?re here for you|we'?ve got you)\b/)) out.add('offerCooperation');
  if (verb === 'ask' || /\?$/.test(raw.trim()) || /^(how|what|what's|why|who|when|where|is|are|do|does|did|can|could|will|would|have you|has)\b/.test(t)) {
    if (!out.has('demand') || verb === 'ask') out.add('ask');
  }
  if (out.has('ask') || verb === 'ask') {
    m.topic =
      m.topic ??
      (/\b(how many|people|crew|aboard|souls|passengers|injured)\b/.test(t)
        ? 'crew'
        : /\b(reactor|core|containment|how long|breach|engines?)\b/.test(t)
          ? 'reactor'
          : /\b(compartment|hold|cargo|hauling|carrying|shielded|what'?s (really )?in)\b/.test(t)
            ? 'cargo'
            : /\b(fugitive|passenger|who is|who'?s|defector|prisoner)\b/.test(t)
              ? 'passenger'
              : /\b(weapons|guns|lock(ing)?|target(ing)?)\b/.test(t)
                ? 'weapons'
                : /\b(want|why are you|intentions|purpose|doing here|here for|after)\b/.test(t)
                  ? 'intentions'
                  : /\b(territory|space|claim|border)\b/.test(t)
                    ? 'territory'
                    : 'general');
  }
  if (!out.size) {
    // Fall back to the v0.4 message vocabulary so nothing the old parser understood is lost.
    const c = commIntent(t);
    if (c.intent !== 'open' && CORE_INTENT[c.intent]) {
      out.add(CORE_INTENT[c.intent]);
      if (c.offer && !m.offer) m.offer = c.offer;
      if (c.topic && !m.topic) m.topic = c.topic as LineMeaning['topic'];
    }
  }
  if (!out.size) out.add('unknown');
  // Most specific first (the provider answers the first it handles).
  const ORDER: DialogueIntent[] = ['end', 'agree', 'refuse', 'negotiate', 'trade', 'demand', 'requestAssist', 'warn', 'bluff', 'legal', 'appeal', 'offerAsylum', 'promise', 'challenge', 'ask', 'humanitarian', 'declarePeaceful', 'offerCooperation', 'greet', 'unknown'];
  m.intents = ORDER.filter((i) => out.has(i)).slice(0, 5);
  return m;
}

// --------------------------------------------------------------- route ---

type Seg = { text: string; sep: string };

/** Split a sentence where a new crew order, relay or channel operation starts. */
function segments(sentence: string): string[] {
  const parts = sentence.split(/(,?\s+and then\s+|,?\s+then\s+|,\s*and\s+|\s+and\s+|,\s+but\s+|,\s+)/);
  const segs: Seg[] = [{ text: parts[0], sep: '' }];
  for (let i = 1; i < parts.length; i += 2) {
    const sep = parts[i];
    const frag = parts[i + 1] ?? '';
    const head = frag.trim().toLowerCase();
    const starts = (COMMAND_HEAD.test(head) && !/^(shields|weapons) (will|stay|remain)\b/.test(head)) || RELAY_HEAD.test(head) || CLOSE.test(head) || HOLD.test(head) || CREW_VOC.test(head);
    // A bare address ("Communications, close the channel") belongs to what follows it.
    const prev = segs[segs.length - 1].text.trim().toLowerCase();
    const bareAddress = /^,\s*$/.test(sep) && (CREW_VOC.test(`${prev}, `) || Object.values(PARTY_WORDS).some((re) => re.test(prev))) && prev.split(/\s+/).length <= 3;
    if (starts && !bareAddress && !/,\s+but\s+/.test(sep)) segs.push({ text: frag, sep });
    else segs[segs.length - 1].text += sep + frag;
  }
  return segs.map((s) => s.text.trim()).filter(Boolean);
}

type Piece = { kind: 'speech'; party: Party; text: string; meaning: LineMeaning; relayed: boolean } | { kind: 'command'; text: string } | { kind: 'channel'; action: ProposedActionInput };

function channelOp(t: string, ctx: InterpreterContext): ProposedActionInput | null {
  const p = PRIVATE_OPEN.exec(t);
  if (p) {
    const ref = partyRefRe().exec(p[1] ?? '');
    const party = ref ? partyOf(ref[1], ctx) : (ctx.channel?.party ?? null);
    return party ? { type: 'channel', op: 'open', party, private: true } : null;
  }
  if (CLOSE.test(t) && !/\bclose (to|on|in|the (range|distance|gap))\b/.test(t)) return { type: 'channel', op: 'close', ...partyArg(t, ctx) };
  if (RESUME.test(t)) return { type: 'channel', op: 'resume', ...partyArg(t, ctx, true) };
  if (HOLD.test(t)) return { type: 'channel', op: 'hold', ...partyArg(t, ctx) };
  if (UNMUTE.test(t)) return { type: 'channel', op: 'unmute' };
  if (MUTE.test(t) && /\b(mute|muting)\b/.test(t)) return { type: 'channel', op: 'mute' };
  return null;
}

function partyRefRe(): RegExp {
  const extra = [aliasAlternation('kestrel'), aliasAlternation('cruiser')].filter(Boolean).join('|');
  return extra ? new RegExp(`\\b(kestrel|freighter|arden|cruiser|warship|prefect|vane|passenger|${extra})\\b`) : /\b(kestrel|freighter|arden|cruiser|warship|prefect|vane|passenger)\b/;
}

function partyArg(t: string, ctx: InterpreterContext, held = false): { party?: Party } {
  const ref = partyRefRe().exec(t);
  if (ref) {
    const p = partyOf(ref[1], ctx);
    if (p) return { party: p };
  }
  if (held && ctx.held?.length) return { party: ctx.held[0] };
  return {};
}

function speechPiece(text: string, party: Party, relayVerb: string | undefined, relayed: boolean): Piece {
  let content = text.trim();
  // "tell him to X" → the relayed content is X (a request/demand of them).
  if (relayVerb && /^to\s+/.test(content)) content = content.replace(/^to\s+/, '');
  const meaning = classifyLine(content || text, { relayVerb, to: party });
  if (relayVerb === 'warn' && !meaning.intents.includes('warn')) meaning.intents = ['warn', ...meaning.intents.filter((i) => i !== 'unknown')];
  if (relayVerb === 'remind' && meaning.intents[0] === 'unknown') meaning.intents = ['legal'];
  if ((relayVerb === 'assure' || relayVerb === 'reassure') && !meaning.intents.includes('declarePeaceful')) meaning.intents = ['declarePeaceful', ...meaning.intents.filter((i) => i !== 'unknown')];
  return { kind: 'speech', party, text: content || text, meaning, relayed };
}

/** The passenger is spoken to in person (no comms channel): those lines stay with the order parser (v0.4 behaviour). */
function classifySegment(seg: string, ctx: InterpreterContext, core: Core): Piece[] {
  const pieces = classifySegment0(seg, ctx, core);
  return pieces.map((p) => (p.kind === 'speech' && p.party === 'passenger' ? { kind: 'command' as const, text: seg.trim() } : p));
}

function classifySegment0(seg: string, ctx: InterpreterContext, core: Core): Piece[] {
  const raw = seg.trim();
  let t = raw.toLowerCase().replace(/[.!]+$/, '').trim();
  const op = channelOp(t, ctx);
  if (op && !RELAY_RE().test(t)) return [{ kind: 'channel', action: op }];
  // "Hail the cruiser" is always a comms order (the officer reports if the channel is already open).
  if (/^(?:(?:communications|comms|lieutenant|szabo|ensign)[,:]?\s+)?(?:please\s+)?(hail|re-?hail|contact|signal|call)\b/.test(t)) return [{ kind: 'command', text: raw }];
  // Crew vocative: an order to the bridge, unless it is "Communications, tell him …".
  const voc = CREW_VOC.exec(t);
  if (voc) {
    const rest = t.slice(voc[0].length);
    if (!RELAY_RE().test(rest) && !SAY.test(rest)) {
      const op2 = channelOp(rest, ctx);
      return op2 ? [{ kind: 'channel', action: op2 }] : [{ kind: 'command', text: raw }];
    }
    t = rest;
  }
  const relay = RELAY_RE().exec(t);
  if (relay) {
    const party = partyOf(relay[2], ctx);
    if (party) return [speechPiece(restoreCase(raw, relay[3]), party, relay[1], true)];
  }
  const say = SAY.exec(t);
  if (say && ctx.channel) {
    const party = say[1] ? partyOf(say[1], ctx) : ctx.channel.party;
    if (party) return [speechPiece(restoreCase(raw, say[2]), party, 'say', true)];
  }
  const v = vocative(t, ctx);
  if (v) return [speechPiece(restoreCase(raw, v.rest), v.party, undefined, false)];
  if (!ctx.channel) return [{ kind: 'command', text: raw }];
  // Channel open: first/second-person statements and questions about them are speech.
  const party = ctx.channel.party;
  if (/^(don'?t|do not|never|under no circumstances)\b/.test(t) && !SECOND_PERSON.test(t)) return [{ kind: 'command', text: raw }];
  if (/^(let'?s|let us)\b/.test(t) && !SECOND_PERSON.test(t)) return [{ kind: 'command', text: raw }];
  const question = /\?$/.test(raw) || /^(how|what|what's|why|who|when|where|is|are|do|does|did|can|could|will|would)\b/.test(t);
  if (question && OUR_SHIP_Q.test(t) && !SECOND_PERSON.test(t) && !/\b(they|their|them|he|his|she|her|aboard)\b/.test(t)) return [{ kind: 'command', text: raw }];
  // "Our weapons stay powered down": a statement to the other party, not an order (orders say "keep / lower our …").
  if (/^(our|my) (weapons|guns|shields|ship|crew|people|engines)\b.*\b(stay|stays|remain|remains|will|won'?t|are|is)\b/.test(t)) return [speechPiece(raw, party, undefined, false)];
  if (SECOND_PERSON.test(t) || SPEECH_START.test(t) || question) return [speechPiece(raw, party, undefined, false)];
  // Otherwise: if the order parser reads it as a crew order, it is one; if not, it is speech.
  const r = core(raw, ctx);
  if (r.kind === 'unrecognised') return [speechPiece(raw, party, undefined, false)];
  const onlyHelp = r.kind === 'actions' && r.actions.length > 0 && r.actions.every((a) => a.type === 'query' && (a.topic === 'help' || a.topic === 'options')) && !/^(help|options|commands)$/.test(t);
  if (onlyHelp) return [speechPiece(raw, party, undefined, false)];
  const acts = r.kind === 'clarify' ? r.actions : r.actions;
  if (acts.length && acts.every((a) => a.type === 'communicate' && a.target !== 'all' && (a.target === party || a.target === undefined))) return [speechPiece(raw, party, undefined, false)];
  return [{ kind: 'command', text: raw }];
}

/** Keep the captain's original wording (case) for the relayed part. */
function restoreCase(raw: string, lowered: string): string {
  if (!lowered) return '';
  const i = raw.toLowerCase().lastIndexOf(lowered.trim());
  return i >= 0 ? raw.slice(i, i + lowered.trim().length) : lowered;
}

const CORE_INTENT: Record<string, DialogueIntent> = { open: 'greet', ask: 'ask', humanitarian: 'humanitarian', legal: 'legal', reassure: 'declarePeaceful', warn: 'warn', bluff: 'bluff', trade: 'trade', appeal: 'appeal', offerAsylum: 'offerAsylum' };

/**
 * Route an input through the comms layer. Returns null when it has nothing to do with an
 * open channel (no channel open and nobody addressed by name): the order parser takes it.
 */
export function routeComms(input: string, ctx: InterpreterContext, core: Core): Interpretation | null {
  const source = 'offline-parser';
  const sentences = input
    .trim()
    .split(/(?<=[.!?;])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const anyChannelWords = sentences.some((x) => {
    const t = x.toLowerCase();
    return !!channelOp(t, ctx) || !!vocative(t.replace(/[.!]+$/, ''), ctx);
  });
  if (!ctx.channel && !anyChannelWords && !(ctx.held?.length)) return null;

  const pieces: Piece[] = [];
  for (const sentence of sentences) for (const seg of segments(sentence)) pieces.push(...classifySegment(seg, ctx, core));
  if (!pieces.some((p) => p.kind !== 'command')) return null;

  const actions: ProposedActionInput[] = [];
  const unparsed: string[] = [];
  const notes: string[] = [];
  let clarify: Extract<Interpretation, { kind: 'clarify' }>['clarification'] | null = null;
  let cmdBuf: string[] = [];
  let open: Party | null = ctx.channel?.party ?? null;
  const flush = () => {
    if (!cmdBuf.length) return;
    const r = core(cmdBuf.join(' and '), ctx);
    cmdBuf = [];
    if (r.kind === 'unrecognised') {
      unparsed.push(...r.unparsed);
      return;
    }
    actions.push(...(r.actions as ProposedActionInput[]));
    unparsed.push(...r.unparsed);
    notes.push(...r.notes);
    if (r.kind === 'clarify') clarify = clarify ?? r.clarification;
  };
  for (const p of pieces) {
    if (p.kind === 'command') {
      cmdBuf.push(p.text.replace(/[.!]+$/, ''));
      continue;
    }
    flush();
    if (p.kind === 'channel') {
      actions.push(p.action);
      const a = p.action as { op: string; party?: Party };
      if (a.op === 'open' && a.party) open = a.party;
      if (a.op === 'close' || a.op === 'hold') open = null;
      continue;
    }
    // Speech to someone with no channel: comms hails them first (one order, one turn of seconds).
    if (open !== p.party && !ctx.held?.includes(p.party) && !actions.some((a) => a.type === 'communicate' && a.target === p.party)) {
      actions.push({ type: 'communicate', target: p.party, intent: 'open', onScreen: false });
    }
    open = p.party;
    const prev = actions[actions.length - 1];
    if (prev && prev.type === 'speak' && prev.to === p.party) {
      // Consecutive sentences to the same person are one utterance (one reply).
      prev.text = `${prev.text} ${p.text}`.slice(0, 400);
      prev.intents = [...new Set([...prev.intents, ...p.meaning.intents])].filter((i, _k, all) => i !== 'unknown' || all.length === 1).slice(0, 5);
      prev.topic = prev.topic ?? p.meaning.topic;
      prev.minutes = prev.minutes ?? p.meaning.minutes;
      prev.demand = prev.demand ?? p.meaning.demand;
      prev.promise = prev.promise ?? p.meaning.promise;
      prev.offer = prev.offer ?? p.meaning.offer;
      continue;
    }
    actions.push({ type: 'speak', to: p.party, text: p.text.slice(0, 400), intents: p.meaning.intents, topic: p.meaning.topic, minutes: p.meaning.minutes, demand: p.meaning.demand, promise: p.meaning.promise, offer: p.meaning.offer, relayed: p.relayed });
  }
  flush();
  if (!actions.length) return null;
  return clarify
    ? { kind: 'clarify', clarification: clarify, actions: actions as never, unparsed, notes, source }
    : { kind: 'actions', actions: actions.slice(0, 8) as never, unparsed, notes, source };
}

export { CORE_INTENT };
