/**
 * OfflineInterpreter — deterministic natural-language parser (no AI).
 *
 * Pipeline: normalise (politeness, filler, addressees, number words) →
 * split into clauses ("and", "then", commas; reported speech stays attached) →
 * classify each clause with ordered pattern rules → resolve targets
 * (explicit, pronoun → last target, inherited from neighbouring clauses,
 * sensible defaults) → ask a clarifying question when still ambiguous.
 * Output is validated against the ProposedAction zod schema.
 */
import type { Interpretation, ProposedActionInput, CommIntent, TradeOffer } from '../engine/schema';
import { InterpretationSchema } from '../engine/schema';
import type { Interpreter, InterpreterContext } from './types';
import { wordsToDigits } from './numbers';

type Contact = 'kestrel' | 'cruiser';
type TargetRef = Contact | 'passenger' | null;

// ------------------------------------------------------------ normalise ---

const ADDRESSEES = '(computer|number one|helm|tactical|sensors|science|comms|communications|ops|engineering|chief|chief okafor|okafor|commander|commander marrow|marrow|lieutenant|lieutenant varga|varga|lieutenant szabo|szabo|ensign|ensign adeyemi|adeyemi|mr\\.? \\w+|ms\\.? \\w+|mrs\\.? \\w+|rask|everyone|bridge|doctor|doc|osei)';

export function normalise(input: string): string {
  let t = ` ${input.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"')} `;
  t = wordsToDigits(t);
  t = t.replace(new RegExp(`(^|[.!?;]\\s*)${ADDRESSEES}\\s*[,:]`, 'g'), '$1 ');
  t = t.replace(new RegExp(`\\b(tell|ask|have|get|order|instruct)\\s+${ADDRESSEES}\\s+(to\\s+)?`, 'g'), ' ');
  const filler = [
    'please', 'kindly', 'could you', 'would you', 'can you', 'will you', "i'd like you to", 'i would like you to', 'i want you to', 'i need you to',
    'i want to', "i'd like to", "let's", 'let us', 'go ahead and', 'make it so', 'immediately', 'right away', 'right now', 'at once', 'asap', 'quickly',
    'as fast as you can', 'if you would', 'if you can', 'for me', 'ok', 'okay', 'alright', 'all right', 'um', 'uh', 'hmm', 'now', 'then please',
    'i think we should', 'we should', 'we need to', 'we must', 'try to', 'attempt to',
  ];
  for (const f of filler) t = t.replace(new RegExp(`(^|[\\s,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,.!?]|$)`, 'g'), '$1');
  t = t.replace(/\b(tell|give|show) me\b/g, 'report');
  t = t.replace(/[!?]+/g, '.').replace(/\s+/g, ' ').trim();
  return t.replace(/^[,.\s]+|[,.\s]+$/g, '');
}

// --------------------------------------------------------------- lexicon ---

const KESTREL = /\b(kestrel|freighter|civilian( ship| vessel)?|disabled (ship|vessel)|derelict|arden|stricken (ship|vessel)|distressed (ship|vessel))\b/;
const CRUISER = /\b(cruiser|warship|war ship|directorate|tessarine|ashen|covenant|vane|prefect|enemy|hostile|attacker|second contact|other ship|that ship)\b/;
const PASSENGER = /\b(passenger|defector|stowaway|fugitive|stasis|pod|refugee|prisoner|scientist|journalist)\b/;
const PRONOUN = /\b(them|they|their|her|she|it|its|him|he)\b/;
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
  const m = /(\d+(?:\.\d+)?)\s*(km|kilomet(?:er|re)s?|klicks?|kay)?\b/.exec(c);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!m[2] && n < 100) n *= 1000; // "take us to 5" → 5,000 km
  return Math.round(n);
}

// ------------------------------------------------------------ intents ---

type Draft =
  | { kind: 'action'; action: ProposedActionInput; needs?: 'contact' | 'commTarget' | 'system'; question?: string }
  | { kind: 'none' };

interface Rule {
  name: string;
  test: RegExp;
  build: (c: string, ctx: InterpreterContext) => Draft;
}

const SPEECH = /\b(hail|contact|call|signal|open (a )?(channel|comms|frequency|hailing frequencies|line)|on screen|tell|inform|say|explain|warn|threaten|assure|reassure|ask|request|demand|offer|propose|trade|exchange|negotiate|bluff|lie to|plead|appeal|respond|reply|talk|speak|answer|broadcast|transmit|message|remind|convince|persuade|hand over|grant|promise)\b/;

