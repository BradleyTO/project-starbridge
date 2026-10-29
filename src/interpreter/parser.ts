/**
 * OfflineInterpreter — deterministic natural-language parser (no AI).
 *
 * Pipeline: spelling tolerance (typos, run-togethers, fuzzy matching) →
 * normalise (politeness, filler, addressees → department hints, number words) →
 * split into sentences and clauses ("and", "then", commas; reported speech stays
 * attached) → classify each clause: declared posture/rationale ("we don't want to
 * appear hostile"), else ordered pattern rules → resolve references (explicit
 * names, "the two ships"/"both"/"them" after a plural antecedent → the pair,
 * pronouns → last target, the border landmark, sensible defaults) → ask a
 * specific clarifying question when still ambiguous, executing the parts that
 * were understood. Output is validated against the ProposedAction zod schema.
 *
 * Anything that maps to no action and is not rationale is returned in
 * `unparsed`: the hook for a future AI fallback interpreter.
 */
import { routeComms } from './dialogue';
import { setVocabulary, withAliases } from './vocabulary';
import { SIMULATION_NAME_PATTERN } from '../scenarios/catalogue';
import { ASK_FIT, ionAsk, ionOrder } from '../scenarios/ion/words';
import { LEDGER_NAMES, ledgerAsk, ledgerOrder } from '../scenarios/ledger/words';
import { ADDRESSED as LANTERN_ADDRESSED, SPEECHY as LANTERN_SPEECHY, LANTERN_NAMES, lanternAsk, lanternOrder } from '../scenarios/lantern/words';
import { ADDRESSED as PICKET_ADDRESSED, SPEECHY as PICKET_SPEECHY, PICKET_NAMES, forMarrow as picketForMarrow, picketAsk, picketOrder } from '../scenarios/picket/words';
import { ADDRESSED as GARDENER_ADDRESSED, SPEECHY as GARDENER_SPEECHY, GARDENER_NAMES, gardenerAsk, gardenerOrder } from '../scenarios/gardener/words';
import type { Interpretation, ProposedActionInput, CommIntent, TradeOffer, ManeuverIntentT } from '../engine/schema';
import { InterpretationSchema } from '../engine/schema';
import { planConflict } from '../engine/standing';
import type { Interpreter, InterpreterContext } from './types';
import { wordsToDigits } from './numbers';
import { careerQuestion, fleetAddress } from './addressees';
import { SpellCorrector, vocabularyFrom } from './spell';

type Contact = 'kestrel' | 'cruiser';
type TargetRef = Contact | 'passenger' | null;
type Ref = Contact | 'border';
type Dept = 'helm' | 'tactical' | 'ops' | 'science' | 'comms' | 'xo';

// ------------------------------------------------------------ normalise ---

const ADDRESSEES = '(computer|number one|helm|tactical|sensors|science|comms|communications|ops|engineering|chief|chief okafor|okafor|commander|commander marrow|marrow|lieutenant|lieutenant varga|varga|lieutenant szabo|szabo|ensign|ensign adeyemi|adeyemi|mr\\.? \\w+|ms\\.? \\w+|mrs\\.? \\w+|rask|everyone|bridge|doctor|doc|osei)';

const DEPT_OF: [RegExp, Dept][] = [
  [/^(helm|ensign|ensign adeyemi|adeyemi|navigation|nav|conn)$/, 'helm'],
  [/^(tactical|rask|lieutenant rask|mr\.? rask|weapons)$/, 'tactical'],
  [/^(ops|engineering|chief|chief okafor|okafor)$/, 'ops'],
  [/^(sensors|science|lieutenant varga|varga|ms\.? varga)$/, 'science'],
  [/^(comms|communications|lieutenant szabo|szabo|ms\.? szabo)$/, 'comms'],
];

function deptFor(name: string): Dept {
  for (const [re, d] of DEPT_OF) if (re.test(name.trim())) return d;
  return 'xo';
}

const DEPT_MARK = /⟨(helm|tactical|ops|science|comms|xo)⟩/g;

/** Normalised text; department addressees are kept as ⟨dept⟩ markers (stripped by `normalise`). */
export function normaliseMarked(input: string): string {
  let t = ` ${input.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, ', ')} `;
  t = SPELL().correct(t, protectedNames);
  t = wordsToDigits(t);
  t = t.replace(new RegExp(`(^\\s*|[.!?;]\\s*)${ADDRESSEES}\\s*[,:]`, 'g'), (_m, pre: string, name: string) => `${pre} ⟨${deptFor(name)}⟩ `);
  t = t.replace(new RegExp(`\\b(tell|ask|have|get|order|instruct)\\s+${ADDRESSEES}\\s+(to\\s+)?`, 'g'), ' ');
  const filler = [
    'please', 'kindly', 'could you', 'would you', 'can you', 'will you', "i'd like you to", 'i would like you to', 'i want you to', 'i need you to',
    'i want to', "i'd like to", "let's", 'let us', 'go ahead and', 'make it so', 'immediately', 'right away', 'right now', 'at once', 'asap', 'quickly',
    'as fast as you can', 'if you would', 'if you can', 'for me', 'ok', 'okay', 'alright', 'all right', 'um', 'uh', 'hmm', 'now', 'then please',
    'i think we should', 'we should', 'we need to', 'we must', 'try to', 'attempt to',
  ];
  for (const f of filler) t = t.replace(new RegExp(`(^|[\\s,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,.!?]|$)`, 'g'), '$1');
  t = t.replace(/\b(tell|give|show) me\b/g, 'report');
  // Emphatic negations read as plain prohibitions.
  t = t.replace(/\b(under no circumstances|on no account|at no point|in no event|by no means)\b,?\s*/g, ' do not ');
  // "Lower shields and raise them again": the pronoun is the shields (so a contradictory plan is caught and asked about).
  t = t.replace(/\b(shields?)\b([^.;]*?)\b(raise|lower|drop|restore|bring|put|get)( them| it)\b/g, (_m, sh: string, mid: string, v: string) => `${sh}${mid}${v} shields`);
  // "without raising shields" is a prohibition attached to the order before it.
  const BASE: Record<string, string> = { raising: 'raise', 'putting up': 'put up', 'bringing up': 'bring up', arming: 'arm', 'powering up': 'power up', charging: 'charge', lowering: 'lower', dropping: 'drop', firing: 'fire', shooting: 'shoot' };
  t = t.replace(/\bwithout (raising|putting up|bringing up|arming|powering up|charging|lowering|dropping|firing|shooting)\b/g, (_m, v: string) => `, don't ${BASE[v]}`);
  t = t.replace(/\bcourse and speed\b/g, 'course');
  // Idioms that contain "and" but are one modifier.
  t = t.replace(/\b(nice and (slow|easy|gentle)|slow and steady|slow and easy|nice and steady)\b/g, 'slowly');
  // Coordinated subjects share one predicate: "weapons and shields down" → "weapons down and shields down".
  t = t.replace(/\b(?:(the|our) )?(weapons|shields|deflectors|guns) and (?:(?:the|our) )?(weapons|shields|deflectors|guns) (down|up|off|offline|online|lowered|raised|safe|cold|hot|ready)\b/g, '$2 $4 and $3 $4');
  // "keep weapons and shields down" (verb before the pair)
  t = t.replace(/\b(keep|leave|put|have|get) (?:(the|our) )?(weapons|shields) and (?:(the|our) )?(weapons|shields) (down|up|offline|online|lowered|raised|safe|cold)\b/g, '$1 $3 $6 and $5 $6');
  t = t.replace(/[!?]+/g, '.').replace(/\s+/g, ' ').trim();
  return t.replace(/^[,.\s]+|[,.\s]+$/g, '');
}

export function normalise(input: string): string {
  return normaliseMarked(input).replace(DEPT_MARK, ' ').replace(/\s+/g, ' ').trim().replace(/^[,.\s]+/, '');
}

// --------------------------------------------------------------- lexicon ---

