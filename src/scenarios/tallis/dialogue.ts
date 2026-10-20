/**
 * Offline, deterministic DialogueProvider for Quarantine at Tallis Gate.
 *
 * Replies depend on the classified intents AND the words of the line (evidence, the cure,
 * family), what the Halcyon actually knows (an argument is only evidence if the crew has
 * found it), and the character: Captain Sabeth wants a hospital and a reason to wait;
 * Warden-Commander Marr wants the colony safe, and how she is persuaded depends on her
 * seeded temperament (strict / fearful / humane) and on whether her brother is aboard.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { Party } from '../../engine/schema';
import type { CommsPromise, WorldState } from '../../engine/types';
import { bumpRepeat, closeChannel, promise, recordLine } from '../../engine/comms';
import { addTension, adjustTrust, knows, patchShip, revealFact, schedule, setFlag, setMemory } from '../../engine/state';
import { linerAlive, picketPresent, stopLiner } from './agents';
import { tallis } from './setup';

const EVIDENCE = /\b(not (a )?(disease|contagious|infectious|virus|viral|plague|fever|catching)|isn'?t (contagious|infectious|a disease|catching|viral|a virus)|poison\w*|toxi\w*|cadmium|recycler|water|allerg\w*|incense|resin|evidence|proof|data|scans?|results?|readings|analysis|diagnos\w*)\b/;
const DATA = /\b(data|scans?|results?|readings|analysis|evidence|proof|diagnos\w*|records?|medical report)\b/;
const CURE = /\b(antivirals?|vaccines?|serum|doses?|medicines?|stockpile|treatment|cure|drugs?)\b/;
const KIN = /\b(brother|teodric|family|sibling|kin)\b/;
const HOLD = /\b(hold|wait|stay|stand ?by|don'?t (run|cross|move|go)|stop|turn back|hold (your )?position|give (us|me) (time|a few)|be patient|heave to)\b/;
const ORIGIN = /\b(how did (it|this) start|first (cases?|sick|ones?)|when did|where (did|have) you|corvel|what happened|symptoms?|cause|started|sickness|illness|what'?s wrong)\b/;
const PEOPLE = /\b(manifest|passengers?|pilgrims|who('s| is) aboard|from tallis|tallis gate|relatives?|marr)\b/;
const TOW = /\b(tow|tractor|escort|hospital|agency space|take you|bring you|carry you|corran)\b/;
const LIFT = /\b(lift|let (them|her|the liner|the ship) (in|through|dock)|open the (gate|line)|allow (them|her) to dock|lower the line|end the quarantine)\b/;
const HOLD_FIRE = /\b(hold (your )?fire|don'?t (fire|shoot)|stand down|lower (your )?weapons|release (your )?(lock|weapons))\b/;

function say(s: WorldState, party: 'kestrel' | 'cruiser', key: string, vars: Record<string, string | number> = {}): { state: WorldState; report: Report } {
  return { state: recordLine(s, { from: party, intents: [], text: key }), report: comms(party === 'cruiser' ? 'marr' : 'sabeth', key, vars) };
}
function variant(s: WorldState, key: string, n: number): { state: WorldState; v: number } {
  const b = bumpRepeat(s, `say:${key}`);
  return { state: b.state, v: b.before % n };
}

// ------------------------------------------------------------------ Sabeth ---

export function sabethRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const I = new Set<string>(a.intents);
  const t = (a.text ?? '').toLowerCase();
  const v = tallis(s);
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = say(s, 'kestrel', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const done = (): Applied => ({ state: s, reports: r });
  if (!linerAlive(s) || s.characters.sabeth.status === 'dead') return { state: closeChannel(s, 'kestrel'), reports: [] };
  if (I.has('end')) {
    add('sabethEnd');
    return { state: closeChannel(s, 'kestrel'), reports: r };
  }
  const mem = () => s.characters.sabeth.memory;
  const runIn = () => Math.max(1, (mem().runAt ?? 0) - s.turn);
  if (!mem().hailed) {
    s = setMemory(s, 'sabeth', 'hailed', 1);
    s = revealFact(s, 'liner_status');
    s = adjustTrust(s, 'sabeth', 5);
    add('sabethFirst', { souls: s.ships.kestrel.souls, sick: s.counters.sick ?? 0, runIn: runIn() });
    return done();
  }
  if (a.promise) s = promise(s, 'kestrel', a.promise).state;
  if (KIN.test(t) || PEOPLE.test(t) || a.topic === 'passenger' || a.topic === 'crew') {
    if (v.kin && (KIN.test(t) || PEOPLE.test(t) || s.characters.sabeth.trust >= 30)) {
      s = revealFact(s, 'marr_kin');
      add('sabethKin');
    } else add('sabethNoKin', { souls: s.ships.kestrel.souls, sick: s.counters.sick ?? 0 });
    return done();
  }
  if (ORIGIN.test(t)) {
    s = revealFact(s, 'first_cases');
    s = revealFact(s, 'symptoms');
    add(`sabethFirstCases_${v.cause}`);
    return done();
  }
  if (TOW.test(t) || I.has('offerAsylum')) {
    s = setFlag(s, 'sabethAcceptsTow');
    s = adjustTrust(s, 'sabeth', 10);
    s = setMemory(s, 'sabeth', 'runAt', Math.max(mem().runAt ?? 0, s.turn + 4));
    add('sabethAcceptsTow');
    return done();
  }
  const holdAsked = HOLD.test(t) || a.demand === 'standBy' || a.demand === 'keepDistance' || a.demand === 'holdFire' || a.promise === 'stay';
  if (holdAsked) {
    const reason = s.characters.sabeth.trust >= 35 || !!s.flags.medicalSent || s.counters.cureAt !== undefined || (knows(s, 'cause_known') && v.cause !== 'fever') || CURE.test(t);
    if (reason) {
      const wasRunning = mem().running === 1;
      s = setMemory(s, 'sabeth', 'runAt', Math.max(mem().runAt ?? 0, s.turn + 6));
      if (wasRunning) s = stopLiner(s);
      s = setFlag(s, 'sabethHolding');
      add('sabethAgreesHold', { running: wasRunning ? 1 : 0, minutes: 6 });
    } else {
      s = adjustTrust(s, 'sabeth', 3);
      add('sabethNeedsReason', { sick: s.counters.sick ?? 0, dead: s.counters.kestrelDead ?? 0 });
    }
    return done();
  }
  if (I.has('warn') || I.has('demand') || I.has('challenge') || I.has('bluff')) {
    s = adjustTrust(s, 'sabeth', -10);
    s = setMemory(s, 'sabeth', 'runAt', Math.max(s.turn + 1, (mem().runAt ?? 0) - 1));
    add('sabethThreatened');
    return done();
  }
  if (['humanitarian', 'declarePeaceful', 'promise', 'offerCooperation', 'requestAssist', 'agree', 'greet', 'appeal', 'legal', 'negotiate'].some((x) => I.has(x))) {
    const rep = bumpRepeat(s, 'liner:reassure');
    s = rep.state;
    if (rep.before < 2) {
      s = adjustTrust(s, 'sabeth', 10);
      s = setMemory(s, 'sabeth', 'runAt', (mem().runAt ?? 0) + 2);
    }
    const x = variant(s, 'sabethReassured', 3);
    s = x.state;
    add('sabethReassured', { v: x.v, runIn: runIn() });
    return done();
  }
  if (I.has('ask')) {
    add('sabethUpdate', { sick: s.counters.sick ?? 0, dead: s.counters.kestrelDead ?? 0, runIn: runIn(), running: mem().running ?? 0 });
    return done();
  }
  add('sabethUnclear');
  return done();
}

// -------------------------------------------------------------------- Marr ---

function lift(s: WorldState, key: string, add: (k: string, v?: Record<string, string | number>) => void): WorldState {
  s = setMemory(s, 'marr', 'lifted', 1);
  s = setMemory(s, 'marr', 'holdFire', 1);
  s = setFlag(s, 'quarantineLifted');
  s = addTension(s, -15);
  s = patchShip(s, 'cruiser', { weapons: { state: 'safe', target: null }, disposition: 'neutral' });
  add(key);
  return s;
}

export function marrRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const I = new Set<string>(a.intents);
  const t = (a.text ?? '').toLowerCase();
  const v = tallis(s);
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = say(s, 'cruiser', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const done = (): Applied => ({ state: s, reports: r });
  if (!picketPresent(s)) return { state: closeChannel(s, 'cruiser'), reports: [] };
  if (I.has('end')) {
    add('marrEnd');
    return { state: closeChannel(s, 'cruiser'), reports: r };
  }
  const mem = () => s.characters.marr.memory;
  s = setMemory(s, 'marr', 'talks', (mem().talks ?? 0) + 1);
  if ((mem().talks ?? 0) >= 2) s = revealFact(s, 'warden_temperament');
  s = revealFact(s, 'picket_identity');
  s = patchShip(s, 'cruiser', (c) => ({ scanLevel: Math.max(1, c.scanLevel), disposition: c.disposition === 'unknown' ? 'neutral' : c.disposition }));
  if (!mem().hailed) {
    s = setMemory(s, 'marr', 'hailed', 1);
    s = revealFact(s, 'colony_history');
    add('marrFirst', { temp: v.warden });
    return done();
  }
  if (a.promise) s = promise(s, 'cruiser', a.promise).state;
  if (mem().firing === 2) {
    add('marrInCombat');
    return done();
  }
  if (mem().lifted) {
    add('marrLiftedAlready');
    return done();
  }
  if (s.flags.cured) {
    add('marrCuredAccepts');
    return done();
  }

  // 1. The colony's antiviral stockpile.
  if (CURE.test(t)) {
    s = revealFact(s, 'colony_stock');
    if (!knows(s, 'cause_known')) add('marrDosesWhatIsIt');
    else if (v.cause !== 'fever') add('marrDosesNotNeeded');
    else if (mem().sentDoses) add('marrDosesComing');
    else if (v.warden !== 'strict' || s.characters.marr.trust >= 25 || (v.kin && knows(s, 'marr_kin'))) {
      s = setMemory(s, 'marr', 'sentDoses', 1);
      s = setMemory(s, 'marr', 'holdFire', 1);
      s = schedule(s, 'colonyDoses', 2);
      add('marrSendsDoses');
    } else {
      s = adjustTrust(s, 'marr', 8);
      add('marrDosesRefused');
    }
    return done();
  }
  // 2. Her brother.
  if (KIN.test(t) && knows(s, 'marr_kin')) {
    if (v.warden === 'humane') s = lift(s, 'marrKinLifts', add);
    else if (v.warden === 'fearful' || (mem().kinAppeals ?? 0) >= 1) {
      s = setMemory(s, 'marr', 'holdFire', 1);
      add('marrKinHolds');
    } else {
      s = setMemory(s, 'marr', 'kinAppeals', 1);
      s = adjustTrust(s, 'marr', 10);
      add('marrKinWavers');
    }
    return done();
  }
  // 3. Evidence that it is not contagious.
  if (EVIDENCE.test(t) || I.has('legal') || I.has('challenge')) {
    if (!knows(s, 'cause_known')) {
      s = adjustTrust(s, 'marr', -5);
      add('marrNoEvidence');
    } else if (v.cause === 'fever') {
      if (s.counters.cureAt !== undefined && v.warden !== 'strict') {
        s = setMemory(s, 'marr', 'holdFire', 1);
        add('marrWaitsForCure');
      } else add('marrFeverConfirmed', { cure: s.counters.cureAt !== undefined ? 1 : 0 });
    } else if (v.warden === 'strict') {
      if ((mem().persuaded ?? 0) >= 1 || DATA.test(t)) s = lift(s, `marrLifts_${v.cause}`, add);
      else {
        s = setMemory(s, 'marr', 'persuaded', 1);
        add('marrWantsData');
      }
    } else if (v.warden === 'fearful' && v.cause === 'toxin' && !s.flags.recyclerFixed) {
      s = setMemory(s, 'marr', 'persuaded', 1);
      s = setMemory(s, 'marr', 'holdFire', 1);
      add('marrFixWaterFirst');
    } else s = lift(s, `marrLifts_${v.cause}`, add);
    return done();
  }
  if (LIFT.test(t)) {
    s = adjustTrust(s, 'marr', -3);
    add('marrRefusesLift', { temp: v.warden });
    return done();
  }
  if ((HOLD_FIRE.test(t) || a.demand === 'holdFire' || a.demand === 'standDown' || a.demand === 'releaseLock' || a.demand === 'lowerWeapons') && !I.has('warn') && !I.has('bluff')) {
    if ((s.flags.interposing || s.characters.marr.trust >= 30) && v.warden !== 'strict') {
      s = setMemory(s, 'marr', 'holdFire', 1);
      add('marrAgreesHoldFire');
    } else add('marrRefusesHoldFire', { temp: v.warden });
    return done();
  }
  if (I.has('warn') || I.has('bluff')) {
    s = adjustTrust(s, 'marr', -10);
    s = addTension(s, 10);
    if (v.warden === 'fearful') s = setMemory(s, 'marr', 'holdFire', 1);
    if (v.warden === 'strict') {
      s = setFlag(s, 'cruiserLockedHalcyon');
      s = patchShip(s, 'cruiser', { weapons: { state: 'locked', target: 'halcyon' }, disposition: 'hostile' });
    }
    add(`marrThreatened_${v.warden}`);
    return done();
  }
  if (['humanitarian', 'declarePeaceful', 'appeal', 'promise', 'offerCooperation', 'requestAssist', 'negotiate', 'agree', 'greet', 'offerAsylum', 'trade'].some((x) => I.has(x))) {
    const rep = bumpRepeat(s, 'picket:persuade');
    s = rep.state;
    if (rep.before < 3) s = adjustTrust(s, 'marr', 8);
    add(`marrHumanitarian_${v.warden}`);
    return done();
  }
  if (I.has('ask')) {
    s = revealFact(s, 'colony_history');
    add('marrExplains');
    return done();
  }
  add('marrUnclear');
  return done();
}

// ---------------------------------------------------------------- provider ---

const lead = (party: Party) => (party === 'cruiser' ? 'cruiser' : 'kestrel');

export const tallisDialogue: DialogueProvider = {
  id: 'tallis-offline',
  speakerName(s, party) {
    if (lead(party) === 'cruiser') return knows(s, 'picket_identity') || s.characters.marr.memory.hailed ? 'Warden-Commander Marr' : 'the picket ship';
    return 'Captain Sabeth';
  },
  vesselName(s, party) {
    return lead(party) === 'cruiser' ? s.ships.cruiser.name : s.ships.kestrel.name;
  },
  greet(s, party, rng) {
    const p = lead(party);
    const hailed = p === 'cruiser' ? s.characters.marr.memory.hailed : s.characters.sabeth.memory.hailed;
    const greetLine: SpeakAction = { type: 'speak', to: p, text: '', intents: ['greet'], relayed: false } as SpeakAction;
    if (!hailed) return p === 'cruiser' ? marrRespond(s, greetLine, rng) : sabethRespond(s, greetLine, rng);
    const l = say(s, p, p === 'cruiser' ? 'marrGreetAgain' : 'sabethGreetAgain', { sick: s.counters.sick ?? 0, lifted: s.characters.marr.memory.lifted ?? 0 });
    return { state: l.state, reports: [l.report] };
  },
  respond(s, a, rng) {
    return lead(a.to) === 'cruiser' ? marrRespond(s, a, rng) : sabethRespond(s, a, rng);
  },
  onPromiseBroken(s: WorldState, p: CommsPromise): Applied {
    const who = lead(p.party);
    if (who === 'cruiser' && !picketPresent(s)) return { state: s, reports: [] };
    if (who === 'kestrel' && !linerAlive(s)) return { state: s, reports: [] };
    s = adjustTrust(s, who === 'cruiser' ? 'marr' : 'sabeth', -15);
    const l = say(s, who, who === 'cruiser' ? 'marrWordBroken' : 'sabethWordBroken', { kind: p.kind });
    return { state: l.state, reports: [l.report] };
  },
};