function commIntent(c: string): { intent: CommIntent; offer?: TradeOffer; topic?: 'cargo' | 'passenger' | 'intentions' | 'crew' | 'general' } {
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
  if (/\b(warn|threat|threaten|back off|stand down|leave|withdraw|retreat|or (else|we will|we'll)|will fire|open fire|destroy you|last warning|turn back|go away|get out|stay away|keep away|don't come)\b/.test(c)) return { intent: 'warn' };
  if (/\b(humanitarian|rescue|mercy|lives|civilians?|dying|help|save|injured|evacuat\w*|crew|people)\b/.test(c)) return { intent: 'humanitarian' };
  if (/\b(no harm|peaceful|not (a threat|hostile|here to fight)|no hostile|friendly|calm down|mean no|our intentions|stand easy|apologi[sz]e|sorry)\b/.test(c)) return { intent: 'reassure' };
  if (/\b(ask|what|why|who|where|how|intentions?|want|explain yourself|identify|cargo|compartment|hold)\b/.test(c)) {
    const topic = /\b(cargo|hold|compartment|hauling|carrying)\b/.test(c) ? 'cargo' : PASSENGER.test(c) ? 'passenger' : /\b(intentions?|want|why|purpose)\b/.test(c) ? 'intentions' : /\bcrew\b/.test(c) ? 'crew' : 'general';
    return { intent: 'ask', topic };
  }
  return { intent: 'open' };
}

const RULES: Rule[] = [
  {
    name: 'help',
    test: /^(help|commands|what (orders|commands) can i give|how do i play)\b/,
    build: () => ({ kind: 'action', action: { type: 'query', topic: 'help' } }),
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
    name: 'holdFire',
    test: /\b(hold|cease|stop|don't|do not|never) (your )?(fire|firing|shooting)\b|\bcease ?fire\b/,
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
      const ci = commIntent(c);
      return { kind: 'action', action: { type: 'communicate', target: 'cruiser', ...ci }, needs: 'commTarget' };
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
      if (/\b(power|boost|reinforce|divert|reroute|transfer|strengthen)\b/.test(c)) return { kind: 'none' };
      if (/\b(lower|drop|down|disable|deactivate|off|power down|cut|kill)\b/.test(c)) return { kind: 'action', action: { type: 'shields', raise: false } };
      if (/\b(raise|up|activate|engage|enable|restore|bring|on)\b/.test(c)) return { kind: 'action', action: { type: 'shields', raise: true } };
      return { kind: 'none' };
    },
  },
  {
    name: 'power',
    test: /\bpower\b|\b(boost|reinforce|strengthen|overcharge|supercharge)\b/,
    build: (c) => {
      if (/\bpower (down|off|up)\b/.test(c)) return { kind: 'none' };
      const sys = systemsIn(c);
      const pct = /(\d+)\s*(%|percent)/.exec(c);
      const amount = pct ? Math.min(150, Math.max(5, parseInt(pct[1], 10))) : /\b(all|full|maximum|max|every|emergency)\b/.test(c) ? 50 : 25;
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
    test: /\b(safe|disarm|power down|stand down|secure|lower|deactivate|holster)\b.*\b(weapons?|beams|torpedoes|guns)\b|\bweapons (safe|cold|down|offline)\b/,
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
    build: () => ({ kind: 'action', action: { type: 'repair', ship: 'kestrel', system: 'reactor' } }),
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
      if (/\b(their|kestrel|freighter|containment)\b/.test(c) || (/\breactor\b/.test(c) && !/\bour\b/.test(c))) return { kind: 'action', action: { type: 'repair', ship: 'kestrel', system: 'reactor' } };
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
    name: 'withdraw',
    test: /\b(withdraw|retreat|leave|get (us )?out( of here)?|fall back|disengage|bug out|run for it|flee|exit the reach|head home|go home|break off|abandon)\b/,
    build: () => ({ kind: 'action', action: { type: 'jump', mode: 'withdraw' } }),
  },
  {
    name: 'interpose',
    test: /\b(between|interpose|in the way|in harm's way|block (their|the|her) (line of fire|shot|path)|put us in front|shield (the kestrel|her|them) with (our|the) (ship|hull))\b/,
    build: () => ({ kind: 'action', action: { type: 'move', mode: 'interpose' } }),
  },
  {
    name: 'evasive',
    test: /\b(evasive|evade|dodge|jink|zig\w*)\b/,
    build: () => ({ kind: 'action', action: { type: 'move', mode: 'evasive' } }),
  },
  {
    name: 'hold',
    test: /\b(all stop|full stop|hold (our |this )?position|station[- ]keeping|stop (the ship|engines|here|moving)|halt|stay (here|put))\b/,
    build: () => ({ kind: 'action', action: { type: 'move', mode: 'hold' } }),
  },
  {
    name: 'away',
    test: /\b(back off|back away|pull back|open the range|increase (the )?(distance|range)|move away|get away from|keep (our|a) distance|distance ourselves)\b/,
    build: () => ({ kind: 'action', action: { type: 'move', mode: 'away', target: 'cruiser' }, needs: 'contact' }),
  },
  {
    name: 'moveRange',
    test: /\b(take|bring|move|close|hold|keep|go|head|set|maintain|approach|range|get|stay|position)\b.*(\d{3,}|\d+\s*(km|kilomet|klick))/,
    build: (c) => ({ kind: 'action', action: { type: 'move', mode: 'range', target: 'kestrel', rangeKm: numberKm(c) ?? 10000 }, needs: 'contact' }),
  },
  {
    name: 'approach',
    test: /\b(approach|close (in|on|with|the distance|to)|intercept|move (to|toward|towards|closer|in)|go (to|toward|towards)|head (to|for|toward|towards)|take us (in|to|closer|alongside)|bring us (in|alongside|closer|to)|set (a )?course|pull alongside|come alongside|alongside|get (us )?closer|get close|move us|full impulse|full speed|maximum speed|max speed|ahead full|flank speed|engage engines|rendezvous|make for|proceed to)\b/,
    build: () => ({ kind: 'action', action: { type: 'move', mode: 'approach', target: 'kestrel' }, needs: 'contact' }),
  },
  {
    name: 'scan',
    test: /\b(scan|sensors?|analy[sz]e|examine|investigate|study|probe|sweep|look at|check (out|on)?|inspect|identify|survey|readings?|life signs|what('s| is) (in|inside|on|aboard))\b/,
    build: (c) => {
      if (COMPARTMENT.test(c) && !/\b(our|my)\b/.test(c)) return { kind: 'action', action: { type: 'scan', target: 'compartment' } };
      if (/\b(sweep|long[- ]range|area|surroundings|the reach|around us|for (other|more) ships|horizon)\b/.test(c)) return { kind: 'action', action: { type: 'scan', target: 'area' } };
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

function matchRule(clause: string, ctx: InterpreterContext): { rule: Rule; draft: Draft } | null {
  for (const rule of RULES) {
    if (!rule.test.test(clause)) continue;
    const draft = rule.build(clause, ctx);
    if (draft.kind === 'none') continue;
    return { rule, draft };
  }
  return null;
}

// --------------------------------------------------------------- clauses ---

const REPORTED_SPEECH = /^(that|we|we're|we are|i|i'm|our|they|they're|it|it's|this|you|you're|he|she|there|the (kestrel|crew|passenger|accords|treaty|fleet|battle group))\b/;

export function splitClauses(text: string, ctx: InterpreterContext): string[] {
  const raw = text.split(/\s*(?:[,;.]+\s*(?:and\s+|then\s+)?|\s+and then\s+|\s+then\s+|\s+after that\s+|\s+and also\s+|\s+also\s+|\s+and\s+)\s*/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  let speech = false;
  for (const frag of raw) {
    const prev = out[out.length - 1];
    const m = matchRule(frag, ctx);
    const continuation = /^(use (it|her|them|that|the beam)|so (that|we|they|it)|to (cover|protect|shield|hide|block|mask))\b/.test(frag);
    if (prev !== undefined && (!m || continuation || (speech && REPORTED_SPEECH.test(frag) && m.rule.name !== 'communicate'))) {
      out[out.length - 1] = `${prev} and ${frag}`;
      continue;
    }
    out.push(frag);
    speech = !!m && m.rule.name === 'communicate';
  }
  return out;
}

// --------------------------------------------------------------- resolve ---

interface Parsed {
  clause: string;
  draft: Extract<Draft, { kind: 'action' }> | null;
  explicit: TargetRef;
  pronoun: boolean;
}

const OPTIONS_CONTACTS = ['the Kestrel', 'the cruiser'];

function resolveTargets(parsed: Parsed[], ctx: InterpreterContext): { actions: ProposedActionInput[]; clarify: { question: string; options: string[]; clause: string } | null } {
  const actions: ProposedActionInput[] = [];
  let clarify: { question: string; options: string[]; clause: string } | null = null;
  let carried: TargetRef = null;

  parsed.forEach((p, i) => {
    if (!p.draft) return;
    const d = p.draft;
    const a = { ...d.action } as Record<string, unknown>;
    let target: TargetRef = p.explicit;
    if (!target && p.pronoun) target = d.needs === 'commTarget' ? (ctx.lastCommTarget ?? ctx.lastTarget) : ctx.lastTarget;
    if (!target && d.needs) {
      target = carried;
      if (!target) for (let j = i + 1; j < parsed.length; j++) if (parsed[j].explicit) { target = parsed[j].explicit; break; }
    }
    if (p.explicit || (p.pronoun && target)) carried = target;

    if (d.needs === 'system') {
      clarify = clarify ?? { question: d.question ?? 'Which system, Captain?', options: ['shields', 'weapons', 'engines', 'sensors'], clause: p.clause };
      return;
    }
    if (d.needs === 'commTarget') {
      const intent = a.intent as CommIntent;
      if (target === 'passenger' && !ctx.passengerKnown) target = null;
      if (!target) {
        if (['bluff', 'warn', 'legal', 'trade', 'appeal'].includes(intent) && ctx.visible.includes('cruiser')) target = 'cruiser';
        else if (intent === 'offerAsylum' && ctx.passengerKnown && ctx.passengerAwake) target = 'passenger';
        else if (ctx.visible.length === 1) target = ctx.visible[0];
        else if (/\b(cargo|compartment|hold)\b/.test(p.clause) && ctx.visible.includes('kestrel')) target = 'kestrel';
      }
      if (!target) {
        clarify = clarify ?? { question: 'Open a channel to which vessel, Captain — the Kestrel or the cruiser?', options: OPTIONS_CONTACTS, clause: p.clause };
        return;
      }
      a.target = target;
      // "Offer the Kestrel" to the Kestrel herself makes no sense; offers go to the cruiser.
      if (intent === 'trade' && a.target === 'kestrel' && a.offer === 'kestrel') a.target = 'cruiser';
      // Offering the passenger is addressed to whoever wants them: the Prefect.
      if (intent === 'trade' && a.offer === 'passenger' && a.target === 'passenger') a.target = 'cruiser';
      carried = target;
      actions.push(a as ProposedActionInput);
      return;
    }
    if (d.needs === 'contact') {
      let contact: Contact | null = target === 'kestrel' || target === 'cruiser' ? target : null;
      if (target === 'passenger') contact = 'kestrel';
      const type = a.type as string;
      const mode = a.mode as string | undefined;
      if (!contact) {
        if (type === 'weapons' && ctx.visible.includes('cruiser')) contact = 'cruiser';
        else if (type === 'move' && mode === 'away' && ctx.visible.includes('cruiser')) contact = 'cruiser';
        else if (type === 'move' && mode === 'range' && ctx.visible.length === 1) contact = ctx.visible[0];
        else if (ctx.visible.length === 1) contact = ctx.visible[0];
      }
      if (!contact) {
        const verb = type === 'scan' ? 'Scan' : type === 'move' ? 'Which contact — approach' : 'Target';
        clarify = clarify ?? { question: `${verb} which contact, Captain — the Kestrel or the cruiser?`, options: OPTIONS_CONTACTS, clause: p.clause };
        return;
      }
      a.target = contact;
      carried = contact;
    }
    actions.push(a as ProposedActionInput);
  });
  return { actions, clarify };
}

export function interpretSync(input: string, ctx: InterpreterContext): Interpretation {
  const source = 'offline-parser';
  let text = normalise(input);
  if (!text) return { kind: 'unrecognised', unparsed: [input.trim()], source };

  // Answering a clarifying question? ("the cruiser", "shields", "Kestrel")
  if (ctx.pending && !matchRule(text, ctx)) text = `${ctx.pending.clause} ${text}`;

  const clauses = splitClauses(text, ctx);
  const parsed: Parsed[] = clauses.map((clause) => {
    const m = matchRule(clause, ctx);
    return {
      clause,
      draft: m && m.draft.kind === 'action' ? m.draft : null,
      explicit: explicitTarget(clause, ctx),
      pronoun: PRONOUN.test(clause) && !explicitTarget(clause, ctx),
    };
  });
  const unparsed = parsed.filter((p) => !p.draft).map((p) => p.clause);
  const { actions, clarify } = resolveTargets(parsed, ctx);
  void contactOf;

  const result: Interpretation = clarify
    ? { kind: 'clarify', clarification: clarify, actions: actions as never, unparsed, source }
    : actions.length
      ? { kind: 'actions', actions: actions as never, unparsed, source }
      : { kind: 'unrecognised', unparsed: unparsed.length ? unparsed : [input.trim()], source };
  // Validate (and apply schema defaults) — interpreters never bypass the schema.
  if (result.kind !== 'unrecognised' && result.actions.length > 6) result.actions = result.actions.slice(0, 6);
  const checked = InterpretationSchema.safeParse(result);
  if (!checked.success) return { kind: 'unrecognised', unparsed: [input.trim()], source };
  return checked.data;
}

export class OfflineInterpreter implements Interpreter {
  readonly id = 'offline';
  readonly label = 'Offline interpreter';
  interpret(text: string, ctx: InterpreterContext): Promise<Interpretation> {
    return Promise.resolve(interpretSync(text, ctx));
  }
}
