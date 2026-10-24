/** Scenario-specific meaning of scans, one-shot comm actions, improvised tactics, queries and officers' bridge talk for The Saltglass Accord. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows, patchShip, revealFact, setFlag } from '../../engine/state';
import type { Clan } from './setup';
import { CLANS, CLAN_NAME, DELEGATE_SHORT, INTEREST_SHORT, PARTY, SHIP_NAME, saltglass } from './setup';
import { bothTabled, confided, elderAlive, elderTurn, hasLeave, interestOf, isHard, landing, onTheIce, settled, sendMarrow, standstill, startIceTrip, tabled, treatElder, trustOf, vars, walking } from './agents';
import { delegateRespond } from './dialogue';

const ICE = /\b(surface|down to (the )?(ice|moon|saltglass)|on the ice|to the ice|walk (the|on the) ice|shuttle|land\w* (with|together)|take (them|the delegates|both|the delegations) (down|to)|go down|see (it|the moon|saltglass) for themselves|show them)\b/;

// ------------------------------------------------------------------ scan ---

/** Varga's survey of Saltglass: where the springs, the barrows and the seat actually lie. */
export function survey(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'survey')) {
    r.push(say('sensors', 'surveyAgain'));
    return s;
  }
  s = revealFact(s, 'survey');
  s = setFlag(s, 'surveyed');
  r.push(say('sensors', 'surveyDone'));
  return s;
}

function scanClan(s: WorldState, c: Clan, r: Report[]): WorldState {
  const id = PARTY[c];
  if (s.ships[id].destroyed) {
    r.push(say('sensors', 'clanShipGone', vars(s, c)));
    return s;
  }
  s = patchShip(s, id, { scanLevel: 2 });
  const elderHere = saltglass(s).elderClan === c && elderAlive(s);
  if (elderHere) s = revealFact(s, 'elder_ill');
  r.push(say('sensors', 'scanClanShip', { ...vars(s, c), elderHere: elderHere ? 1 : 0, landing: landing(s) > 0 && isHard(s, c) ? 1 : 0 }));
  return s;
}

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'kestrel':
    case 'compartment':
      s = scanClan(s, 'rhune', r);
      break;
    case 'cruiser':
      s = scanClan(s, 'tarvo', r);
      break;
    case 'area':
      s = survey(s, r);
      break;
    case 'halcyon':
      r.push(say('sensors', 'scanOwnShip'));
      break;
  }
  return { state: s, reports: r };
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;
const SPEAK_FROM: Record<Comm['intent'], { intent: string; text: string }> = {
  open: { intent: 'greet', text: '' },
  ask: { intent: 'ask', text: '' },
  humanitarian: { intent: 'appeal', text: '' },
  legal: { intent: 'legal', text: '' },
  reassure: { intent: 'declarePeaceful', text: '' },
  warn: { intent: 'warn', text: 'or else' },
  bluff: { intent: 'bluff', text: 'or else' },
  trade: { intent: 'trade', text: 'what would it take' },
  appeal: { intent: 'appeal', text: '' },
  offerAsylum: { intent: 'offerAsylum', text: '' },
};

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const m = SPEAK_FROM[a.intent];
  const line = { type: 'speak' as const, to: a.target === 'cruiser' ? ('cruiser' as const) : ('kestrel' as const), text: m.text, intents: [m.intent] as never, topic: undefined, relayed: false };
  return delegateRespond(s, line, rng);
}

// ------------------------------------------------------------ improvise ---

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.method === 'other' && ICE.test(a.description.toLowerCase())) s = startIceTrip(s, r);
  else if (a.method === 'other') r.push(say('xo', 'impOtherSaltglass', { description: a.description.slice(0, 80) }));
  else r.push(say('xo', 'impNotAtTable'));
  return { state: s, reports: r };
}

// ------------------------------------------------------- officers on the bridge ---

const SCIENCE = /\b(varga|oona|sensors?|science|hale)\b/;
const DOCTOR = /\b(osei|ama|doctor|doc|medical|ruiz|nurse)\b/;
const XO = /\b(marrow|xo|number one|first officer|commander|holt)\b/;
const COMMS = /\b(szabo|mirela|comms|communications)\b/;
const RHUNE = /\b(rhune|rhunes|speaker|edda|long thaw)\b/;
const TARVO = /\b(tarvo|tarvos|holder|caius|cold hearth)\b/;
const ASKLEAVE = /\b(leave|permission|raise it|share it|say it|tell (them|the others)|put it on the table|at the table)\b/;
const TALK = /\b(talk|word|speak|find out|sound (him|her|them) out|go|see|ask|corridor|privately|quiet\w*|what (do|does) (they|he|she) (really )?(want|need)|bring (him|her|them) back|after (him|her|them))\b/;

