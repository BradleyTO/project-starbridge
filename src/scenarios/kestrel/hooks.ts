/** Scenario-specific meaning of scans, conversation, improvised tactics and queries. */
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { TRACTOR_RANGE, efficiency, km, range, transportRange } from '../../engine/rules';
import { addTension, adjustTrust, cancelEvents, knows, patchShip, patchSystem, revealFact, schedule, setCounter, setFlag, setMemory } from '../../engine/state';
import { PASSENGER_PROFILES } from './setup';

export function containmentRate(s: WorldState): number {
  const base = 31 / s.variant.reactorTurns;
  return s.variant.complication === 'coolantLeak' && s.turn >= 3 ? base * 1.6 : base;
}

export function turnsToBreach(s: WorldState): number {
  if (s.flags.kestrelStable || s.ships.kestrel.destroyed) return Infinity;
  return Math.max(0, Math.ceil(s.ships.kestrel.containment / containmentRate(s)));
}

const vanePresent = (s: WorldState) => !s.ships.cruiser.destroyed && !s.flags.cruiserGone && s.ships.cruiser.detected;

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  const h = s.ships.halcyon;
  const eff = efficiency(h, 'sensors');
  const storm = s.variant.complication === 'ionStorm';
  if (storm && !knows(s, 'complication') && target !== 'halcyon') {
    s = revealFact(s, 'complication');
    r.push(say('sensors', 'stormDetected'));
  }
  switch (target) {
    case 'halcyon':
      return query(s, 'systems');
    case 'kestrel': {
      const d = range(s, 'halcyon', 'kestrel');
      const detailRange = (storm ? 30000 : 60000) * Math.min(1.25, eff);
      if (d <= detailRange) {
        s = patchShip(s, 'kestrel', { scanLevel: 2 });
        s = revealFact(s, 'kestrel_status');
        s = revealFact(s, 'compartment_exists');
        if (s.variant.complication === 'coolantLeak' || s.variant.complication === 'trappedCrew') s = revealFact(s, 'complication');
        r.push(
          say('sensors', 'scanKestrelDetail', {
            souls: s.ships.kestrel.souls,
            containment: Math.round(s.ships.kestrel.containment),
            turns: turnsToBreach(s),
            extra: s.variant.complication === 'coolantLeak' ? 'coolant' : s.variant.complication === 'trappedCrew' ? 'trapped' : '',
          }),
        );
      } else {
        s = patchShip(s, 'kestrel', { scanLevel: Math.max(1, s.ships.kestrel.scanLevel) });
        r.push(say('sensors', 'scanKestrelBasic', { km: km(d), need: km(detailRange) }));
      }
      return { state: s, reports: r };
    }
    case 'cruiser': {
      const d = range(s, 'halcyon', 'cruiser');
      s = revealFact(s, 'cruiser_identity');
      s = patchShip(s, 'cruiser', (c) => ({ scanLevel: Math.max(1, c.scanLevel), disposition: c.disposition === 'unknown' ? 'neutral' : c.disposition }));
      if (d <= 60000) {
        s = patchShip(s, 'cruiser', { scanLevel: 2 });
        const boosted = h.systems.sensors.power >= 125 && eff >= 0.9;
        if (boosted && !knows(s, 'cruiser_weakness')) {
          s = revealFact(s, 'cruiser_weakness');
          r.push(say('sensors', 'scanCruiserWeakness'));
        } else r.push(say('sensors', 'scanCruiserDetail', { hull: s.ships.cruiser.hull, shields: s.ships.cruiser.shields.strength, hint: boosted || knows(s, 'cruiser_weakness') ? 0 : 1 }));
      } else r.push(say('sensors', 'scanCruiserBasic', { km: km(d) }));
      return { state: s, reports: r };
    }
    case 'compartment': {
      const d = range(s, 'halcyon', 'kestrel');
      const reach = h.systems.sensors.power >= 125 ? 15000 : 5000;
      if (knows(s, 'passenger_identity')) {
        r.push(say('sensors', 'compartmentKnown', { name: s.characters.passenger.name, status: s.characters.passenger.ship === 'kestrel' ? s.characters.passenger.status : 'moved' }));
        return { state: s, reports: r };
      }
      if (d > reach) {
        r.push(say('sensors', 'compartmentTooFar', { km: km(d), need: km(reach), boost: reach < 15000 ? 1 : 0 }));
        return { state: s, reports: r };
      }
      s = revealFact(s, 'passenger_identity');
      s = revealFact(s, 'cruiser_intent');
      r.push(say('sensors', 'compartmentRevealed', { name: s.characters.passenger.name, kind: s.variant.passenger }));
      return { state: s, reports: r };
    }
    case 'area': {
      if (!s.ships.cruiser.detected && !s.flags.cruiserGone) s = patchShip(s, 'cruiser', { detected: true });
      if (s.turn >= s.variant.reinforcementTurn - 7 && !knows(s, 'reinforcements')) {
        s = revealFact(s, 'reinforcements');
        r.push(say('sensors', 'reinforcementsDetected', { turns: Math.max(1, s.variant.reinforcementTurn - s.turn) }));
      } else r.push(say('sensors', 'areaSweep', { known: knows(s, 'reinforcements') ? Math.max(1, s.variant.reinforcementTurn - s.turn) : 0 }));
      return { state: s, reports: r };
    }
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function talkToArden(s: WorldState, a: Comm): Applied {
  const r: Report[] = [];
  const arden = s.characters.arden;
  const first = !arden.memory.hailed;
  s = setMemory(s, 'arden', 'hailed', (arden.memory.hailed ?? 0) + 1);
  if (a.intent === 'humanitarian' || a.intent === 'reassure') s = adjustTrust(s, 'arden', 10);
  if (a.intent === 'offerAsylum') s = adjustTrust(s, 'arden', 25);
  if (a.intent === 'warn' || a.intent === 'bluff') s = adjustTrust(s, 'arden', -10);
  if (a.intent === 'trade' && a.offer === 'passenger') s = adjustTrust(s, 'arden', -40);

  const askAboutHold = a.topic === 'cargo' || a.topic === 'passenger' || a.intent === 'offerAsylum';
  if (first && !askAboutHold) {
    s = revealFact(s, 'kestrel_status');
    s = adjustTrust(s, 'arden', 5);
    r.push(comms('arden', 'ardenFirst', { souls: s.ships.kestrel.souls }));
    return { state: s, reports: r };
  }
  if (askAboutHold) {
    const trust = s.characters.arden.trust;
    if (knows(s, 'passenger_identity') || (knows(s, 'compartment_exists') && trust >= 40)) {
      s = revealFact(s, 'passenger_identity');
      s = setFlag(s, 'compartmentOpen');
      s = setMemory(s, 'arden', 'revealed', 1);
      r.push(comms('arden', 'ardenReveals', { name: s.characters.passenger.name, kind: s.variant.passenger }));
    } else if (knows(s, 'compartment_exists')) {
      s = setFlag(s, 'ardenLied');
      r.push(comms('arden', 'ardenDeflects', { trust }));
    } else r.push(comms('arden', 'ardenCargo'));
    return { state: s, reports: r };
  }
  if (a.intent === 'trade' && a.offer === 'passenger') {
    r.push(comms('arden', 'ardenBetrayed'));
    return { state: s, reports: r };
  }
  r.push(comms('arden', 'ardenUpdate', { turns: turnsToBreach(s), souls: s.ships.kestrel.souls, stable: s.flags.kestrelStable ? 1 : 0 }));
  return { state: s, reports: r };
}

function talkToPassenger(s: WorldState, a: Comm): Applied {
  const r: Report[] = [];
  const p = s.characters.passenger;
  const prof = PASSENGER_PROFILES[s.variant.passenger];
  s = setMemory(s, 'passenger', 'spoke', (p.memory.spoke ?? 0) + 1);
  if (a.intent === 'offerAsylum' || a.intent === 'humanitarian' || a.intent === 'reassure') {
    s = adjustTrust(s, 'passenger', a.intent === 'offerAsylum' ? 40 : 15);
    if (a.intent === 'offerAsylum') s = setFlag(s, 'asylumOffered');
  }
  if (s.characters.passenger.trust >= 15 || a.intent === 'ask' || a.intent === 'offerAsylum') {
    const already = knows(s, prof.leverageFact);
    s = revealFact(s, prof.leverageFact);
    r.push(comms('passenger', already ? 'passengerRepeat' : `passengerIntel_${s.variant.passenger}`, { name: p.name }));
  } else r.push(comms('passenger', 'passengerWary', { name: p.name }));
  return { state: s, reports: r };
}

const COMM_EFFECT: Record<string, Record<WorldState['variant']['temperament'], number>> = {
  open: { hardliner: 0, pragmatic: 0, cautious: 0 },
  ask: { hardliner: 0, pragmatic: 0, cautious: 1 },
  humanitarian: { hardliner: 1, pragmatic: 2, cautious: 2 },
  legal: { hardliner: 0, pragmatic: 1, cautious: 2 },
  reassure: { hardliner: 1, pragmatic: 1, cautious: 1 },
  warn: { hardliner: -2, pragmatic: -1, cautious: 1 },
  appeal: { hardliner: 0, pragmatic: 1, cautious: 1 },
  offerAsylum: { hardliner: -1, pragmatic: 0, cautious: 0 },
};

function reachAgreement(s: WorldState, kind: 1 | 2 | 3, r: Report[]): WorldState {
  // 1 = rescue corridor (crew may leave; the Kestrel stays), 2 = passenger released, 3 = passenger handed over
  s = setMemory(s, 'vane', 'agreement', kind);
  s = setMemory(s, 'vane', 'lockedOn', 0);
  s = cancelEvents(s, 'cruiserFire');
  s = addTension(s, -20);
  s = patchShip(s, 'cruiser', { disposition: 'neutral', weapons: { state: 'safe', target: null } });
  s = setFlag(s, 'agreement');
  r.push(comms('vane', `vaneAgreement_${kind}`, { name: s.characters.passenger.name }));
  return s;
}

function talkToVane(s: WorldState, a: Comm, rng: Rng): Applied {
  const r: Report[] = [];
  const vane = s.characters.vane;
  const temp = s.variant.temperament;
  const mem = vane.memory;
  const h = s.ships.halcyon;
  const first = !mem.hailed;
  s = setMemory(s, 'vane', 'hailed', 1);
  s = setMemory(s, 'vane', 'talks', (mem.talks ?? 0) + 1);
  s = revealFact(s, 'cruiser_identity');
  s = patchShip(s, 'cruiser', (c) => ({ scanLevel: Math.max(1, c.scanLevel), disposition: c.disposition === 'unknown' ? 'neutral' : c.disposition }));
  if (first || a.intent === 'open' || a.topic === 'intentions') s = revealFact(s, 'cruiser_intent');
  if ((mem.talks ?? 0) >= 1) s = revealFact(s, 'prefect_temperament');

  if (mem.agreement) {
    r.push(comms('vane', 'vaneHoldsAgreement', { kind: mem.agreement }));
    return { state: s, reports: r };
  }
  const weaponsOnHim = h.weapons.state === 'locked' && h.weapons.target === 'cruiser';
  if (mem.attacking && !(a.intent === 'trade' && a.offer === 'passenger') && a.intent !== 'warn') {
    r.push(comms('vane', 'vaneInCombat'));
    return { state: s, reports: r };
  }

  let delta = 0;
  let key = '';
  switch (a.intent) {
    case 'bluff': {
      let p = { hardliner: 0.3, pragmatic: 0.5, cautious: 0.75 }[temp];
      if ((s.counters.ghostUntil ?? -1) >= s.turn + 1) p += 0.25;
      if (vane.trust < -20) p -= 0.2;
      if (rng.next() < p) {
        s = setMemory(s, 'vane', 'bluffUntil', s.turn + 3);
        s = setFlag(s, 'bluffed');
        s = schedule(s, 'bluffCheck', 3);
        r.push(comms('vane', 'vaneBluffWorks'));
        return { state: s, reports: r };
      }
      s = adjustTrust(s, 'vane', -20);
      s = addTension(s, 5);
      delta = -1;
      key = 'vaneBluffFails';
      break;
    }
    case 'trade': {
      const offer = a.offer ?? 'unspecified';
      if (offer === 'passenger') {
        s = adjustTrust(s, 'arden', -40);
        s = reachAgreement(s, 3, r);
        return { state: s, reports: r };
      }
      if (offer === 'kestrel') {
        // Ceding the freighter (with whatever is in her hold) for the crew's lives.
        s = setFlag(s, 'kestrelCeded');
        s = reachAgreement(s, 1, r);
        if (knows(s, 'passenger_identity') && s.characters.passenger.ship === 'kestrel') r.push(say('xo', 'cededWithPassenger', { name: s.characters.passenger.name }));
        return { state: s, reports: r };
      }
      delta = offer === 'cargo' || offer === 'medical' ? { hardliner: 0, pragmatic: 2, cautious: 1 }[temp] : offer === 'data' ? { hardliner: 0, pragmatic: 1, cautious: 1 }[temp] : 0;
      key = delta > 0 ? 'vaneTradeInterested' : 'vaneTradeRejected';
      break;
    }
    case 'legal':
      if (knows(s, 'detention_evidence') && s.variant.passenger === 'prisoner' && s.characters.passenger.status !== 'dead') {
        if (temp !== 'hardliner') {
          s = reachAgreement(s, 2, r);
          return { state: s, reports: r };
        }
        delta = 3;
        key = 'vaneLegalShaken';
        break;
      }
      delta = COMM_EFFECT.legal[temp];
      key = 'vaneLegal';
      break;
    case 'appeal':
      if (knows(s, 'prefect_sibling') && s.variant.passenger === 'sibling' && s.characters.passenger.status !== 'dead') {
        if (temp !== 'hardliner' || (mem.appeals ?? 0) >= 1) {
          s = reachAgreement(s, 2, r);
          return { state: s, reports: r };
        }
        s = setMemory(s, 'vane', 'appeals', 1);
        delta = 3;
        key = 'vaneAppealWavers';
        break;
      }
      delta = COMM_EFFECT.appeal[temp];
      key = 'vaneAppealGeneric';
      break;
    case 'warn':
      delta = COMM_EFFECT.warn[temp];
      s = addTension(s, temp === 'hardliner' ? 10 : 5);
      if (mem.attacking && s.ships.cruiser.hull <= { hardliner: 40, pragmatic: 55, cautious: 75 }[temp]) {
        s = setFlag(s, 'cruiserRetreating');
        r.push(comms('vane', 'vaneYields'));
        return { state: s, reports: r };
      }
      if (temp === 'cautious') s = setMemory(s, 'vane', 'bluffUntil', s.turn + 1);
      key = `vaneWarn_${temp}`;
      break;
    default:
      delta = COMM_EFFECT[a.intent]?.[temp] ?? 0;
      key = first ? 'vaneFirst' : a.intent === 'humanitarian' ? 'vaneHumanitarian' : a.intent === 'reassure' ? 'vaneReassure' : 'vaneRepeat';
      if (a.intent === 'humanitarian') s = addTension(s, -5);
      if (a.intent === 'reassure') s = addTension(s, -3);
  }

  if (weaponsOnHim) delta = delta > 0 ? Math.floor(delta / 2) : delta * 2;
  const patience = (s.characters.vane.memory.patience ?? 0) + delta;
  s = setMemory(s, 'vane', 'patience', patience);
  if (delta > 0) s = adjustTrust(s, 'vane', delta * 5);
  r.push(comms('vane', key, { weaponsOnHim: weaponsOnHim ? 1 : 0, name: s.characters.passenger.name }));

  const passengerTaken = s.flags.passengerAboard && s.flags.vaneSawPassengerMoved;
  if (patience >= 8 && s.relations.tension < 60 && !weaponsOnHim && !passengerTaken) s = reachAgreement(s, 1, r);
  return { state: s, reports: r };
}

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  if (a.target === 'kestrel') return talkToArden(s, a);
  if (a.target === 'passenger') return talkToPassenger(s, a);
  return talkToVane(s, a, rng);
}