const KESTREL_BASE = /\b(kestrel|freighter|civilian( ship| vessel)?|disabled (ship|vessel)|derelict|arden|stricken (ship|vessel)|distressed (ship|vessel)|transport ship|cargo ship|merchant( ship)?)\b/;
const CRUISER_BASE = /\b(cruiser|warship|war ship|directorate|tessarine|ashen|covenant|vane|prefect|enemy|hostile (ship|vessel|contact)|the hostile|attacker|second contact|other ship|that ship|battleship|man o' war)\b/;
/**
 * v0.7.1: the same words without the Kestrel Incident's own names (Kestrel, Arden, the Directorate,
 * the Ashen Covenant, Prefect Vane). Used in every other setting, so those names never resolve to a
 * contact outside their scenario. Generic class words ("the freighter", "the warship") remain.
 */
const KESTREL_GENERIC = /\b(freighter|civilian( ship| vessel)?|disabled (ship|vessel)|derelict|stricken (ship|vessel)|distressed (ship|vessel)|transport ship|cargo ship|merchant( ship)?)\b/;
const CRUISER_GENERIC = /\b(cruiser|warship|war ship|enemy|hostile (ship|vessel|contact)|the hostile|attacker|second contact|other ship|that ship|battleship|man o' war)\b/;
const KESTREL_SCENARIO_ID = 'kestrel-incident';
/** v0.6: the built-in ship words plus the active scenario's (vocabulary.ts); identical to the base for the Kestrel. */
let KESTREL = KESTREL_BASE;
let CRUISER = CRUISER_BASE;
const BORDER = /\b(border|agency space|isa space|agency territory|concord space|our space|friendly space|home space|safe space|our side|the line|our territory)\b/;
/** "the two ships", "both", "2 ships", "those vessels", "each other". */
const PAIR = /\b(the |those |these |both )?(2|both) (ships|vessels|contacts|of them|craft)\b|\bboth (of them|ships|vessels|contacts)\b|\bthem both\b|\beach other\b|\b(those|these|the) (ships|vessels|contacts)\b|\bboth\b/;
const PLURAL_PRONOUN = /\b(them|they|their|those)\b/;
const SINGULAR_PRONOUN = /\b(her|she|it|its|him|he|that one|this one)\b/;
const PASSENGER = /\b(passenger|defector|stowaway|fugitive|stasis|pod|refugee|prisoner|scientist|journalist)\b/;
const COMPARTMENT = /\b(compartment|cargo hold|hold|aft section|hidden|shielded|stasis|pod|passenger)\b/;

const SYSTEMS: [string, RegExp][] = [
  ['lifeSupport', /\blife support\b/],
  ['jumpDrive', /\b(jump drive|jump|ftl|hyperdrive)\b/],
  ['shields', /\b(shields?|deflectors?)\b/],
  ['weapons', /\b(weapons?|beams?|torpedo(es)?|phasers?|guns|lances?|tubes)\b/],
  ['engines', /\b(engines?|impulse|thrusters?|propulsion|drive)\b/],
  ['sensors', /\b(sensors?|scanners?|sensor array)\b/],
  ['tractor', /\btractor( beam)?\b/],
  ['transporter', /\b(transporters?|teleporters?)\b/],
  ['comms', /\b(comms|communications|radio|antenna)\b/],
  ['reactor', /\breactor\b/],
];

function systemsIn(text: string): { id: string; index: number }[] {
  const out: { id: string; index: number }[] = [];
  for (const [id, re] of SYSTEMS) {
    const m = re.exec(text);
    if (m && !out.some((o) => o.index === m.index)) out.push({ id, index: m.index });
  }
  return out.sort((a, b) => a.index - b.index);
}

function explicitTarget(c: string, ctx: InterpreterContext): TargetRef {
  const names = ctx.passengerNames.length ? new RegExp(`\\b(${ctx.passengerNames.join('|')})\\b`) : null;
  const hits: [TargetRef, number][] = [];
  const k = KESTREL.exec(c);
  const cr = CRUISER.exec(c);
  const p = PASSENGER.exec(c) ?? (names ? names.exec(c) : null);
  if (k) hits.push(['kestrel', k.index]);
  if (cr) hits.push(['cruiser', cr.index]);
  if (p) hits.push(['passenger', p.index]);
  if (!hits.length) return null;
  hits.sort((a, b) => a[1] - b[1]);
  return hits[0][0];
}

function contactOf(c: string, ctx: InterpreterContext): Contact | null {
  const k = KESTREL.exec(c);
  const cr = CRUISER.exec(c);
  if (k && cr) return k.index < cr.index ? 'kestrel' : 'cruiser';
  if (k) return 'kestrel';
  if (cr) return 'cruiser';
  void ctx;
  return null;
}

function numberKm(c: string): number | null {
  const re = /(\d+(?:\.\d+)?)\s*(km|kilomet(?:er|re)s?|klicks?|kay)?\b(?!\s*(ships?|vessels?|contacts?|of (them|us|the)|minutes?|seconds?|secs?|mins?|%|percent|people|crew|souls|degrees?|torpedo(es)?|times?|turns?))/g;
  for (let m = re.exec(c); m; m = re.exec(c)) {
    let n = parseFloat(m[1]);
    if (!m[2] && n < 100) {
      // A bare small number is a distance only in "to 5" / "at 5" ("take us to 5" → 5,000 km).
      if (!/\b(to|at|within|of)\s*$/.test(c.slice(0, m.index))) continue;
      n *= 1000;
    }
    return Math.round(n);
  }
  return null;
}

// ------------------------------------------------------------ intents ---

type Draft =
  | { kind: 'action'; action: ProposedActionInput; needs?: 'contact' | 'commTarget' | 'system' | 'nav'; question?: string; extra?: ProposedActionInput[] }
  | { kind: 'none' };

interface Rule {
  name: string;
  test: RegExp;
  build: (c: string, ctx: InterpreterContext) => Draft;
}

const SPEECH = /\b(hail|hailing|contact (?=the |them|her|him|it\b|vane|arden|prefect|captain|both|every)|get (?:the |that )?\w+ on (?:the )?(?:line|screen)|call|signal|open (a )?(channel|comms|frequency|hailing frequencies|line)|on screen|on (?:the )?(?:main )?(?:viewer|viewscreen)|onscreen|tell|inform|say|explain|warn|threaten|assure|reassure|ask|request|demand|offer|propose|trade|exchange|negotiate|bluff|lie to|plead|appeal|respond|reply|talk|speak|answer|broadcast|transmit|message|remind|convince|persuade|hand over|grant|promise)\b/;

export function commIntent(c: string): { intent: CommIntent; offer?: TradeOffer; topic?: 'cargo' | 'passenger' | 'intentions' | 'crew' | 'general' } {
  if (/\b(asylum|sanctuary|safe haven|refuge|protection)\b/.test(c)) return { intent: 'offerAsylum' };
  if (/\b(offer|trade|exchange|give (them|him|it)|hand over|handover|surrender|in return|a deal|swap|ransom|in exchange)\b/.test(c)) {
    let offer: TradeOffer = 'unspecified';
    if (PASSENGER.test(c) || /\b(venn|maras|ivet|lysa|teo)\b/.test(c)) offer = 'passenger';
    else if (/\b(cargo|isotopes?)\b/.test(c)) offer = 'cargo';
    else if (/\b(medical|medicine|supplies|aid)\b/.test(c)) offer = 'medical';
    else if (/\b(data|logs?|information|intel|sensor readings)\b/.test(c)) offer = 'data';
    else if (/\b(kestrel|freighter|ship|vessel|wreck)\b/.test(c)) offer = 'kestrel';
    return { intent: 'trade', offer };
  }
  if (/\b(reassure|calm|comfort|hang on|hold on|stay calm|help is (coming|on (the|its) way))\b/.test(c)) return { intent: 'reassure' };
  if (/\b(reinforcements?|battle ?group|fleet|backup|back-up|squadron|more ships|other ships|warships? (are )?(coming|inbound)|on (its|their|the) way|en route|right behind us|arriving|cavalry)\b/.test(c)) return { intent: 'bluff' };
  if (/\b(sibling|brother|sister|family|ivet|honou?r|personal|appeal|plead)\b/.test(c)) return { intent: 'appeal' };
  if (/\b(treaty|accords?|law|legal|illegal|neutral|rights|convention|jurisdiction|evidence|proof|crimes?|labou?r colon(y|ies)|colonies|recordings?)\b/.test(c)) return { intent: 'legal' };
  if (/\b(no harm|peaceful|not (a threat|hostile|here to fight)|no hostile|friendly|calm down|mean no|our intentions|stand easy|apologi[sz]e|sorry)\b/.test(c)) return { intent: 'reassure' };
  if (/\b(warn|threat|threaten|back off|stand down|leave|withdraw|retreat|or (else|we will|we'll)|will fire|open fire|destroy you|last warning|turn back|go away|get out|stay away|keep away|don't come)\b/.test(c)) return { intent: 'warn' };
  if (/\b(humanitarian|rescue|mercy|lives|civilians?|dying|help|save|injured|evacuat\w*|crew|people)\b/.test(c)) return { intent: 'humanitarian' };
  if (/\b(ask|what|why|who|where|how|intentions?|want|explain yourself|identify|cargo|compartment|hold)\b/.test(c)) {
    const topic = /\b(cargo|hold|compartment|hauling|carrying)\b/.test(c) ? 'cargo' : PASSENGER.test(c) ? 'passenger' : /\b(intentions?|want|why|purpose)\b/.test(c) ? 'intentions' : /\bcrew\b/.test(c) ? 'crew' : 'general';
    return { intent: 'ask', topic };
  }
  return { intent: 'open' };
}

const ON_SCREEN = /\b(on (the )?(main )?(screen|viewer|viewscreen)|onscreen|on visual)\b/;
const ALL_TARGETS = /\b(everyone|everybody|all (ships|vessels|contacts|parties|of them|channels)|both (ships|vessels|of them|parties)?|them both|broadcast|every ship|all frequencies)\b/;

// --------------------------------------------------------- spatial terms ---

const SPEED_SLOW = /\b(slow(ly)?|gently|carefully|cautiously|quarter impulse|one quarter|dead slow|easy|take it easy|nice and slow)\b/;
const SPEED_HALF = /\bhalf (impulse|speed|power ahead)\b|\bahead half\b/;

function speedOf(c: string): 'slow' | 'half' | 'full' {
  return SPEED_SLOW.test(c) ? 'slow' : SPEED_HALF.test(c) ? 'half' : 'full';
}

/** Named ranges ("transporter range", "out of weapons range") and explicit numbers. */
function rangeOf(c: string): number | null {
  const out = /\b(out of|outside|beyond|clear of|away from)\b/.test(c);
  if (/\btransporter range|transport range|beaming range\b/.test(c)) return out ? 8000 : 4000;
  if (/\btractor (beam )?range\b/.test(c)) return out ? 9000 : 5000;
  if (/\b(beam|weapons?|firing|phaser|gun|their|its|her) range\b/.test(c)) return out ? 45000 : 35000;
  if (/\btorpedo range\b/.test(c)) return out ? 125000 : 100000;
  if (/\bsensor range\b/.test(c)) return out ? 270000 : 150000;
  return numberKm(c);
}

/** References in order of appearance; plural words become the pair. */
function refsIn(c: string): { refs: Ref[]; pair: boolean; plural: boolean; singular: boolean } {
  const hits: [Ref, number][] = [];
  const k = KESTREL.exec(c);
  const cr = CRUISER.exec(c);
  const b = BORDER.exec(c);
  if (k) hits.push(['kestrel', k.index]);
  if (cr) hits.push(['cruiser', cr.index]);
  if (b) hits.push(['border', b.index]);
  hits.sort((x, y) => x[1] - y[1]);
  return { refs: hits.map((h) => h[0]), pair: PAIR.test(c), plural: PLURAL_PRONOUN.test(c), singular: SINGULAR_PRONOUN.test(c) };
}

const navDraft = (intent: ManeuverIntentT, c: string, extra: Record<string, unknown> = {}): Draft => {
  const r = rangeOf(c);
  return { kind: 'action', action: { type: 'maneuver', intent, speed: speedOf(c), ...(r !== null ? { rangeKm: r } : {}), ...extra } as ProposedActionInput, needs: 'nav' };
};

const RULES: Rule[] = [
  {
    name: 'help',
    test: /^(help|commands|what (orders|commands) can i give|how do i play)\b(?!\s+(is|are|was|will|has|have|'?s)\b)/,
    build: () => ({ kind: 'action', action: { type: 'query', topic: 'help' } }),
  },
  {
    // v0.8.6: Ion Season — orders to the convoy ("take us through the low channel", "send a probe down
    // the high channel", "turn the convoy back") and questions about the crossing ("what does your gut
    // say?"). Only while that simulation runs; the scenario decides what they mean.
    name: 'ionSeason',
    test: /\S/,
    build: (c, ctx) => {
      if (ctx.setting?.scenarioId !== 'ion-season') return { kind: 'none' };
      if (ionOrder(c)) return { kind: 'action', action: { type: 'improvise', method: 'other', description: c } };
      if (ionAsk(c) || ASK_FIT.test(c)) return { kind: 'action', action: { type: 'bridge', op: 'chat', officer: '', text: c.slice(0, 300) } };
      return { kind: 'none' };
    },
  },
  {
    name: 'ghostLedger',
    test: /\S/,
    build: (c, ctx) => {
      if (ctx.setting?.scenarioId !== 'ghost-ledger') return { kind: 'none' };
      if (ledgerOrder(c)) return { kind: 'action', action: { type: 'improvise', method: 'other', description: c } };
      if (ledgerAsk(c)) return { kind: 'action', action: { type: 'bridge', op: 'chat', officer: '', text: c.slice(0, 300) } };
      return { kind: 'none' };
    },
  },
  {
    // v0.8.8: The Lantern Drift — orders in the rescue ("scan the cryo banks", "wake bank C", "Doctor,
    // wake them in your triage order", "run a power line to the banks") and questions about it. Only
    // while that simulation runs; the scenario decides what they mean.
    name: 'lanternDrift',
    test: /\S/,
    build: (c, ctx) => {
      if (ctx.setting?.scenarioId !== 'lantern-drift') return { kind: 'none' };
      // On an open channel, plain speech is for the custodian, the Speaker or the salvor.
      if (ctx.channel?.state === 'open' && ctx.channel.party !== 'passenger' && !LANTERN_ADDRESSED.test(c)) {
        if (LANTERN_SPEECHY.test(c)) return { kind: 'action', action: { type: 'speak', to: ctx.channel.party, text: c.slice(0, 400), intents: ['unknown'], relayed: false } };
        return { kind: 'none' };
      }
      if (lanternOrder(c)) return { kind: 'action', action: { type: 'improvise', method: 'other', description: c } };
      if (lanternAsk(c)) return { kind: 'action', action: { type: 'bridge', op: 'chat', officer: '', text: c.slice(0, 300) } };
      return { kind: 'none' };
    },
  },
  {
    // v0.8.9: The Long Picket — orders in the standoff ("Szabo, listen to the picket's traffic",
    // "Marrow, talk to him privately", "send him our scan of the cargo", "run the blockade") and
    // questions about it. Only while that simulation runs; the scenario decides what they mean.
    name: 'longPicket',
    test: /\S/,
    build: (c, ctx) => {
      if (ctx.setting?.scenarioId !== 'long-picket') return { kind: 'none' };
      // On an open channel, plain speech is for the picket commander or the Reeve.
      // "Commander, …" names the picket commander as often as the first officer: an 'xo' address only
      // keeps the line on the bridge when it is work for Marrow ("tell him…", "your read?").
      const bridgeWork = !!ctx.addressee && (ctx.addressee !== 'xo' || picketForMarrow(c));
      if (ctx.channel?.state === 'open' && ctx.channel.party !== 'passenger' && !bridgeWork && !PICKET_ADDRESSED.test(c) && PICKET_SPEECHY.test(c)) {
        return { kind: 'action', action: { type: 'speak', to: ctx.channel.party, text: c.slice(0, 400), intents: ['unknown'], relayed: false } };
      }
      // "Marrow, tell him…": the parser strips the name, so the first officer is put back for the scenario.
      const d = ctx.addressee === 'xo' && !/^\s*marrow\b/.test(c) ? `marrow, ${c}` : c;
      if (picketOrder(d)) return { kind: 'action', action: { type: 'improvise', method: 'other', description: d } };
      if (picketAsk(c)) return { kind: 'action', action: { type: 'bridge', op: 'chat', officer: '', text: c.slice(0, 300) } };
      return { kind: 'none' };
    },
  },
  {
    // v0.8.10: The Gardener — orders about the growth ("Varga, study the growth", "send a probe for
    // a sample", "Chief, lay a heat lure", "tell the Claimwarden to hold her charges", "dim the
    // station's floodlights") and questions about it. Only while that simulation runs; the scenario
    // decides what they mean.
    name: 'gardener',
    test: /\S/,
    build: (c, ctx) => {
      if (ctx.setting?.scenarioId !== 'gardener') return { kind: 'none' };
      // On an open channel, plain speech is for the Claimwarden or the Assayer.
      if (ctx.channel?.state === 'open' && ctx.channel.party !== 'passenger' && !ctx.addressee && !GARDENER_ADDRESSED.test(c) && GARDENER_SPEECHY.test(c)) {
        return { kind: 'action', action: { type: 'speak', to: ctx.channel.party, text: c.slice(0, 400), intents: ['unknown'], relayed: false } };
      }
      if (gardenerOrder(c)) return { kind: 'action', action: { type: 'improvise', method: 'other', description: c.slice(0, 400) } };
      if (gardenerAsk(c)) return { kind: 'action', action: { type: 'bridge', op: 'chat', officer: '', text: c.slice(0, 300) } };
      return { kind: 'none' };
    },
  },
  {
    name: 'options',
    test: /\b(options|what (can|should) (we|i) do|suggestions?|recommend\w*|ideas|advice|advise|what now|what next|thoughts)\b/,
    build: () => ({ kind: 'action', action: { type: 'query', topic: 'options' } }),
  },
  {
    name: 'query',
    test: /^(status|report|sitrep|situation( report)?|damage report|ship status|systems? (report|status|check)|how (are|is) (we|the ship) doing|what('s| is) (our|the) (status|situation)|objectives|mission (goals|objectives)|contacts|tactical report|sensor report|what's out there|diagnostic)\b|\b(status report|damage report|run a diagnostic|full report)\b/,
    build: (c) => ({
      kind: 'action',
      action: { type: 'query', topic: /objective|goal/.test(c) ? 'objectives' : /system|damage|diagnostic/.test(c) ? 'systems' : /contact|tactical|sensor report|out there/.test(c) ? 'contacts' : 'status' },
    }),
  },
  {
    name: 'negArm',
    test: /\b(don'?t|do not|never|no one|nobody)( \w+)? (arm|charge|ready|power up|bring up|activate|load|go to|target|lock|aim)\b.*\b(weapons?|beams|torpedoes|tubes|phasers|guns|lances?)\b|\b(weapons?|guns) (stay|remain|are to stay|are to remain) (cold|safe|down|offline|powered down|off)\b|\bno weapons\b|\b(don'?t|do not|never) (arm|power up) (them|it|anything)\b/,
    // Weapons safe now, and a standing prohibition on arming them (red alert and standing orders respect it).
    build: () => ({ kind: 'action', action: { type: 'weapons', mode: 'safe' }, extra: [{ type: 'restrict', subject: 'armWeapons' }] }),
  },
  {
    name: 'negFire',
    test: /\b(don'?t|do not|never|no one|nobody)( \w+)? (fire|shoot|open fire)\b|\bhold (your |our )?fire\b|\bno (firing|shooting)\b|\bweapons tight\b/,
    // "Hold fire" also safes the weapons (v0.3 behaviour); "do not fire" alone leaves them as they are.
    build: (c) => (/\bhold (your |our )?fire\b/.test(c) ? { kind: 'action', action: { type: 'weapons', mode: 'safe' }, extra: [{ type: 'restrict', subject: 'fireWeapons' }] } : { kind: 'action', action: { type: 'restrict', subject: 'fireWeapons' } }),
  },
  {
    name: 'negRaise',
    test: /\b(don'?t|do not|never)( \w+)? (raise|put up|bring up|activate|engage|turn on)\b.*\b(shields?|deflectors?)\b|\b(shields?|deflectors?) (stay|remain|are to stay) (down|lowered|off|offline)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'restrict', subject: 'raiseShields' }, extra: /\b(stay|remain)\b/.test(c) ? [{ type: 'shields', raise: false }] : [] }),
  },
  {
    name: 'negLower',
    test: /\b(don'?t|do not|never)( \w+)? (lower|drop|take down|turn off|disable)\b.*\b(shields?|deflectors?)\b|\b(shields?|deflectors?) (stay|remain|are to stay) (up|raised|on)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'restrict', subject: 'lowerShields' }, extra: /\b(stay|remain)\b/.test(c) ? [{ type: 'shields', raise: true }] : [] }),
  },
  {
    name: 'holdFire',
    test: /\b(cease|stop) (your )?(fire|firing|shooting)\b|\bcease ?fire\b/,
    build: () => ({ kind: 'action', action: { type: 'weapons', mode: 'safe' } }),
  },
  {
    name: 'ejectCore',
    test: /\b(eject|jettison|dump|blow|cut loose)\b.*\b(core|warp core|reactor)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'ejectCore', description: c } }),
  },
  {
    name: 'plasmaVent',
    test: /\b(vent|dump|release|spray|blow|leak)\b.*\b(plasma|exhaust|drive plasma|smoke)\b|\b(smoke ?screen|plasma (cloud|screen|cover|trail))\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'plasmaVent', description: c } }),
  },
  {
    name: 'tractorShield',
    test: /\btractor\b.*\b(shield|deflect|block|screen|scatter|cover|protect|absorb|barrier|intercept)\b|\b(shield|deflect|protect|cover|block)\b.*\b(with|using) (the |our )?tractor\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'tractorShield', description: c } }),
  },
  {
    name: 'sensorGhost',
    test: /\b(fake|spoof|ghost|decoy|false|phantom|fool|trick|simulate|mimic)\b.*\b(signals?|signatures?|transponders?|contacts?|sensors?|echo(es)?|ships|readings|fleet|blips?|images?)\b|\bsensor (ghosts?|decoys?|echoes)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'sensorGhost', description: c } }),
  },
  {
    name: 'shieldExtend',
    test: /\b(extend|expand|wrap|stretch|project|spread)\b.*\bshields?\b|\bshields? (around|over) (the )?(kestrel|freighter|her|them)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'shieldExtend', description: c } }),
  },
  {
    name: 'communicate',
    test: SPEECH,
    build: (c) => {
      const ci = commIntent(c.replace(ON_SCREEN, ' '));
      return { kind: 'action', action: { type: 'communicate', target: 'cruiser', onScreen: ON_SCREEN.test(c), ...ci }, needs: 'commTarget' };
    },
  },
  {
    name: 'alert',
    test: /\b(red alert|battle stations|general quarters|condition red|yellow alert|condition yellow|stand down|condition green|green alert|cancel (the )?(red |yellow )?alert|secure from (red alert|general quarters))\b/,
    build: (c) => /\b(weapons?|phasers|beams|torpedoes|guns)\b/.test(c) ? { kind: 'none' } : ({ kind: 'action', action: { type: 'setAlert', level: /red|battle|general quarters/.test(c) && !/cancel|secure|stand down/.test(c) ? 'red' : /yellow/.test(c) && !/cancel/.test(c) ? 'yellow' : 'green' } }),
  },
  {
    name: 'shields',
    test: /\bshields?\b|\bdeflectors?\b/,
    build: (c) => {
      if (/\b(power|boost|reinforce|divert|reroute|route|shunt|channel|transfer|strengthen)\b/.test(c)) return { kind: 'none' };
      if (/\b(lower(ed)?|drop(ped)?|down|disabled?|deactivated?|off(line)?|power(ed)? down|cut|kill)\b/.test(c)) return { kind: 'action', action: { type: 'shields', raise: false } };
      if (/\b(raised?|up|activated?|engaged?|enabled?|restored?|bring|on(line)?)\b/.test(c)) return { kind: 'action', action: { type: 'shields', raise: true } };
      return { kind: 'none' };
    },
  },
  {
    name: 'power',
    test: /\bpower\b|\b(boost|reinforce|strengthen|overcharge|supercharge)\b|\b(divert|reroute|route|shunt|channel) (everything|all|it all|whatever we have|what we have)\b/,
    build: (c) => {
      if (/\bpower (down|off|up)\b/.test(c)) return { kind: 'none' };
      const sys = systemsIn(c);
      const pct = /(\d+)\s*(%|percent)/.exec(c);
      const amount = pct ? Math.min(150, Math.max(5, parseInt(pct[1], 10))) : /\b(all|full|maximum|max|every|everything|emergency)\b/.test(c) ? 50 : 25;
      const fromIdx = c.search(/\bfrom\b/);
      let to: string | undefined;
      let from: string | undefined;
      if (/\b(reduce|cut|lower|decrease|drain|take)\b/.test(c) && !/\bto\b.*\bfrom\b|\bfrom\b.*\bto\b/.test(c)) from = sys[0]?.id;
      else if (fromIdx >= 0) {
        from = sys.find((x) => x.index > fromIdx)?.id;
        to = sys.find((x) => x.id !== from)?.id;
      } else to = sys[0]?.id;
      if (!to && !from) return { kind: 'action', action: { type: 'power', amount }, needs: 'system', question: 'Divert power to which system, Captain? Shields, weapons, engines or sensors?' };
      return { kind: 'action', action: { type: 'power', to: to as never, from: from as never, amount } };
    },
  },
  {
    name: 'weaponsSafe',
    test: /\b(safe|disarm|power down|stand down|secure|lower|deactivate|holster)\b.*\b(weapons?|beams|torpedoes|guns)\b|\bweapons (safe|cold|down|offline)\b|\b(don'?t|do not|never|no one) (arm|charge|ready|target|lock|aim|power up)\b|\bguns (cold|down|safe)\b/,
    build: () => ({ kind: 'action', action: { type: 'weapons', mode: 'safe' } }),
  },
  {
    name: 'fire',
    test: /\b(fire|firing|shoot|shooting|open fire|launch|attack|engage (the|them|her|that)|blast|hit (them|her|it)|take (them|her|it) out|destroy|warning shot)\b/,
    build: (c) => /\b(jump|drive|engines?|tractor|thrusters)\b/.test(c) ? { kind: 'none' } : ({
      kind: 'action',
      action: { type: 'weapons', mode: 'fire', target: 'cruiser', weapon: /torpedo|missile/.test(c) ? 'torpedoes' : 'beams', warning: /warning shot|across (their|the|her) bow/.test(c) },
      needs: 'contact',
    }),
  },
  {
    name: 'lock',
    test: /\b(lock|target|acquire|weapons lock|target lock|lock on|aim)\b/,
    build: (c) => (/\btractor\b/.test(c) ? { kind: 'none' } : { kind: 'action', action: { type: 'weapons', mode: 'lock', target: 'cruiser' }, needs: 'contact' }),
  },
  {
    name: 'arm',
    test: /\b(arm|ready|charge|prepare|power up|bring up|load)\b.*\b(weapons?|beams|torpedoes|tubes|phasers|guns)\b|\bweapons (hot|ready|free)\b/,
    build: () => ({ kind: 'action', action: { type: 'weapons', mode: 'arm' } }),
  },
  {
    // v0.8.5: taking delegations somewhere together (The Saltglass Accord) — the scenario decides what it achieves.
    name: 'improviseVisit',
    test: /\b(take|bring|fly|escort|walk)\b.*\b(the |both )?(delegates|delegations|delegation|clans)\b.*\b(down|surface|ice|moon|saltglass)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'other', description: c } }),
  },
  {
    // v0.6: medical improvisation (isolation wards, screened transport) — the scenario decides what it achieves.
    name: 'improviseMedical',
    test: /\b(isolation|quarantine|biohazard) (ward|bay|area|deck|zone|field)\b|\bisolat(e|ion) (them|the (sick|patients|infected|team|exposed))\b|\bfield hospital\b|\bbio-? ?filters?\b|\bdecontaminat\w*\b|\bscreen (the )?(transport|beam|transporters?)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'other', description: c } }),
  },
  {
    name: 'tractor',
    test: /\btractor\b|\btow\b|\btowing\b/,
    build: (c) => ({
      kind: 'action',
      action: { type: 'tractor', engage: !/\b(release|disengage|let go|drop|cut|stop|off|deactivate|end)\b/.test(c), target: CRUISER.test(c) ? 'cruiser' : 'kestrel' },
    }),
  },
  {
    name: 'repairKestrel',
    test: /\b(stabili[sz]e|patch|seal|shore up|contain)\b.*\b(reactor|containment|core|kestrel|freighter|her|it)\b|\b(engineering|engineers?|damage control) (team|crew|party)\b|\bfix (the|their|her) (reactor|containment)\b/,
    build: (_c, ctx) => ({ kind: 'action', action: { type: 'repair', ship: 'kestrel', system: (ctx.contactRepair ?? 'reactor') as never } }),
  },
  {
    name: 'transport',
    test: /\b(beam|transport|evacuat\w*|teleport|bring (them|the crew|everyone|her crew|the survivors|people|.+) (aboard|over|across|home)|get (them|the crew|everyone|people|the survivors) (off|out|over|aboard)|rescue (the )?(crew|survivors|people|them|everyone)|send( over| across)? (a |an |our )?(\w+ )?(team|party)|boarding party|take (them|the crew) off|get (those|these|the|her|all|all the|all those) (people|crew|survivors|civilians) (off|out|over|aboard))\b/,
    build: (c, ctx) => {
      const names = ctx.passengerNames.length ? new RegExp(`\\b(${ctx.passengerNames.join('|')})\\b`) : null;
      let payload: 'crew' | 'passenger' | 'cargo' | 'rescueTeam' | 'medicalTeam' = 'crew';
      if (PASSENGER.test(c) || (names && names.test(c)) || /\b(compartment|hidden)\b/.test(c)) payload = 'passenger';
      else if (/\b(cargo|isotopes?|supplies)\b/.test(c)) payload = 'cargo';
      else if (/\b(rescue|security|cutting|boarding) (team|party)\b|\b(free|trapped|blast door|cut them out)\b/.test(c)) payload = 'rescueTeam';
      else if (/\b(medical|doctor|medic|medics|nurse)\b/.test(c)) payload = 'medicalTeam';
      return { kind: 'action', action: { type: 'transport', payload, from: 'kestrel', to: 'halcyon' } };
    },
  },
  {
    name: 'repair',
    test: /\b(repair|fix|restore|patch up|damage control)\b/,
    build: (c, ctx) => {
      const sys = systemsIn(c).filter((x) => x.id !== 'reactor' || /\bour reactor\b/.test(c));
      const contactWords = withAliases(/\b(their|kestrel|freighter|containment)\b/, 'kestrel');
      const repairWords = withAliases(/(?!)/, 'repair');
      if (contactWords.test(c) || repairWords.test(c) || (!ctx.contactRepair && /\breactor\b/.test(c) && !/\bour\b/.test(c))) return { kind: 'action', action: { type: 'repair', ship: 'kestrel', system: (ctx.contactRepair ?? 'reactor') as never } };
      const id = sys[0]?.id ?? ctx.mostDamaged;
      if (!id) return { kind: 'action', action: { type: 'query', topic: 'systems' } };
      return { kind: 'action', action: { type: 'repair', ship: 'halcyon', system: id as never } };
    },
  },
  {
    name: 'jumpCharge',
    test: /\b(charge|spin up|prep|prepare|ready|warm up)\b.*\b(jump|ftl|jump drive|hyperdrive)\b/,
    build: () => ({ kind: 'action', action: { type: 'jump', mode: 'charge' } }),
  },
  {
    name: 'jump',
    test: /\b(jump|engage (the )?jump|punch it|go to ftl|ftl)\b/,
    build: () => ({ kind: 'action', action: { type: 'jump', mode: 'engage' } }),
  },
  {
    name: 'flee',
    test: /\b(run|flee|head|make|break|bolt|retreat|fall back|withdraw|go|get|race|sprint|burn|dash|escape|set (a )?course)\b.*\b(border|agency space|isa space|agency territory|concord space|our space|friendly space|home space|safe space|our side|our territory)\b|\b(run|make a run|break|dash) for (the border|it\b(?=.*border))/,
    build: (c) => navDraft('flee', c),
  },
  {
    name: 'withdraw',
    test: /\b(withdraw|leave|get (us )?out( of here)?|disengage|bug out|run for it|flee|exit the reach|head home|go home|break off|abandon)\b/,
    build: () => ({ kind: 'action', action: { type: 'jump', mode: 'withdraw' } }),
  },
  {
    name: 'interpose',
    test: /\b(between|interpose|in the way|in harm's way|in the line of fire|in front of|put us in front|shield (the kestrel|the freighter|her|them) with (our|the) (ship|hull)|block (their|the|her|its) (line of fire|shot|guns|firing line))\b/,
    build: (c) => (/\bbetween (us|ourselves|the halcyon) and\b/.test(c) && !/\b(get|put|move|place|position|slide|bring)\b/.test(c) ? { kind: 'none' } : navDraft('interpose', c)),
  },
  {
    name: 'block',
    test: /\b(block|bar|obstruct|cut across|get in (the |their |her |its )?(path|way)|in (its|her|their|the|his) (path|way)|in the (cruiser|warship|freighter|kestrel)'?s? path|path of|cut (them|her|it|him) off|head (them|her|it|him) off|deny (them|her|it) (the|access|passage))\b/,
    build: (c) => navDraft('block', c),
  },
  {
    name: 'intercept',
    test: /\b(intercept|pursue|pursuit|chase|run (them|her|it) down|catch (up with|up to)?|go after|hunt|close and engage|run down)\b/,
    build: (c) => navDraft('intercept', c),
  },
  {
    name: 'follow',
    test: /\b(follow|shadow|tail|trail|stay (on|with) (them|her|it|the)|keep pace|match (their |her |its )?(course|speed|velocity|heading)|fall in behind|stay behind|behind (them|her|it|the))\b/,
    build: (c) => navDraft('follow', c),
  },
  {
    name: 'escort',
    test: /\b(escort|accompany|stay (alongside|beside|close to|next to|with the)|ride shotgun|convoy|formation (with|on)|fly (alongside|with)|cover (the )?(kestrel|freighter|her))\b/,
    build: (c) => navDraft('escort', c),
  },
  {
    name: 'orbit',
    test: /\b(orbit|circle|circle around|loop around|go around)\b/,
    build: (c) => navDraft('orbit', c),
  },
  {
    name: 'face',
    test: /\b(come about|bring (us |her |the ship )?about|turn (us |the ship |her )?(around|about|to face|toward|towards)|face|point (our|the) (bow|nose|ship)|swing (us |her )?around|bring (our |the )?bow|reverse (course|heading)|turn back)\b/,
    build: (c) => navDraft('face', c),
  },
  {
    name: 'evasive',
    test: /\b(evasive|evade|dodge|jink|zig\w*|break (left|right))\b/,
    build: (c) => navDraft('evasive', c),
  },
  {
    name: 'holdStation',
    test: /\b(hold|keep|maintain) station\b|\bstation[- ]?keep(ing)?\b|\bhold (our |this |your )?position\b|\bstay (here|put|where we are)\b|\bkeep (our|this) position\b/,
    build: (c) => navDraft('holdStation', c),
  },
  {
    name: 'allStop',
    test: /\b(all stop|full stop|stop (the ship|engines|here|moving|us|the engines)|halt|dead stop|come to a (stop|halt)|cut (the )?engines|stop where we are)\b/,
    build: (c) => navDraft('allStop', c),
  },
  {
    name: 'retreat',
    test: /\b(retreat|fall back|back off|back away|pull back|pull away|open the range|increase (the )?(distance|range)|move away|get away from|distance ourselves|back us (off|away|up)|put (some )?distance|open (up )?(some )?distance)\b/,
    build: (c) => navDraft('retreat', c),
  },
  {
    name: 'standoff',
    test: /\b(keep|maintain|hold|stay|remain|sit)\b.*\b(distance|range|\d{3,}|\d+\s*(km|kilomet|klick)|clear of)\b|\bstay out of\b|\bkeep (our|a|your|some) distance\b|\bstand off\b|\bstandoff\b/,
    build: (c) => navDraft('standoff', c),
  },
  {
    name: 'moveRange',
    test: /\b(take|bring|move|close|go|head|set|approach|range|get|position|put)\b.*(\d{3,}|\d+\s*(km|kilomet|klick)|(transporter|transport|tractor|beam|weapons?|torpedo|firing) range)/,
    build: (c) => navDraft('approach', c),
  },
  {
    name: 'approach',
    test: /\b(approach|ahead (slow|half|full|flank|standard)|close (in|on|with|the distance|to)|move (to|toward|towards|closer|in|us)|go (to|toward|towards)|head (to|for|toward|towards|over)|take us (in|to|closer|alongside|over)|bring us (in|alongside|closer|to)|set (a )?course|lay in a course|plot (a )?course|pull alongside|come alongside|alongside|get (us )?(closer|close|near|over)|move us|full impulse|full speed|maximum speed|max speed|ahead full|flank speed|engage engines|rendezvous|make for|proceed to|close range|draw (closer|near)|take us|bring us|get us (to|near|over))\b/,
    build: (c) => navDraft('approach', c),
  },
  {
    name: 'scan',
    test: /\bwhat (can )?(you )?report (about|on)\b|\bwhat do (we|you) (know|have) (about|on)\b|\bwhat('s| is| are) (the |that |this )?(\w+ )?(doing|up to)\b|\b(scan|sensors?|analy[sz]e|examine|investigate|study|probe|sweep|look at|check (out|on)?|inspect|identify|survey|readings?|life signs|what('s| is) (in|inside|on|aboard))\b/,
    build: (c) => {
      if (COMPARTMENT.test(c) && !/\b(our|my)\b/.test(c)) return { kind: 'action', action: { type: 'scan', target: 'compartment' } };
      if (/\b(sweep|long[- ]range|area|surroundings|the reach|around us|for (other|more) ships|horizon|the moon|saltglass|the surface)\b/.test(c)) return { kind: 'action', action: { type: 'scan', target: 'area' } };
      if (/\b(ourselves|our ship|the halcyon|our systems)\b/.test(c)) return { kind: 'action', action: { type: 'scan', target: 'halcyon' } };
      return { kind: 'action', action: { type: 'scan', target: 'kestrel' }, needs: 'contact' };
    },
  },
  {
    name: 'improviseOther',
    test: /\buse (the |our )?([a-z]+ ?){1,3} (as|to)\b|\b(ram|ramming)\b/,
    build: (c) => ({ kind: 'action', action: { type: 'improvise', method: 'other', description: c } }),
  },
  {
    name: 'wait',
    test: /\b(wait|stand by|standby|monitor|observe|hold on|do nothing|let's see|watch|keep an eye|pause|nothing for now|hold|continue|carry on|proceed|keep going|steady)\b/,
    build: () => ({ kind: 'action', action: { type: 'wait' } }),
  },
];

/** Negators that must never be read past into a positive weapons order. */
const NEGATED = /\b(not|never|don'?t|no|nobody|no one|nothing|neither|nor|without)\b/;
const POSITIVE_WEAPONS = new Set(['fire', 'lock', 'arm']);

function matchRule(clause: string, ctx: InterpreterContext): { rule: Rule; draft: Draft } | null {
  const c = clause.replace(DEPT_MARK, ' ').replace(/\s+/g, ' ').trim();
  for (const rule of RULES) {
    if (!rule.test.test(c)) continue;
    // Safety: "no one arms anything" must not arm weapons; leave it unparsed instead (the crew asks).
    if (POSITIVE_WEAPONS.has(rule.name) && NEGATED.test(c)) continue;
    const draft = rule.build(c, ctx);
    if (draft.kind === 'none') continue;
    return { rule, draft };
  }
  return null;
}

// ------------------------------------------------------ posture/rationale ---

const NEGATED_HOSTILITY =
  /\b((?:don|doesn|didn|aren|isn|won|wasn|weren|shouldn|mustn)'?t|do not|does not|are not|is not|never|not|no|without)\b.*\b(hostile|threatening|aggressive|provocative|a threat|threat|fight|fighting|trouble|escalat\w*|confrontation|attacking|war|hostilit\w*|spook|alarm|scare|provoke|antagoni[sz]e|look like we're attacking|intimidat\w*|harm)\b/;
const PEACEFUL = /\b(nonhostile|non-?threatening|peaceful(ly)?|in peace|friendly|harmless|de-?escalat\w*|keep (things|it|this|everything) (calm|cool|civil|quiet|peaceful|friendly|low[- ]key)|low[- ]key|unthreatening|non-?aggressive|nothing (aggressive|hostile|provocative|threatening)|easy does it|show (them|him) we('re| are) (peaceful|friendly|harmless))\b/;
const ASSERTIVE = /\b(mean business|show of force|look (threatening|dangerous|tough|strong|aggressive|menacing)|intimidat\w*|make (them|him) (nervous|think twice|sweat)|aggressive posture|assertive|show (them|him) our teeth)\b/;
/** Clauses that explain or justify rather than order. */
const RATIONALE_LEAD = /\b(comes? first|is (the|our) (priority|goal)|matters? most|first priority|above all|top priority)\b|^(we|we're|we are|i|i'm|our|the (goal|idea|point|aim|priority|plan)|that way|so|because|since|as|in order|remember|this is|it's|they|they're|nobody|no one)\b/;

function postureOf(c: string): 'nonHostile' | 'assertive' | null {
  const t = c.replace(DEPT_MARK, ' ');
  if (NEGATED_HOSTILITY.test(t) && !/\b(don'?t|do not|never)\b.*\b(back down|hold back|let them)\b/.test(t)) return 'nonHostile';
  if (ASSERTIVE.test(t)) return 'assertive';
  if (PEACEFUL.test(t)) return 'nonHostile';
  return null;
}

/** Purpose sub-clauses attached to an order: "lower shields so we look friendly". */
const PURPOSE = /\b(so (that )?(we|they|it|he)|to (look|appear|seem|show)|as a (sign|gesture)|so as not to|to avoid)\b/;

// --------------------------------------------------------------- clauses ---

const REPORTED_SPEECH = /^(that|we|we're|we are|i|i'm|our|they|they're|it|it's|this|you|you're|he|she|there|the (kestrel|crew|passenger|accords|treaty|fleet|battle group))\b/;

/** Fragments that continue the previous clause rather than starting a new order. */
const VERBLESS = /^(to|at|from|of|on|onto|in|into|with|toward|towards|the|our|her|their|its|his|a|an|all|both|every|each|some|full|half|slow|slowly|best|top|\d+|km|maximum|max|too|as well|now|it|them|him|us|that|this|those|these|asap|quickly|fast|immediately|if|when|before|after|until|while|beam|torpedoes|weapons?|shields?|sensors|engines?|everyone|everybody)\b/;

function clausesOf(sentence: string): string[] {
  return sentence
    .split(/\s*(?:,+\s*(?:and\s+|then\s+|but\s+)?|\s+with\s+(?=(?:our |the |its )?(?:shields|weapons|deflectors|guns)\b)|\s+and then\s+|\s+then\s+|\s+after that\s+|\s+and also\s+|\s+also\s+|\s+and\s+|\s+but\s+|\s+while\s+(?=[a-z]+ (?:the |our |us |them))|\s+plus\s+)\s*/)
    .map((x) => x.replace(/^(and|then|also|but|plus)\s+/, '').trim())
    .filter(Boolean);
}

/** Split into clauses, remembering which sentence each came from. */
function splitMarked(text: string, ctx: InterpreterContext): { clause: string; sentence: number }[] {
  const sentences = text.split(/(?<!\b(?:dr|doc|lt|cmdr|capt|mr|mrs|ms))\s*[.;]+\s*/i).map((x) => x.trim()).filter(Boolean);
  const out: { clause: string; sentence: number }[] = [];
  let speech = false;
  sentences.forEach((sentence, si) => {
    clausesOf(sentence).forEach((frag, fi) => {
      const prev = out[out.length - 1];
      const mm = matchRule(frag, ctx);
      const posture = postureOf(frag);
      const rationale = posture !== null || (!mm && RATIONALE_LEAD.test(frag.replace(DEPT_MARK, '').trim()));
      const continuation = /^(use (it|her|them|that|the beam)|so (that )?(we|they|it) (can|could)|to (cover|protect|shield|hide|block|mask))\b/.test(frag);
      const newSentence = fi === 0;
      const reported = speech && REPORTED_SPEECH.test(frag) && (!mm || mm.rule.name !== 'communicate');
      let merge = false;
      if (prev !== undefined) {
        if (reported && !(newSentence && rationale)) merge = true; // "tell them we mean no harm"
        else if (continuation && !newSentence) merge = true;
        else if (!mm && !rationale && !newSentence && VERBLESS.test(frag)) merge = true; // verbless fragment: "…to 5,000 km"
        else if (/^(on|onto) (the )?(main )?(screen|viewer)$/.test(frag)) merge = true;
      }
      if (merge && prev) {
        prev.clause = `${prev.clause} and ${frag}`;
        return;
      }
      out.push({ clause: frag, sentence: si });
      speech = !!mm && mm.rule.name === 'communicate';
    });
  });
  return out;
}

export function splitClauses(text: string, ctx: InterpreterContext): string[] {
  return splitMarked(text, ctx).map((x) => x.clause.replace(DEPT_MARK, ' ').replace(/\s+/g, ' ').trim());
}

// --------------------------------------------------------------- resolve ---

interface Parsed {
  clause: string;
  sentence: number;
  dept: Dept | null;
  draft: Extract<Draft, { kind: 'action' }> | null;
  extra: ProposedActionInput[];
  note: string | null;
  explicit: TargetRef;
  refs: ReturnType<typeof refsIn>;
}

const BASE_LABELS = { kestrel: 'the Kestrel', cruiser: 'the cruiser' };
/** v0.6: how clarifying questions name the two contacts (the scenario's ship names; the Kestrel's words by default). */
let OPTIONS_CONTACTS = [BASE_LABELS.kestrel, BASE_LABELS.cruiser];
/** v0.7.1: contacts actually on sensors (null: a hand-built context, v0.6 behaviour). */
let VISIBLE: InterpreterContext['visible'] | null = null;
let REF_LABEL: Record<Ref, string> = { ...BASE_LABELS, border: 'the border' };
const whichContact = () => `${OPTIONS_CONTACTS[0]} or ${OPTIONS_CONTACTS[1]}`;
type Clar = { question: string; options: string[]; clause: string };

/** Maneuvers that need a target, and the default when none is given. */
function defaultNavTarget(intent: ManeuverIntentT, c: string, ctx: InterpreterContext): Ref | null {
  const vis = ctx.visible;
  const hostile = vis.includes('cruiser') ? 'cruiser' : null;
  switch (intent) {
    case 'retreat':
    case 'block':
    case 'intercept':
    case 'follow':
      return hostile ?? (vis.length === 1 ? vis[0] : null);
    case 'standoff':
      if (/\b(weapons?|beam|firing|torpedo) range\b|\bout of range\b/.test(c) && hostile) return hostile;
      return vis.length === 1 ? vis[0] : null;
    case 'escort':
      return vis.includes('kestrel') ? 'kestrel' : null;
    default:
      return vis.length === 1 ? vis[0] : null;
  }
}

const NO_TARGET: ManeuverIntentT[] = ['allStop', 'evasive', 'flee'];
const OPTIONAL_TARGET: ManeuverIntentT[] = ['holdStation', 'face'];

function resolveTargets(parsed: Parsed[], ctx: InterpreterContext): { actions: ProposedActionInput[]; clarify: Clar | null } {
  const actions: ProposedActionInput[] = [];
  let clarify: Clar | null = null;
  let carried: TargetRef = null;
  /** Most recent antecedent in this input: a single contact or the pair. */
  let antecedent: Contact | 'pair' | null = null;
  const pairVisible = ctx.visible.includes('kestrel') && ctx.visible.includes('cruiser');

  parsed.forEach((p, i) => {
    const shipRefs = p.refs.refs.filter((r): r is Contact => r !== 'border');
    // Does a plural word in this clause refer to the pair?
    const pluralMeansPair = pairVisible && (p.refs.pair || (p.refs.plural && shipRefs.length === 0 && antecedent === 'pair'));
    const updateAntecedent = () => {
      if (shipRefs.length >= 2 || (pairVisible && p.refs.pair)) antecedent = 'pair';
      else if (shipRefs.length === 1) antecedent = shipRefs[0];
    };

    if (p.note || !p.draft) {
      updateAntecedent();
      for (const x of p.extra) actions.push(x);
      return;
    }
    const d = p.draft;
    const a = { ...d.action } as Record<string, unknown>;
    let target: TargetRef = p.explicit;
    const pronoun = !p.explicit && (p.refs.plural || p.refs.singular);
    if (!target && pronoun && !pluralMeansPair) {
      if (p.refs.singular && typeof antecedent === 'string' && antecedent !== 'pair') target = antecedent;
      else if (p.refs.plural && antecedent && antecedent !== 'pair') target = antecedent;
      else target = d.needs === 'commTarget' ? (ctx.lastCommTarget ?? ctx.lastTarget) : ctx.lastTarget;
    }
    if (!target && d.needs && d.needs !== 'nav' && !pluralMeansPair) {
      target = carried;
      if (!target) for (let j = i + 1; j < parsed.length; j++) if (parsed[j].explicit) { target = parsed[j].explicit; break; }
    }
    if (p.explicit || (pronoun && target)) carried = target;
    // A singular reference ("it", "her", "the ship") with nothing to refer to: ask, never guess.
    const unresolved = !!pronoun && p.refs.singular && !target && pairVisible && p.refs.refs.length === 0;
    if (unresolved && d.needs && d.needs !== 'system' && !(d.needs === 'nav' && (a.intent === 'interpose' || NO_TARGET.includes(a.intent as ManeuverIntentT) || OPTIONAL_TARGET.includes(a.intent as ManeuverIntentT)))) {
      const verb = d.needs === 'commTarget' ? 'Open a channel to' : d.needs === 'nav' ? verbFor(a.intent as ManeuverIntentT) : a.type === 'scan' ? 'Scan' : 'Target';
      clarify = clarify ?? { question: `${verb} which contact, Captain — ${whichContact()}?`, options: OPTIONS_CONTACTS, clause: p.clause };
      return;
    }

    if (d.needs === 'system') {
      clarify = clarify ?? { question: d.question ?? 'Which system, Captain?', options: ['shields', 'weapons', 'engines', 'sensors'], clause: p.clause };
      updateAntecedent();
      return;
    }
    if (d.needs === 'commTarget') {
      const intent = a.intent as CommIntent;
      const untargeted = !p.explicit && !pronoun && antecedent === 'pair' && intent === 'open';
      if (pluralMeansPair || untargeted || (ALL_TARGETS.test(p.clause) && !p.explicit)) {
        a.target = 'all';
        antecedent = 'pair';
        actions.push(a as ProposedActionInput);
        return;
      }
      if (target === 'passenger' && !ctx.passengerKnown) target = null;
      // "Bring us in … and hail the ship": the ship this order is about.
      if (!target && /\bthe (ship|vessel|contact)\b/.test(p.clause) && (antecedent === 'kestrel' || antecedent === 'cruiser')) target = antecedent;
      if (!target) {
        if (['bluff', 'warn', 'legal', 'trade', 'appeal'].includes(intent) && ctx.visible.includes('cruiser')) target = 'cruiser';
        else if (intent === 'offerAsylum' && ctx.passengerKnown && ctx.passengerAwake) target = 'passenger';
        else if (ctx.visible.length === 1) target = ctx.visible[0];
        else if (/\b(cargo|compartment|hold)\b/.test(p.clause) && ctx.visible.includes('kestrel')) target = 'kestrel';
      }
      if (!target) {
        // v0.7.1: only contacts on sensors are offered; with none, the hail goes out to no one (the
        // validator answers "no vessels on sensors") rather than naming another scenario's ships.
        if (VISIBLE && VISIBLE.length === 0) {
          a.target = 'all';
          actions.push(a as ProposedActionInput);
          return;
        }
        clarify = clarify ?? { question: `Open a channel to which vessel, Captain — ${OPTIONS_CONTACTS[0]}, ${OPTIONS_CONTACTS[1]}, or both?`, options: [...OPTIONS_CONTACTS, 'both ships'], clause: p.clause };
        return;
      }
      a.target = target;
      // "Offer the Kestrel" to the Kestrel herself makes no sense; offers go to the cruiser.
      if (intent === 'trade' && a.target === 'kestrel' && a.offer === 'kestrel') a.target = 'cruiser';
      // Offering the passenger is addressed to whoever wants them: the Prefect.
      if (intent === 'trade' && a.offer === 'passenger' && a.target === 'passenger') a.target = 'cruiser';
      carried = target;
      if (target !== 'passenger') antecedent = target;
      actions.push(a as ProposedActionInput);
      return;
    }
    if (d.needs === 'nav') {
      const intent = a.intent as ManeuverIntentT;
      const refs: Ref[] = [...p.refs.refs];
      if (target === 'kestrel' || target === 'cruiser') if (!refs.includes(target)) refs.push(target);
      if (target === 'passenger' && !refs.includes('kestrel')) refs.push('kestrel');
      if (intent === 'interpose') {
        let pairRefs: Ref[] = refs.slice(0, 2);
        if (pairRefs.length < 2 && (pluralMeansPair || (refs.length === 0 && pairVisible))) pairRefs = ['kestrel', 'cruiser'];
        // "Get between them and the freighter": the pronoun names the other ship.
        if (pairRefs.length === 1 && (p.refs.plural || p.refs.singular)) {
          const other = [antecedent, ctx.lastTarget].find((x): x is Contact => (x === 'kestrel' || x === 'cruiser') && x !== pairRefs[0] && ctx.visible.includes(x));
          if (other) pairRefs = [pairRefs[0], other];
        }
        if (pairRefs.length < 2) {
          const x = pairRefs[0] ?? null;
          if (!x) {
            clarify = clarify ?? { question: 'Between which two, Captain?', options: [`${OPTIONS_CONTACTS[0]} and ${OPTIONS_CONTACTS[1]}`], clause: p.clause };
            return;
          }
          const others = (['kestrel', 'cruiser', 'border'] as Ref[]).filter((r) => r !== x && (r === 'border' || ctx.visible.includes(r)));
          const opts = others.map((o) => `${REF_LABEL[x]} and ${o === 'border' ? 'the border' : REF_LABEL[o]}`);
          clarify = clarify ?? { question: `Interpose between ${opts.join(', or between ')}?`.replace(/^Interpose between the/, 'Interpose between the'), options: opts, clause: p.clause };
          return;
        }
        // The border is a landmark; keep a ship as the primary reference.
        if (pairRefs[0] === 'border') pairRefs = [pairRefs[1], pairRefs[0]];
        a.target = pairRefs[0];
        a.second = pairRefs[1];
        antecedent = pairRefs.includes('border') ? (pairRefs[0] as Contact) : 'pair';
        actions.push(a as ProposedActionInput);
        return;
      }
      if (NO_TARGET.includes(intent)) {
        if (intent === 'evasive' && refs[0] && refs[0] !== 'border') a.target = refs[0];
        actions.push(a as ProposedActionInput);
        return;
      }
      let ref: Ref | null = refs.find((r) => r !== 'border') ?? (refs.includes('border') ? 'border' : null);
      if (ref === 'border' && intent !== 'face') {
        actions.push({ type: 'maneuver', intent: 'flee', speed: a.speed as 'full' } as ProposedActionInput);
        return;
      }
      if (!ref && pluralMeansPair) {
        // "close on them" with both in view: ambiguous.
        clarify = clarify ?? { question: `${verbFor(intent)} which contact, Captain — ${whichContact()}?`, options: OPTIONS_CONTACTS, clause: p.clause };
        return;
      }
      // "Approach the cruiser but stay at 20,000 km": a range order with no name refers to the contact just named.
      if (!ref && ['standoff', 'approach', 'holdStation', 'orbit'].includes(intent) && (antecedent === 'kestrel' || antecedent === 'cruiser')) ref = antecedent;
      // "Bring us in": in a distress call, in means toward the ship in distress.
      if (!ref && intent === 'approach' && /\b(bring|take|move|go|close|head) (us )?in\b/.test(p.clause) && ctx.visible.includes('kestrel')) ref = 'kestrel';
      // "Get us within transporter range": only the Kestrel can be transported to.
      if (!ref && /\btransport(er)? range\b/.test(p.clause) && ctx.visible.includes('kestrel')) ref = 'kestrel';
      if (!ref && !OPTIONAL_TARGET.includes(intent)) ref = defaultNavTarget(intent, p.clause, ctx);
      if (!ref && !OPTIONAL_TARGET.includes(intent)) {
        clarify = clarify ?? { question: `${verbFor(intent)} which contact, Captain — ${whichContact()}?`, options: OPTIONS_CONTACTS, clause: p.clause };
        return;
      }
      if (ref) {
        a.target = ref;
        if (ref !== 'border') {
          carried = ref;
          antecedent = ref;
        }
      }
      actions.push(a as ProposedActionInput);
      return;
    }
    if (d.needs === 'contact') {
      let contact: Contact | null = target === 'kestrel' || target === 'cruiser' ? target : null;
      if (target === 'passenger') contact = 'kestrel';
      const type = a.type as string;
      if (!contact && !pluralMeansPair) {
        // Safety (v0.4): an untargeted "fire" never guesses between two ships. It uses the current
        // lock; "return fire" means the warship (the only ship that shoots at us); otherwise ask.
        if (type === 'weapons' && a.mode === 'fire') {
          if (ctx.weaponsTarget && ctx.visible.includes(ctx.weaponsTarget)) contact = ctx.weaponsTarget;
          else if (/\breturn(ing)? fire\b/.test(p.clause) && ctx.visible.includes('cruiser')) contact = 'cruiser';
          else if (ctx.visible.length === 1) contact = ctx.visible[0];
        } else if (type === 'weapons' && ctx.visible.includes('cruiser')) contact = 'cruiser';
        else if (ctx.visible.length === 1) contact = ctx.visible[0];
      }
      if (!contact) {
        const verb = type === 'scan' ? 'Scan' : a.mode === 'fire' ? 'Fire on' : 'Target';
        clarify = clarify ?? { question: `${verb} which contact, Captain — ${whichContact()}?`, options: OPTIONS_CONTACTS, clause: p.clause };
        return;
      }
      a.target = contact;
      carried = contact;
      antecedent = contact;
    } else updateAntecedent();
    actions.push(a as ProposedActionInput);
    for (const x of p.extra) actions.push(x);
  });
  return { actions, clarify };
}

function verbFor(intent: ManeuverIntentT): string {
  return (
    {
      approach: 'Approach',
      standoff: 'Hold range from',
      intercept: 'Intercept',
      follow: 'Shadow',
      escort: 'Escort',
      block: 'Block',
      retreat: 'Retreat from',
      orbit: 'Orbit',
      face: 'Face',
      holdStation: 'Hold station on',
    } as Partial<Record<ManeuverIntentT, string>>
  )[intent] ?? 'Which contact —';
}

/** Department-specific readings of ambiguous verbs. */
function applyDept(p: Parsed): void {
  if (!p.draft || !p.dept) return;
  const act = p.draft.action as Record<string, unknown>;
  if (p.dept === 'tactical' && act.type === 'setAlert' && act.level === 'green' && /\bstand down\b/.test(p.clause)) {
    p.draft = { kind: 'action', action: { type: 'weapons', mode: 'safe' } };
  }
  if (p.dept === 'helm' && act.type === 'wait' && /\b(hold|steady)\b/.test(p.clause)) {
    p.draft = { kind: 'action', action: { type: 'maneuver', intent: 'holdStation', speed: 'full' }, needs: 'nav' };
  }
}

/** The v0.3 clause parser: one order set, no conditions or sequencing. */
function interpretCore(input: string, ctx: InterpreterContext): Interpretation {
  const source = 'offline-parser';
  let text = normaliseMarked(input);
  if (!text.replace(DEPT_MARK, '').trim()) return { kind: 'unrecognised', unparsed: [input.trim()], notes: [], source };

  // Answering a clarifying question? ("the cruiser", "shields", "the Kestrel and the cruiser")
  if (ctx.pending && !matchRule(text, ctx) && !postureOf(text)) text = `${ctx.pending.clause} ${text}`;

  let dept: Dept | null = null;
  let lastSentence = -1;
  const parsed: Parsed[] = splitMarked(text, ctx).map(({ clause: raw, sentence }) => {
    if (sentence !== lastSentence) dept = null;
    lastSentence = sentence;
    const marks = [...raw.matchAll(DEPT_MARK)];
    if (marks.length) dept = marks[marks.length - 1][1] as Dept;
    const clause = raw.replace(DEPT_MARK, ' ').replace(/\s+/g, ' ').trim();
    const mm = matchRule(clause, dept ? { ...ctx, addressee: dept } : ctx);
    const posture = SPEECH.test(clause) ? null : postureOf(clause);
    const rationaleLed = RATIONALE_LEAD.test(clause);
    const p: Parsed = { clause, sentence, dept, draft: null, extra: [], note: null, explicit: explicitTarget(clause, ctx), refs: refsIn(clause) };
    if (posture && (!mm || rationaleLed || mm.rule.name === 'wait' || mm.rule.name === 'options' || mm.rule.name === 'fire')) {
      p.draft = { kind: 'action', action: { type: 'posture', stance: posture } };
      p.note = clause;
      p.extra = [p.draft.action];
      p.draft = null;
    } else if (mm && mm.draft.kind === 'action') {
      p.draft = mm.draft;
      if (mm.draft.extra?.length) p.extra = [...mm.draft.extra];
      if (posture && PURPOSE.test(clause)) p.extra = [...p.extra, { type: 'posture', stance: posture }];
      // "Cut them off before they reach the freighter": the freighter is what we protect, not the target.
      if (mm.rule.name === 'block' && /\bbefore (they|it|she|he|the \w+) /.test(clause)) {
        const head = clause.replace(/\bbefore\b.*$/, '');
        p.refs = refsIn(head);
        p.explicit = explicitTarget(head, ctx);
      }
    } else if (rationaleLed) p.note = clause;
    applyDept(p);
    return p;
  });
  const unparsed = parsed.filter((p) => !p.draft && !p.note).map((p) => p.clause);
  const notes = parsed.filter((p) => p.note && !p.extra.length).map((p) => p.note as string);
  const { actions, clarify } = resolveTargets(parsed, ctx);
  void contactOf;

  // One posture per order set is enough.
  const seen = new Set<string>();
  const deduped = actions.filter((a) => {
    if ((a as { type: string }).type !== 'posture') return true;
    const k = JSON.stringify(a);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const result: Interpretation = clarify
    ? { kind: 'clarify', clarification: clarify, actions: deduped as never, unparsed, notes, source }
    : deduped.length
      ? { kind: 'actions', actions: deduped as never, unparsed, notes, source }
      : { kind: 'unrecognised', unparsed: unparsed.length ? unparsed : [input.trim()], notes, source };
  // Validate (and apply schema defaults) — interpreters never bypass the schema.
  if (result.kind !== 'unrecognised' && result.actions.length > 8) result.actions = result.actions.slice(0, 8);
  return safe(result, input);
}

// ------------------------------------------------------------ structure ---
//
// v0.4: the whole command is read as a plan before anything happens. Each
// sentence may be plain, conditional ("if/when/once …, …" / "… only if …"),
// a prohibition with an exit ("don't fire unless fired upon"), or sequenced
// ("…, then …" after a helm order). Persistence ("no matter what") and
// "but not until then" modify the sentence they are in. Teaching ("when I say
// X, I mean Y") is its own order. Anything unclear asks.

type Trig = Extract<ProposedActionInput, { type: 'standing' }>['trigger'];
type Act = ProposedActionInput;

const TEACH = /^\s*(?:remember[:,]?\s*)?(?:when|whenever|if) i say\s+["'“‘]?(.+?)["'”’]?\s*,?\s+i mean\s+(.+?)[.!]?\s*$/i;
const PERSIST = /\b(no matter what|whatever happens|at all costs|regardless of what happens|regardless|come what may|under any circumstances|whatever it takes|until i say otherwise|until further notice)\b/;
const HOLD_POSITION = /\b(?:and )?(?:hold|keep|maintain) (?:that|this|the) (?:position|station)\b/;
const NOT_UNTIL = /,?\s*(?:but |and )?(?:not|never) (?:until|before) (?:then|that( happens)?|it does|they do|she does)\b|,?\s*and not before\b/;
const COND_LEAD = /^(?:only )?(if|when|whenever|once|as soon as|the moment|in case|should)\s+(.+?)\s*,\s*(.+)$/;
const COND_TAIL = /^(.+?)\s+(only if|only when|if|when|whenever|once|as soon as|the moment|in case)\s+(.+)$/;
const UNLESS = /^(.+?)\s+unless\s+(.+)$/;
const THEN = /^(.+?)(?:\s*,\s*|\s+)(?:and\s+)?then\s+(.+)$/;
const DEPT_WORD: Record<Dept, string> = { helm: 'helm, ', tactical: 'tactical, ', ops: 'ops, ', science: 'science, ', comms: 'comms, ', xo: '' };
const unmark = (t: string) => t.replace(DEPT_MARK, (_m, d: Dept) => DEPT_WORD[d]).replace(/\s+/g, ' ').trim();

function shipIn(c: string): Contact | null {
  const k = KESTREL.exec(c);
  const cr = CRUISER.exec(c);
  if (k && cr) return k.index < cr.index ? 'kestrel' : 'cruiser';
  return k ? 'kestrel' : cr ? 'cruiser' : null;
}

/** "the Kestrel arms its weapons" → a Trigger, or null when it is not something the crew can watch for. */
export function parseTrigger(cond: string, antecedent: Contact | null): Trig | null {
  const c = cond.replace(DEPT_MARK, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(we (arrive|get there|reach (her|it|them|the \w+|position)|are (there|in position|alongside|in range)|have arrived|get close)|we're (there|in position|alongside|in range)|we've (arrived|reached)|in position|on arrival|we are close enough|we're close enough|you get there|you arrive)\b/.test(c)) return { kind: 'helmDone' };
  const named = shipIn(c);
  const pron = /\b(they|them|she|her|it|its|their)\b/.test(c) ? antecedent : null;
  const num = /\b(within|inside|closer than|under|less than|beyond|outside|more than|further than|farther than|past|over|closes? to|gets? to|comes? to)\s+(\d+(?:\.\d+)?)\s*(k\b|km|kilomet\w*|klicks?)?/.exec(c);
  if (num) {
    let n = parseFloat(num[2]);
    if (num[3] === 'k' || (!num[3] && n < 1000)) n *= 1000;
    const op = /^(beyond|outside|more than|further than|farther than|past|over)$/.test(num[1]) ? 'beyond' : 'within';
    const ship = named ?? pron;
    if (!ship) return null;
    return { kind: 'range', ship, op, km: Math.round(n) };
  }
  if (/\b(locks?|locked|lock on|lock onto|lock on to|targets? us|gets? a (weapons )?lock|acquires? (a )?lock|paints us)\b/.test(c)) {
    const ship = named ?? pron ?? 'cruiser';
    return { kind: 'weapons', ship, state: 'locked' };
  }
  if (/\b(fires?|fired|shoots?|shot at|opens? fire|attacks?|takes? a shot|under fire|fired (up)?on|fire on us|shoot at us)\b/.test(c)) {
    const ship = named ?? pron ?? 'cruiser';
    return { kind: 'weapons', ship, state: 'fired' };
  }
  if (/\b(arms?|armed|powers? up|charges?|readies|readying|brings? up|activates?|goes? hot|run(s)? out)\b.*\b(weapons?|guns|point[- ]defen[cs]e|turrets?|cannons?|beams?)\b|\b(weapons?|guns|point[- ]defen[cs]e) (go |goes |are )?(hot|armed|online|powered|up|charged)\b|\barms? (itself|herself|themselves|up)\b|\bgets? armed\b/.test(c)) {
    const ship = named ?? pron;
    if (!ship) return null;
    return { kind: 'weapons', ship, state: 'armed' };
  }
  return null;
}

/** Which prohibition keeps a conditional action from happening early ("but not until then"). */
function holdFor(a: Act): Extract<ProposedActionInput, { type: 'restrict' }>['subject'] | null {
  if (a.type === 'shields') return a.raise ? 'raiseShields' : 'lowerShields';
  if (a.type === 'weapons') return a.mode === 'fire' ? 'fireWeapons' : a.mode === 'arm' || a.mode === 'lock' ? 'armWeapons' : null;
  return null;
}

const STANDING_TYPES = new Set(['query', 'setAlert', 'shields', 'scan', 'communicate', 'maneuver', 'posture', 'power', 'weapons', 'tractor', 'transport', 'repair', 'jump', 'improvise', 'wait']);
const lastContactOf = (actions: Act[], prev: Contact | null): Contact | null => {
  let t = prev;
  for (const a of actions) {
    const x = (a as { target?: string }).target;
    if (x === 'kestrel' || x === 'cruiser') t = x;
  }
  return t;
};

interface Piece {
  actions: Act[];
  unparsed: string[];
  notes: string[];
  clarify: Clar | null;
}

function piece(r: Interpretation): Piece {
  return { actions: r.kind === 'unrecognised' ? [] : (r.actions as Act[]), unparsed: r.kind === 'unrecognised' ? r.unparsed : r.unparsed, notes: r.notes, clarify: r.kind === 'clarify' ? r.clarification : null };
}

function conditional(trigger: Trig, body: string, ctx: InterpreterContext, opts: { hold: boolean; clause: string }): Piece {
  const r = piece(interpretCore(unmark(body), ctx));
  if (r.clarify) return r;
  const acts = r.actions.filter((a) => a.type !== 'posture' && a.type !== 'wait');
  const bad = acts.filter((a) => !STANDING_TYPES.has(a.type));
  if (!acts.length || bad.length || acts.length > 4) {
    return { actions: [], unparsed: [], notes: [], clarify: { question: `I can't hold "${body}" as a standing order, Captain. What should we do when that happens?`, options: [], clause: opts.clause } };
  }
  const out: Act[] = [{ type: 'standing', trigger, actions: acts as never }];
  if (opts.hold) for (const a of acts) {
    const subject = holdFor(a);
    if (subject) out.push({ type: 'restrict', subject, until: trigger });
  }
  return { actions: [...r.actions.filter((a) => a.type === 'posture'), ...out], unparsed: r.unparsed, notes: r.notes, clarify: null };
}

/** One sentence → a piece of the plan. */
function sentencePiece(raw: string, ctx: InterpreterContext, prior: { contact: Contact | null; helmPending: boolean }): Piece {
  let t = raw;
  const persistent = PERSIST.test(t);
  if (persistent) t = t.replace(PERSIST, ' ').replace(HOLD_POSITION, ' ');
  const notUntil = NOT_UNTIL.test(t);
  if (notUntil) t = t.replace(NOT_UNTIL, ' ');
  t = t.replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s+,/g, ',');
  if (!t.replace(DEPT_MARK, '').trim()) return { actions: [], unparsed: [], notes: [], clarify: null };
  const sub: InterpreterContext = { ...ctx, lastTarget: prior.contact ?? ctx.lastTarget };
  const bare = t.replace(DEPT_MARK, ' ').replace(/\s+/g, ' ').trim();

  // Conditional, condition first: "If the Kestrel arms its weapons, raise our shields".
  const lead = COND_LEAD.exec(bare);
  if (lead) {
    const trig = parseTrigger(lead[2], prior.contact);
    if (!trig) return { actions: [], unparsed: [], notes: [], clarify: { question: `I'm not sure what to watch for in "${lead[1]} ${lead[2]}", Captain. Can you put it another way?`, options: [], clause: raw } };
    return conditional(trig, lead[3], sub, { hold: notUntil || /^only\b/.test(bare), clause: raw });
  }
  // Prohibition with an exit: "Don't fire unless fired upon".
  const unless = UNLESS.exec(bare);
  if (unless) {
    const trig = parseTrigger(unless[2], prior.contact);
    const body = piece(interpretCore(unmark(unless[1]), sub));
    const restricts = body.actions.filter((a) => a.type === 'restrict');
    if (trig && restricts.length && !body.clarify) return { ...body, actions: body.actions.filter((a) => a.type !== 'weapons' || (a as { mode: string }).mode !== 'safe').map((a) => (a.type === 'restrict' ? { ...a, until: trig } : a)) };
    return { actions: [], unparsed: [], notes: [], clarify: { question: `I can't make "${unless[1]}" conditional on "${unless[2]}", Captain. Should we do it now, or hold?`, options: [], clause: raw } };
  }
  // Conditional, condition last: "Raise shields only if the Kestrel arms its weapons".
  const tail = COND_TAIL.exec(bare);
  if (tail && !/\b(tell|warn|say|inform|threaten|explain|assure|promise|remind)\b/.test(tail[1])) {
    const trig = parseTrigger(tail[3], prior.contact);
    if (trig) return conditional(trig, tail[1], sub, { hold: notUntil || /^only /.test(tail[2]), clause: raw });
  }
  // Sequencing after a helm order: "Close on the Kestrel, then beam the crew aboard".
  const seq = THEN.exec(bare);
  const startsThen = /^then\s+/.test(bare);
  if ((seq || startsThen) && !notUntil) {
    const headText = startsThen ? '' : seq![1];
    const tailText = startsThen ? bare.replace(/^then\s+/, '') : seq![2];
    const head = headText ? piece(interpretCore(unmark(headText), sub)) : { actions: [], unparsed: [], notes: [], clarify: null };
    const helm = head.actions.some((a) => a.type === 'maneuver') || (startsThen && prior.helmPending);
    if (helm && !head.clarify) {
      const after = conditional({ kind: 'helmDone' }, tailText, { ...sub, lastTarget: lastContactOf(head.actions, sub.lastTarget as Contact | null) }, { hold: false, clause: raw });
      return { actions: [...head.actions, ...after.actions], unparsed: [...head.unparsed, ...after.unparsed], notes: [...head.notes, ...after.notes], clarify: after.clarify };
    }
  }
  const r = piece(interpretCore(unmark(t), sub));
  if (persistent) {
    const extra: Act[] = [];
    r.actions = r.actions.map((a) => (a.type === 'maneuver' ? { ...a, persistent: true } : a));
    for (const a of r.actions) {
      // "Keep the shields down no matter what" is a standing prohibition, not just a state.
      if (a.type === 'shields') extra.push({ type: 'restrict', subject: a.raise ? 'lowerShields' : 'raiseShields' });
      if (a.type === 'weapons' && a.mode === 'safe') extra.push({ type: 'restrict', subject: 'armWeapons' });
    }
    for (const x of extra) if (!r.actions.some((a) => a.type === 'restrict' && (a as { subject: string }).subject === (x as { subject: string }).subject)) r.actions.push(x);
  }
  return r;
}

export function interpretSync(input: string, ctx: InterpreterContext): Interpretation {
  const source = 'offline-parser';
  applyScenarioVocabulary(ctx);
  const teach = TEACH.exec(input.trim());
  if (teach) {
    const phrase = teach[1].toLowerCase().replace(/[^a-z0-9' -]/g, '').trim();
    const meaning = teach[2].trim();
    if (phrase.length >= 2 && meaning.length >= 2) return { kind: 'actions', actions: [{ type: 'learn', phrase, meaning }] as never, unparsed: [], notes: [], source };
  }
  // Answering a clarifying question goes straight to the clause parser (it knows the pending clause).
  if (ctx.pending) return interpretCore(input, ctx);
  // v0.5: bridge commands — the simulation archive, beginning / ending a simulation, the survey.
  const bridge = bridgeCommand(input, ctx);
  if (bridge) return { kind: 'actions', actions: [bridge] as never, unparsed: [], notes: [], source };
  // v0.5: "why?" / "Rask, why did you refuse?" asks the officer to explain a refusal.
  const why = whyQuery(input, ctx);
  if (why) return { kind: 'actions', actions: [why] as never, unparsed: [], notes: [], source };
  // v0.5: with a channel open (or someone addressed by name) speech and crew orders are separated first.
  const routed = routeComms(input, ctx, (t, c) => ordersSync(t, c));
  const r0 = routed ? safe(routed, input) : ordersSync(input, ctx);
  // v0.7.1: with nothing on sensors there is no "which contact?" to ask (it would name ships that
  // are not there); the sensors answer instead.
  const r: Interpretation = r0.kind === 'clarify' && VISIBLE && VISIBLE.length === 0 && /\bwhich (?:contact|vessel)\b/.test(r0.clarification.question) ? { kind: 'actions', actions: [{ type: 'query', topic: 'contacts' }] as never, unparsed: [], notes: [], source } : r0;
  // v0.5: "Okafor, how are the engines?" — an officer addressed with something that is not an order is small talk.
  if (r.kind === 'unrecognised') {
    const chat = crewChatOf(input);
    if (chat) return { kind: 'actions', actions: [chat] as never, unparsed: [], notes: [], source };
  }
  return r;
}

const SIM_WORD = '(?:simulation|sim|simulator|drill|exercise|training(?: simulation| run| exercise)?|holo(?:gram|deck)?(?: program(?:me)?)?|(?:simulation|training|holo) program(?:me)?)';
const LEAD = "^(?:(?:computer|ship|ops|xo|number one|first officer|commander|marrow)[,:]?\\s+)?(?:please\\s+)?(?:(?:can|could|would) you\\s+)?(?:let'?s\\s+)?";
const BEGIN_SIM = new RegExp(`${LEAD}(?:begin|start|run|load|launch|initiate|commence|play|engage|activate|set up|give me|i want|i'd like|we'?ll (?:run|do))\\s+(?:up\\s+)?(?:the\\s+|a\\s+|another\\s+|new\\s+)*(?:(.{0,40}?)\\s+)?${SIM_WORD}\\b(?:\\s+(?:of|called|named|for)\\s+(.+)|\\s+(?:number\\s+|no\\.?\\s+|#\\s*)?(\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten)\\b)?|${LEAD}(?:begin|start|run|load|launch|play)\\s+(?:the\\s+)?(${SIMULATION_NAME_PATTERN})\\b`);
const END_SIM = new RegExp(`${LEAD}(?:end|stop|terminate|exit|abort|cancel|quit|close|leave|freeze)\\s+(?:the\\s+|this\\s+)?${SIM_WORD}\\b|^(?:computer[,:]?\\s+)?(?:end|exit) program(?:me)?\\b`);
/** "List simulations", "what simulations are available?", "which training simulations do we have?" */
const LIST_SIMS = new RegExp(`${LEAD}(?:list|name|read(?: out)?|tell me)\\s+(?:the\\s+|all\\s+|our\\s+|the available\\s+)*(?:training\\s+)?(?:simulations|sims|training (?:simulations|programs?|programmes?))\\b|\\b(?:what|which)\\s+(?:training\\s+)?(?:simulations|sims)\\b(?:.*\\b(?:available|have|are there|on file|can (?:i|we) (?:run|play|do)|do we))?|\\bhow many (?:training )?simulations\\b`);
const OPEN_ARCHIVE = new RegExp(`${LEAD}(?:open|show(?: me)?|display|bring up|pull up|access|list|go to)\\s+(?:the\\s+|my\\s+|our\\s+)?(?:simulation|mission|training|sim)?\\s*(?:archive|library|records?|simulations|missions list)\\b`);
const SURVEY = /\b(?:what|which|any|list|show(?: me)?|tell me about)\b.*\b(?:systems?|stars?|worlds?|planets?)\b.*\b(?:exploration|survey|sensor|jump)? ?(?:range|nearby|near us|in reach|around us|close by|within reach)\b|\b(?:survey|chart) (?:the )?(?:local |nearby )?(?:systems|neighbou?rhood|area)\b/;

const CIVS = /\b(?:civili[sz]ations?|inhabited (?:systems?|worlds?|planets?)|intelligent life|alien (?:life|signals?|species)|(?:other |new )?species|cultures|peoples|first contact candidates?)\b/;
const PATROL =
  /^(?:(?:helm|xo|number one|first officer|commander|marrow|ensign|adeyemi)[,:]?\s+)?(?:(?:ok(?:ay)?|right|alright|all right)[,.]?\s+)?(?:let'?s\s+)?(?:continue|resume|carry on(?: with)?|proceed with|begin|start|go on with|get back to|return to|back to|keep up)\s+(?:the\s+|our\s+)?patrol\b|^(?:let'?s\s+)?patrol the (?:sector|area|border|reach|region)\b|\b(?:wait|hold (?:station|position)|stand by|keep station|hold here)\b.*?\b(\d+|an?|one|two|three|four|five|six|eight|ten|twelve|several|a few|a couple of) hours?\b|\blet (?:some )?time pass\b|\blet (?:a few|some|several|a couple of|\d+|two|three|four|six) hours (?:go by|pass|roll by|tick by)\b|\bpass the time\b|\b(?:keep|continue|carry on|resume|go on) patrolling\b|\bkeep (?:on |up )?(?:the |our )?patrol\b|^(?:carry on|as you were|steady as she goes)$/;
const NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, eight: 8, ten: 10, twelve: 12, several: 4, 'a few': 3, 'a couple of': 2 };
const COURSE =
  /^(?:(?:helm|ensign|adeyemi|mr\.? adeyemi|navigation|nav)[,:]?\s+)?(?:please\s+)?(?:(?:set|lay in|plot)(?: (?:a|our|the))? course (?:for|to)|take us(?: back)? to|head (?:back )?(?:for|to)|make for|go (?:back )?to|let'?s (?:go to|investigate|visit|check out|head to)|investigate|visit|move us to|return to|jump to|bring us (?:to|back to)|engage(?: a)? course (?:for|to))\s+(.+)$/;
const ACCEPT =
  /\b(?:accept(?:ed)?|we'?ll take it|take (?:the|that|this) (?:assignment|mission|job)|(?:we'?re |we are )?on our way|set (?:a )?course to assist|(?:respond|responding|answer|answering) (?:to )?(?:the|that|their|this) (?:call|distress(?: call)?|signal|mayday|hail)|let'?s help|we'?ll help|go to their aid|we'?ll do it|count us in|we'?ll go|affirmative|acknowledged|understood|we are responding|we'?re responding|help them|tell them we'?re coming|yes)\b/;
const DECLINE = /\b(?:can'?t make it|(?:we'?re|we are) (?:sorry|unable)|unable to (?:help|go|assist|take)|decline|pass on (?:it|this|that)|not this time|turn (?:it|them|that) down|we can'?t (?:help|take it|go|spare)|no,? thank you|no thanks|tell them no|say no|we'?ll pass)\b/;
const IGNORE = /\b(?:ignore (?:it|them|that|the call|the signal|the hail)?|log it and (?:continue|carry on|move on)|no response|don'?t (?:answer|respond|reply)|let it go|disregard)\b/;
const QUESTION = /\b(?:request (?:more )?(?:details|clarification|information|confirmation)|(?:question|query|challenge) (?:the|that|this) (?:order|directive)|ask (?:them|fleet|fleet command|(?:the )?isa(?: fleet)?(?: command)?|the agency|the admiral|her|him) (?:for|to) (?:more )?(?:details|clarif\w+|explain|confirm)|more (?:details|information)|what (?:are|were) the details|tell me more)\b/;
const REFUSE = /\b(?:refuse|we will not comply|we won'?t (?:comply|do it|go|obey)|i won'?t do (?:it|that)|we'?re not going)\b/;

/** "Tell Fleet we're on it", "Inform the colony office that…", "Ask the admiral why…": answering through comms. */
const RELAY_LEAD = /^(?:(?:comms|communications|szabo|lieutenant)[,:]?\s+)?(?:please\s+)?(tell|inform|advise|signal|message|notify|reply to|answer|thank|ask)\s+(?:fleet(?: command)?|(?:the )?isa(?: fleet)?(?: command)?|the agency|the admiral|admiral kaine|kaine|them|her|him|the colony(?: office)?|the (?:survey|colony) office|hollin|the hauler|the caller)\b(?:\s+(?:that|but))?[,:]?\s*/;
const ACCEPT_MORE = /\b(?:acknowledge(?: (?:the|that|it|this)(?: directive| order| call)?)?|(?:is|are|we'?re) responding|(?:going to|gonna|we'?ll|we will) (?:help|assist|rescue|aid)|help (?:that|the|those) (?:hauler|ship|freighter|crew|people|tender)|(?:we'?re|we are) on it|on it|message received|intercept|go get them|get them out|sure|we can (?:escort|help|do (?:it|that)|take (?:it|that))|will do|right away|make it so|we'?ll be there|go now)\b/;
const REFUSE_MORE = /\bwe(?:'ll| will)? stay (?:here|put|on station)\b|\b(?:(?:will|won'?t) not be going|won'?t be going|not be going|forbids?|we decline to comply)\b/;
const IGNORE_MORE = /\bleave it\b|\b(?:someone|somebody) (?:else|closer) (?:will|can)\b|\blet someone else\b|\b(?:pretend we (?:didn'?t|did not) (?:hear|get) (?:it|that|them)|say nothing|we never got (?:it|that))\b/;

function respondOf(t0: string): string | null {
  const lead = RELAY_LEAD.exec(t0);
  const t = lead ? t0.slice(lead[0].length) : t0;
  // "Ask the admiral why it has to be us": a question to the caller.
  if (lead?.[1] === 'ask' && /^(?:why|what|how|whether|if|for|to (?:explain|clarify|confirm))\b/.test(t)) return 'question';
  if (/^why\b|\bwhy (?:us|the halcyon|does|do|is|has|would|should)\b|\b(?:i|we) (?:want|would like|'d like) to know\b/.test(t)) return 'question';
  if (REFUSE_MORE.test(t)) return 'refuse';
  if (IGNORE_MORE.test(t)) return 'ignore';
  if (QUESTION.test(t)) return 'question';
  if (REFUSE.test(t)) return 'refuse';
  if (DECLINE.test(t)) return 'decline';
  if (IGNORE.test(t)) return 'ignore';
  if (ACCEPT.test(t) || ACCEPT_MORE.test(t)) return 'accept';
  // A bare "No." (after questions, declines and accepts had their chance: "No, tell me more" asks; "No problem, we'll go" accepts).
  if (/^no\b(?! problem| worries)/.test(t)) return 'refuse';
  return null;
}

type BridgeOp = { type: 'bridge'; op: 'openArchive' | 'beginSim' | 'endSim' | 'listSims' | 'survey' | 'acceptCommission' | 'civs' | 'course' | 'patrol' | 'respond' | 'rename' | 'fleet' | 'career'; scenario?: string; hours?: number; text?: string };

/**
 * v0.7: renaming. The captain's own name is the only customizable name (Service Record →
 * Personnel). Ships, crew, NPCs, planets, factions and ISA departments keep their names: such
 * requests are recognised so the crew can decline politely instead of misreading them as orders.
 */
const CREW_WORDS = "helm|helmsman|tactical|sensors|science|comms|communications|engineering|ops|number one|the xo|xo|commander|lieutenant|ensign|chief|doctor|doc|marrow|rask|varga|szabo|okafor|adeyemi|osei|the computer|computer|him|her|them|the doctor|the chief|my first officer|the prefect|the warden|the admiral|admiral kaine";
const RENAME_SHIP = /\b(?:rename|re-name|renaming)\b.*\b(?:ship|halcyon|vessel|isv)\b|\b(?:change|changing) (?:the |our )?(?:ship'?s?|halcyon'?s?|vessel'?s?) name\b|\bname (?:the|our|this) (?:ship|vessel)\b|\bcall (?:the|our|this) (?:ship|vessel)\b|\b(?:ship|halcyon) (?:is|will be) (?:now )?(?:called|named)\b/;
const RENAME_SELF = /^(?:computer,? |everyone,? |number one,? )?(?:call me (?!when|if|back|once|on|up|in|at|after|before|later)[a-z'’.-]+|my name is\b|change my name\b|rename me\b|i(?:'m| am) (?:now )?called\b)/;
const RENAME_CREW = new RegExp(`\\b(?:rename|re-name|renaming)\\b|\\bcall (?:${CREW_WORDS}) (?!to\\b|back\\b|up\\b|on\\b|in\\b|off\\b|for\\b|over\\b|when\\b|if\\b)[a-z'’-]+(?: [a-z'’-]+)?$|\\bchange (?:his|her|their|your|the [a-z]+'?s|${CREW_WORDS.split('|').filter((w) => !w.includes(' ')).map((w) => `${w}'?s`).join('|')}) name\\b|\\byour name is (?:now )?\\b|\\bfrom now on (?:you(?:'re| are)|(?:he|she|they)(?:'s| is| are)) (?:called|named)\\b|\\bname (?:the )?(?:planet|system|station|colony|star|nebula|moon)\\b`);

export function renameRequest(raw: string): 'ship' | 'self' | 'crew' | null {
  const t = raw.trim().toLowerCase().replace(/[?!.]+$/, '').replace(/\s+/g, ' ');
  if (RENAME_SHIP.test(t)) return 'ship';
  if (RENAME_SELF.test(t)) return 'self';
  if (RENAME_CREW.test(t)) return 'crew';
  return null;
}

function bridgeCommand(input: string, ctx?: InterpreterContext): BridgeOp | null {
  const t = input.trim().toLowerCase().replace(/[?!.]+$/, '').replace(/\s+/g, ' ');
  const duty = ctx?.duty;
  const rename = renameRequest(t);
  if (rename) return { type: 'bridge', op: 'rename', scenario: rename };
  if (duty && !ctx?.channel) {
    // Answering the call waiting on the bridge (a hail, a distress call, a request).
    if (duty.incoming && !PATROL.test(t)) {
      const r = respondOf(t);
      if (r) {
        // A refusal can carry a reason Fleet's review will weigh.
        const why = /\b(unfit|not fit|damage[ds]?|repairs?|hull)\b/.test(t) ? 'unfit' : /\b(accords?|treaty|illegal|unlawful|law)\b/.test(t) ? 'accords' : /\b(already (?:responding|committed)|another rescue|rescue under way)\b/.test(t) ? 'prior-rescue' : '';
        return { type: 'bridge', op: 'respond', scenario: why ? `${r}:${why}` : r, text: input.slice(0, 300) };
      }
    }
    const p = PATROL.exec(t);
    if (p) return { type: 'bridge', op: 'patrol', hours: Math.min(24, Math.max(1, p[1] ? (NUM[p[1]] ?? Number(p[1])) || 6 : 6)) };
    const c = COURSE.exec(t);
    if (c && !/\b(kestrel|freighter|cruiser|warship|ashen|them|him|her|it)\b/.test(c[1])) return { type: 'bridge', op: 'course', scenario: c[1].replace(/\b(at (?:full|best) speed|immediately|now|please)\b/g, '').trim().slice(0, 80) };
  }
  // v0.7.1: ISA Fleet Command / Training Command as a comms party (never a ship), and the
  // captain's questions about their own training. Both work in every setting.
  const fleet = fleetAddress(t);
  if (fleet) {
    const topic = careerQuestion(fleet.rest);
    return { type: 'bridge', op: 'fleet', scenario: fleet.to, ...(topic ? { text: topic } : {}) };
  }
  const career = careerQuestion(t);
  if (career) return { type: 'bridge', op: 'career', scenario: career };
  if (CIVS.test(t) && !/\b(hail|fire|lock|approach)\b/.test(t)) return { type: 'bridge', op: 'civs' };
  if (END_SIM.test(t)) return { type: 'bridge', op: 'endSim' };
  if (LIST_SIMS.test(t)) return { type: 'bridge', op: 'listSims' };
  const b = BEGIN_SIM.exec(t);
  if (b) {
    const name = (b[4] ?? b[3] ?? b[2] ?? b[1] ?? '').replace(/\b(the|a|new|another)\b/g, '').trim();
    return { type: 'bridge', op: 'beginSim', ...(name ? { scenario: name } : {}) };
  }
  if (OPEN_ARCHIVE.test(t)) return { type: 'bridge', op: 'openArchive' };
  if (/^(?:(?:computer|comms|communications|szabo)[,:]?\s+)?(?:tell (?:fleet(?: command)?|(?:the )?isa(?: fleet)?(?: command)?|the admiral|them|her) (?:that )?)?(?:i |we )?(?:hereby |gladly |humbly )?accept(?:s|ed)? (?:the |my |your |this |our )?commission\b|^i accept\b.*\bcommission\b/.test(t)) return { type: 'bridge', op: 'acceptCommission' };
  if (SURVEY.test(t) && !/\b(scan|hail|fire|lock|approach)\b/.test(t)) return { type: 'bridge', op: 'survey' };
  return null;
}

const CHAT_VOC = /^(computer|number one|first officer|xo|helm|helmsman|tactical|sensors|science|comms|communications|engineering|chief( okafor)?|okafor|commander( marrow)?|marrow|varga|szabo|adeyemi|ensign|rask|doctor|doc|osei|lieutenant)\s*[,:]\s*(.+)$/;

function crewChatOf(input: string): { type: 'bridge'; op: 'chat'; officer: string; text: string } | null {
  const m = CHAT_VOC.exec(input.trim().toLowerCase());
  if (!m || m[1] === 'computer') return null;
  return { type: 'bridge', op: 'chat', officer: m[1], text: m[m.length - 1].slice(0, 300) };
}

const WHY_EXPLICIT =
  /^(?:([a-z.]+(?: [a-z.]+)?)\s*[,:]\s*)?(?:why (?:did|would|do|won'?t|wouldn'?t|didn'?t) (you|he|she|they|[a-z.]+(?: [a-z.]+)?) (?:refuse|decline|say no|not (?:fire|shoot|do it|comply|obey))\b.*|why (?:the|that) refusal\b.*|explain (?:your|the|that|his|her) refusal\b.*|why (?:won'?t|wouldn'?t|didn'?t) (?:you|he|she) (?:fire|shoot|comply|obey)\b.*)$/;
const WHY_BARE = /^(?:([a-z.]+(?: [a-z.]+)?)\s*[,:]\s*)?(?:why|why not|why's that|why is that|on what grounds|explain yourself)$/;

function whyQuery(input: string, ctx: InterpreterContext): { type: 'query'; topic: 'why'; officer?: string } | null {
  const t = input.trim().toLowerCase().replace(/[?!.]+$/, '').trim();
  const e = WHY_EXPLICIT.exec(t);
  if (e) {
    const who = e[1] ?? (e[2] && !/^(you|he|she|they)$/.test(e[2]) ? e[2] : undefined);
    return { type: 'query', topic: 'why', ...(who ? { officer: who } : {}) };
  }
  const b = WHY_BARE.exec(t);
  if (b && (ctx.recentRefusal || !ctx.channel || b[1])) {
    // "Prefect, why?" is for the channel, not the crew.
    if (b[1] && /\b(prefect|vane|captain|arden|hollis|sorel)\b/.test(b[1])) return null;
    return { type: 'query', topic: 'why', ...(b[1] ? { officer: b[1] } : {}) };
  }
  return null;
}

/** The crew-order interpreter (v0.4 behaviour): structured sentences, then the clause parser. */
function ordersSync(input: string, ctx: InterpreterContext): Interpretation {
  const source = 'offline-parser';
  const text = normaliseMarked(input);
  const sentences = text.split(/(?<!\b(?:dr|doc|lt|cmdr|capt|mr|mrs|ms))\s*[.;]+\s*/i).map((x) => x.trim()).filter(Boolean);
  const structured = (x: string) => {
    const b = x.replace(DEPT_MARK, ' ').trim();
    return PERSIST.test(b) || NOT_UNTIL.test(b) || COND_LEAD.test(b) || UNLESS.test(b) || /^then\s/.test(b) || THEN.test(b) || (COND_TAIL.test(b) && !!parseTrigger(COND_TAIL.exec(b)![3], null));
  };
  if (!sentences.some(structured)) return interpretCore(input, ctx);

  // Plain sentences keep being parsed together (cross-sentence references, reported speech).
  const groups: { text: string; structured: boolean }[] = [];
  for (const x of sentences) {
    const st = structured(x);
    const last = groups[groups.length - 1];
    if (last && !st && !last.structured) last.text = `${last.text}. ${x}`;
    else groups.push({ text: x, structured: st });
  }
  const all: Piece = { actions: [], unparsed: [], notes: [], clarify: null };
  let contact: Contact | null = (ctx.lastTarget as Contact | null) ?? null;
  let helmPending = false;
  for (const g of groups) {
    const p = g.structured ? sentencePiece(g.text, ctx, { contact, helmPending }) : piece(interpretCore(unmark(g.text), { ...ctx, lastTarget: contact ?? ctx.lastTarget }));
    all.actions.push(...p.actions);
    all.unparsed.push(...p.unparsed);
    all.notes.push(...p.notes);
    all.clarify = all.clarify ?? p.clarify;
    contact = lastContactOf(p.actions, contact);
    if (p.actions.some((a) => a.type === 'maneuver')) helmPending = true;
  }
  return finish(all, input, source);
}

/** Plan-level safety and schema validation for a combined interpretation. */
function finish(all: Piece, input: string, source: 'offline-parser'): Interpretation {
  const seen = new Set<string>();
  const actions = all.actions.filter((a) => {
    if (a.type !== 'posture') return true;
    const k = JSON.stringify(a);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const result: Interpretation = all.clarify
    ? { kind: 'clarify', clarification: all.clarify, actions: actions as never, unparsed: all.unparsed, notes: all.notes, source }
    : actions.length
      ? { kind: 'actions', actions: actions.slice(0, 8) as never, unparsed: all.unparsed, notes: all.notes, source }
      : { kind: 'unrecognised', unparsed: all.unparsed.length ? all.unparsed : [input.trim()], notes: all.notes, source };
  return safe(result, input);
}

/** Validate against the schema, and refuse contradictory plans (ask instead). */
function safe(result: Interpretation, input: string): Interpretation {
  const source = 'offline-parser';
  const checked = InterpretationSchema.safeParse(result);
  if (!checked.success) return { kind: 'unrecognised', unparsed: [input.trim()], notes: [], source };
  const r = checked.data;
  if (r.kind === 'unrecognised') return r;
  const q = planConflict(r.actions);
  if (q) return { kind: 'clarify', clarification: { question: q, options: [], clause: input.trim() }, actions: [], unparsed: r.unparsed, notes: r.notes, source };
  return r;
}

/** v0.6: switch to the scenario's names for the contact slots (no-op for the Kestrel, which declares none). */
function applyScenarioVocabulary(ctx: InterpreterContext): void {
  setVocabulary(ctx.names ? { kestrel: ctx.names.kestrel, cruiser: ctx.names.cruiser, repair: ctx.contactRepairWords ?? [] } : undefined);
  const own = !ctx.setting || ctx.setting.scenarioId === KESTREL_SCENARIO_ID;
  KESTREL = withAliases(own ? KESTREL_BASE : KESTREL_GENERIC, 'kestrel');
  CRUISER = withAliases(own ? CRUISER_BASE : CRUISER_GENERIC, 'cruiser');
  VISIBLE = ctx.setting ? ctx.visible : null;
  const labels = ctx.labels ?? BASE_LABELS;
  OPTIONS_CONTACTS = [labels.kestrel, labels.cruiser];
  REF_LABEL = { ...labels, border: 'the border' };
  if (ctx.names) protectWords([...ctx.names.kestrel, ...ctx.names.cruiser].flatMap((w) => w.split(/\s+/)).filter((w) => w.length > 2));
}

// ------------------------------------------------------------- spelling ---

let protectedNames = new Set<string>(['arden', 'vane', 'venn', 'maras', 'ivet', 'lysa', 'teo', 'szabo', 'varga', 'rask', 'okafor', 'adeyemi', 'marrow', 'osei', 'halcyon', 'tessarine', 'calloway']);
let spell: SpellCorrector | null = null;
function SPELL(): SpellCorrector {
  if (!spell) {
    const sources: (RegExp | string)[] = [KESTREL_BASE, CRUISER_BASE, PASSENGER, BORDER, PAIR, COMPARTMENT, SPEECH, ON_SCREEN, ALL_TARGETS, SPEED_SLOW, SPEED_HALF, NEGATED_HOSTILITY, PEACEFUL, ASSERTIVE, ADDRESSEES, ...SYSTEMS.map((x) => x[1]), ...RULES.map((r) => r.test), LEDGER_NAMES, LANTERN_NAMES, PICKET_NAMES, GARDENER_NAMES, 'shields weapons transporter tractor channel freighter cruiser kestrel position between hostile hail aggressive threatening'];
    spell = new SpellCorrector(vocabularyFrom(sources));
  }
  return spell;
}
/** Exposed for tests: protect extra proper nouns from correction. */
export function protectWords(words: string[]): void {
  protectedNames = new Set([...protectedNames, ...words]);
}

export class OfflineInterpreter implements Interpreter {
  readonly id = 'offline';
  readonly label = 'Offline interpreter';
  interpret(text: string, ctx: InterpreterContext): Promise<Interpretation> {
    return Promise.resolve(interpretSync(text, ctx));
  }
}