function whoOf(t: string): 1 | 2 | 3 | 0 {
  const a = RHUNE.test(t);
  const b = TARVO.test(t);
  if (/\b(both|each|the delegates|the delegations|everyone)\b/.test(t) || (a && b)) return 3;
  return a ? 1 : b ? 2 : 0;
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const who = (action.officer ?? '').toLowerCase();
  const t = (action.text ?? '').toLowerCase();
  const r: Report[] = [];
  if (XO.test(who)) {
    if (settled(s)) return { state: s, reports: [say('xo', 'marrowAfter')] };
    if (ICE.test(t)) return { state: startIceTrip(s, r), reports: r };
    const target = whoOf(t);
    const walker = CLANS.find((c) => walking(s, c));
    if (target || (walker && /\b(bring|back|after|stop)\b/.test(t))) {
      const w = target || (walker === 'rhune' ? 1 : 2);
      return { state: sendMarrow(s, w as 1 | 2 | 3, ASKLEAVE.test(t), r), reports: r };
    }
    if (TALK.test(t) && /\b(them|delegates?|delegations?)\b/.test(t)) return { state: sendMarrow(s, 3, ASKLEAVE.test(t), r), reports: r };
    return { state: s, reports: [marrowRead(s)] };
  }
  if (COMMS.test(who)) {
    s = revealFact(s, 'hardliner');
    s = setFlag(s, 'askedSzabo');
    return { state: s, reports: [say('comms', 'szaboRead', { hard: CLAN_NAME[saltglass(s).hard], hardShort: DELEGATE_SHORT[saltglass(s).hard], soft: DELEGATE_SHORT[CLANS.find((c) => !isHard(s, c)) ?? 'rhune'] })] };
  }
  if (SCIENCE.test(who)) {
    if (RHUNE.test(t) && !TARVO.test(t)) return scan(s, 'kestrel');
    if (TARVO.test(t) && !RHUNE.test(t)) return scan(s, 'cruiser');
    if (/\b(survey|map|moon|saltglass|ice|surface|scan|chart|springs?|barrow\w*|seat|ridge|where)\b/.test(t)) return { state: survey(s, r), reports: r };
    if (/\b(landing|hauler|lander)\b/.test(t)) return { state: s, reports: [say('sensors', landing(s) > 0 ? 'landingWatch' : 'noLanding', { ...vars(s, saltglass(s).hard), left: Math.max(0, 4 - landing(s)) })] };
    return { state: s, reports: [] };
  }
  if (DOCTOR.test(who)) {
    const e = saltglass(s).elderClan;
    if (!e || !knows(s, 'elder_ill')) return { state: s, reports: [say('medical', 'oseiNoPatient')] };
    if (!elderAlive(s)) return { state: s, reports: [say('medical', 'oseiElderGone', vars(s, e))] };
    if (s.flags.elderConsent) return { state: treatElder(s, r), reports: r };
    return { state: setFlag(s, 'askedOsei'), reports: [say('medical', 'oseiNeedsLeave', { ...vars(s, e), left: Math.max(0, elderTurn(s) - s.turn) })] };
  }
  return { state: s, reports: [] };
}

function marrowRead(s: WorldState): Report {
  const unknown = CLANS.filter((c) => !tabled(s, c) && !confided(s, c));
  return say('xo', 'marrowRead', {
    tabled: CLANS.filter((c) => tabled(s, c)).length,
    unknown: unknown.length,
    confided: CLANS.some((c) => confided(s, c) && !tabled(s, c)) ? 1 : 0,
    leave: CLANS.some((c) => confided(s, c) && !tabled(s, c) && !hasLeave(s, c)) ? 0 : 1,
    landing: landing(s) > 0 ? 1 : 0,
    options: suggestOptions(s).join('; '),
  });
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || settled(s)) return out;
  if (onTheIce(s)) return ['wait'];
  const v = saltglass(s);
  const walker = CLANS.find((c) => walking(s, c));
  if (walker) out.push(`Marrow, bring ${DELEGATE_SHORT[walker]} back`);
  if (landing(s) > 0) out.push(`ask ${DELEGATE_SHORT[v.hard]} to call the hauler back`);
  if (!s.flags.askedStandstill && !CLANS.every((c) => standstill(s, c))) out.push('ask both clans for a standstill on the ice');
  for (const c of CLANS) {
    if (tabled(s, c) || walking(s, c)) continue;
    if (!confided(s, c)) out.push(`open a private channel to ${DELEGATE_SHORT[c]}`);
    else if (!hasLeave(s, c)) out.push(`Marrow, ask ${DELEGATE_SHORT[c]} if I may raise it at the table`);
  }
  if (!knows(s, 'survey')) out.push('Varga, survey the moon');
  if (!s.flags.walkedTheIce && !bothTabled(s)) out.push('take the delegates down to the ice');
  if (knows(s, 'elder_ill') && elderAlive(s) && !s.flags.oseiTreated) out.push('Doctor, can you help the elder?');
  if (bothTabled(s)) out.push('propose terms at the table');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  const v = saltglass(s);
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status': {
      const need = (c: Clan) => (tabled(s, c) ? `on the table: ${INTEREST_SHORT[interestOf(s, c)]}` : confided(s, c) ? `told us in private: ${INTEREST_SHORT[interestOf(s, c)]}${hasLeave(s, c) ? ' (with leave to raise it)' : ' (not to be repeated)'}` : 'not yet known');
      const mood = (c: Clan) => (walking(s, c) ? 'leaving the table' : trustOf(s, c) >= 50 ? 'warm' : trustOf(s, c) >= 35 ? 'listening' : trustOf(s, c) >= 20 ? 'guarded' : 'cold');
      return {
        state: s,
        reports: [
          say('xo', 'statusReportSaltglass', {
            rhune: `${mood('rhune')}; ${need('rhune')}`,
            tarvo: `${mood('tarvo')}; ${need('tarvo')}`,
            ice: landing(s) > 0 ? `${CLAN_NAME[v.hard]} hauler descending` : CLANS.every((c) => standstill(s, c)) ? 'standstill agreed' : 'quiet, for now',
            elder: !v.elderClan || !knows(s, 'elder_ill') ? 'no one reported ill' : elderAlive(s) ? `${s.characters.elder.name} failing${s.flags.oseiTreated ? '; Dr. Osei with them' : ''}` : `${s.characters.elder.name} has died`,
            marrow: onTheIce(s) ? 'on the ice with the delegates' : s.counters.marrowJob ? 'away from the table' : 'at the table',
          }),
        ],
      };
    }
    case 'systems':
      return { state: s, reports: [say('engineering', 'systemsQuiet')] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'contactsReport', { a: SHIP_NAME.rhune, b: SHIP_NAME.tarvo })] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