// ------------------------------------------------------------ improvise ---

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, rng: Rng): Applied {
  const r: Report[] = [];
  const h = s.ships.halcyon;
  switch (a.method) {
    case 'tractorShield': {
      const coverKestrel = range(s, 'halcyon', 'kestrel') <= TRACTOR_RANGE && !s.ships.kestrel.destroyed;
      s = setCounter(s, 'tractorShieldUntil', s.turn + 2);
      s = setCounter(s, 'tractorShieldCoversKestrel', coverKestrel ? 1 : 0);
      s = patchSystem(s, 'halcyon', 'tractor', { health: h.systems.tractor.health - 8 });
      r.push(say('engineering', 'impTractorShield', { kestrel: coverKestrel ? 1 : 0 }));
      break;
    }
    case 'plasmaVent': {
      s = setCounter(s, 'smokescreenUntil', s.turn + 2);
      s = patchSystem(s, 'halcyon', 'engines', { health: h.systems.engines.health - 10 });
      const wasLocked = !!s.characters.vane.memory.lockedOn;
      if (wasLocked) {
        s = setMemory(s, 'vane', 'lockedOn', 0);
        s = cancelEvents(s, 'cruiserFire');
        s = patchShip(s, 'cruiser', { weapons: { state: 'armed', target: null } });
      }
      s = addTension(s, 3);
      r.push(say('tactical', 'impPlasmaVent', { brokeLock: wasLocked ? 1 : 0 }));
      break;
    }
    case 'sensorGhost':
      s = setCounter(s, 'ghostUntil', s.turn + 2);
      if (vanePresent(s) && s.variant.temperament !== 'hardliner') s = setMemory(s, 'vane', 'bluffUntil', Math.max(s.characters.vane.memory.bluffUntil ?? -1, s.turn + 1));
      r.push(say('sensors', 'impSensorGhost', { temp: s.variant.temperament }));
      break;
    case 'shieldExtend':
      s = setCounter(s, 'shieldExtendUntil', s.turn + 2);
      s = patchShip(s, 'halcyon', (sh) => ({ shields: { raised: true, strength: Math.max(0, sh.shields.strength - 20) } }));
      r.push(say('tactical', 'impShieldExtend'));
      break;
    case 'ejectCore': {
      const chance = 0.7 + (s.ships.kestrel.containment > 15 ? 0.1 : 0);
      if (rng.next() < chance) {
        s = setFlag(s, 'kestrelStable');
        s = setFlag(s, 'coreEjected');
        s = patchShip(s, 'kestrel', { containment: 100 });
        s = patchSystem(s, 'kestrel', 'reactor', { health: 0 });
        s = adjustTrust(s, 'arden', 15);
        s = { ...s, fx: [...s.fx, { kind: 'explosion', from: 'kestrel', to: 'kestrel' }] };
        r.push(say('engineering', 'impEjectCore'));
      } else {
        s = patchShip(s, 'kestrel', (k) => ({ containment: Math.max(0, k.containment - 8) }));
        r.push(say('engineering', 'impEjectCoreFailed', { containment: Math.round(s.ships.kestrel.containment) }));
      }
      break;
    }
    case 'other':
      r.push(say('engineering', 'impOther', { description: a.description.slice(0, 80) }));
      break;
  }
  return { state: s, reports: r };
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  const k = s.ships.kestrel;
  const d = range(s, 'halcyon', 'kestrel');
  if (!knows(s, 'kestrel_status')) out.push('scan the Kestrel');
  if (vanePresent(s) && !s.characters.vane.memory.hailed) out.push('hail the cruiser');
  if (!k.destroyed && k.souls > 0 && d > transportRange(s)) out.push('close to transporter range');
  if (!k.destroyed && k.souls > 0 && d <= transportRange(s)) out.push(s.ships.halcyon.shields.raised ? 'lower shields and evacuate the crew' : 'evacuate the crew');
  if (knows(s, 'compartment_exists') && !knows(s, 'passenger_identity')) out.push('scan the compartment');
  if (!s.flags.kestrelStable && !k.destroyed && k.souls > 0) out.push('send an engineering team to stabilise the reactor');
  if (vanePresent(s) && !s.characters.vane.memory.agreement) out.push('negotiate with the Prefect');
  if (k.souls === 0 || s.flags.kestrelStable) out.push('withdraw');
  return out.slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  const h = s.ships.halcyon;
  switch (topic) {
    case 'status':
      return {
        state: s,
        reports: [
          say('xo', 'statusReport', {
            hull: h.hull,
            shields: h.shields.raised ? `up (${h.shields.strength}%)` : `down (${h.shields.strength}%)`,
            weapons: h.weapons.state,
            kestrel: s.ships.kestrel.destroyed ? 'destroyed' : `${km(range(s, 'halcyon', 'kestrel'))}, ${s.ships.kestrel.souls} aboard${s.flags.kestrelStable ? ', reactor stable' : knows(s, 'kestrel_status') ? `, ~${turnsToBreach(s)} min to breach` : ''}`,
            cruiser: s.flags.cruiserGone ? 'gone' : s.ships.cruiser.destroyed ? 'destroyed' : s.ships.cruiser.detected ? km(range(s, 'halcyon', 'cruiser')) : 'none',
            jump: h.jump.charge,
          }),
        ],
      };
    case 'systems':
      return { state: s, reports: [say('engineering', 'systemsReport')] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'contactsReport')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query };
