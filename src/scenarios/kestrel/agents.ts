/**
 * Independent agents and world events for the Kestrel Incident. Runs once per
 * simulated minute after the captain's orders resolve. Every agent reads only
 * what its character could plausibly know (e.g. Vane only learns the passenger
 * moved if his sensors could see the transport).
 */
import { activePromise, commitment, openChannelTo, patchComms } from '../../engine/comms';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, narrate, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { ManeuverIntent, NavGoal, NavRef, PendingEvent, ShipId, WorldState } from '../../engine/types';
import { resolveAttack, destroyShip } from '../../engine/combat';
import { BEAM_RANGE, TRACTOR_RANGE, range } from '../../engine/rules';
import { dot, len, sub, unit } from '../../engine/kinematics';
import { addTension, knows, patchCharacter, patchShip, revealFact, schedule, setCounter, setFlag, setMemory } from '../../engine/state';
import { containmentRate, turnsToBreach } from './hooks';

const RETREAT_AT = { hardliner: 25, pragmatic: 40, cautious: 60 } as const;

export function simulate(s: WorldState, rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, rng: Rng, r: Report[]) => WorldState) => {
    if (s.outcome || s.ships.halcyon.destroyed) return;
    s = fn(s, rng, reports);
  };
  run(environment);
  run(cruiserAgent);
  run(ardenAgent);
  run(passengerAgent);
  run(resolveEvents);
  run(officerAgent);
  // Tractor beams cannot hold beyond their reach.
  const t = s.ships.halcyon.tractor.target;
  if (t && (s.ships[t].destroyed || range(s, 'halcyon', t) > TRACTOR_RANGE * 1.5)) {
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    reports.push(say('helm', 'tractorFailed'));
  }
  return { state: s, reports };
}

// ----------------------------------------------------------- environment ---

function environment(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  const k = s.ships.kestrel;
  if (k.destroyed || s.flags.kestrelStable) return s;
  const containment = Math.max(0, Math.round((k.containment - containmentRate(s)) * 10) / 10);
  s = patchShip(s, 'kestrel', { containment });
  const p = s.characters.passenger;
  if (containment < 8 && p.status === 'stasis' && p.ship === 'kestrel') {
    s = patchCharacter(s, 'passenger', { status: 'active', memory: { ...p.memory, awake: 1 } });
    s = revealFact(s, 'compartment_exists');
    r.push(comms('passenger', 'passengerWakesOnKestrel'));
  }
  if (containment <= 0) {
    const nearby = range(s, 'halcyon', 'kestrel') <= 3000;
    const souls = s.ships.kestrel.souls;
    s = destroyShip(s, 'kestrel', r, { quiet: true });
    r.push(narrate(souls > 0 ? 'kestrelBreachCrew' : 'kestrelBreachEmpty', { souls }));
    if (nearby) {
      const h = s.ships.halcyon;
      if (h.shields.raised) s = patchShip(s, 'halcyon', { shields: { raised: true, strength: Math.max(0, h.shields.strength - 30) } });
      else s = patchShip(s, 'halcyon', { hull: Math.max(0, h.hull - 12) });
      r.push(say('engineering', 'breachShockwave', { shielded: h.shields.raised ? 1 : 0 }));
      if (s.ships.halcyon.hull <= 0) s = destroyShip(s, 'halcyon', r);
    }
  }
  return s;
}

// ---------------------------------------------------------------- cruiser ---

function cruiserAgent(s: WorldState, rng: Rng, r: Report[]): WorldState {
  const c = s.ships.cruiser;
  if (c.destroyed || s.flags.cruiserGone || !c.detected) return s;
  const temp = s.variant.temperament;
  const mem = () => s.characters.vane.memory;

  // Retreat when badly hurt (threshold depends on temperament) or when he has yielded.
  if (c.hull <= RETREAT_AT[temp] || s.flags.cruiserRetreating) {
    if (!s.flags.cruiserRetreating) {
      s = setFlag(s, 'cruiserRetreating');
      r.push(comms('vane', 'vaneRetreats'));
    }
    s = steer(s, 'retreat', 'halcyon', null);
    s = patchShip(s, 'cruiser', { weapons: { state: 'safe', target: null } });
    s = setMemory(s, 'vane', 'lockedOn', 0);
    if (range(s, 'halcyon', 'cruiser') > 150000) {
      s = setFlag(s, 'cruiserGone');
      s = patchShip(s, 'cruiser', { detected: false });
    }
    return s;
  }

  const p = s.characters.passenger;
  // His quarry is dead: nothing left to hunt, so he leaves unless already in a shooting fight.
  if (p.status === 'dead' && !mem().attacking && !s.flags.shotsFired) {
    s = setFlag(s, 'cruiserRetreating');
    r.push(comms('vane', 'vaneQuarryLost'));
    return s;
  }
  const believesOnHalcyon = p.ship === 'halcyon' && !!s.flags.vaneSawPassengerMoved;
  const hunt: ShipId = believesOnHalcyon || s.ships.kestrel.destroyed ? 'halcyon' : 'kestrel';
  const smoke = (s.counters.smokescreenUntil ?? -1) >= s.turn;

  // Agreement in force.
  if (mem().agreement) {
    if (mem().agreement === 1 && s.flags.vaneSawPassengerMoved && s.flags.passengerAboard) {
      // The corridor terms leave the Kestrel and her hold to Vane; taking the passenger in plain sight breaks them.
      s = setMemory(s, 'vane', 'agreement', 0);
      s = setMemory(s, 'vane', 'patience', 0);
      s = setFlag(s, 'agreement', false);
      s = addTension(s, 25);
      s = patchShip(s, 'cruiser', { disposition: 'hostile' });
      r.push(comms('vane', 'vaneBetrayed'));
      return s;
    }
    const anchor = mem().agreement === 3 ? (p.ship === 'halcyon' ? 'halcyon' : 'kestrel') : 'kestrel';
    const standoff = mem().agreement === 3 ? 8000 : 25000;
    if (!s.ships[anchor].destroyed) s = steer(s, 'approach', anchor, standoff);
    if (mem().agreement === 3 && p.status !== 'dead' && p.ship !== 'cruiser' && range(s, 'cruiser', p.ship) <= 20000) {
      s = patchCharacter(s, 'passenger', { ship: 'cruiser', status: p.status === 'stasis' ? 'stasis' : 'active' });
      s = setFlag(s, 'passengerHandedOver');
      s = { ...s, fx: [...s.fx, { kind: 'transport', from: p.ship, to: 'cruiser' }] };
      r.push(comms('vane', 'vaneCollectsPassenger', { name: p.name }));
    }
    return s;
  }

  // A successful bluff (or a cautious captain's hesitation) holds him back.
  if ((mem().bluffUntil ?? -1) >= s.turn) {
    return steer(s, 'retreat', 'halcyon', null, 0.2);
  }

  // Close on the quarry (the move happens over the next minute of physics).
  if (!s.ships[hunt].destroyed) s = steer(s, 'approach', hunt, 8000);
  const dHalcyon = range(s, 'cruiser', 'halcyon');

  // First contact: the demand.
  if (!mem().hailed && dHalcyon <= 120000) {
    s = setMemory(s, 'vane', 'hailed', 1);
    s = setMemory(s, 'vane', 'hailTurn', s.turn);
    s = revealFact(s, 'cruiser_intent');
    s = revealFact(s, 'cruiser_identity');
    s = patchShip(s, 'cruiser', (x) => ({ scanLevel: Math.max(1, x.scanLevel), disposition: x.disposition === 'unknown' ? 'neutral' : x.disposition }));
    r.push(say('comms', 'incomingHail'));
    r.push(comms('vane', 'vaneDemand', { temp }));
    // v0.5: an incoming hail opens a channel; his demand is what "Agreed" / "No" will answer.
    s = openChannelTo(s, 'cruiser', { incoming: true });
    s = patchComms(s, { pending: { party: 'cruiser', kind: 'withdraw', turn: s.turn } });
    return s;
  }

  // Player hostility triggers combat.
  if (s.flags.shotsFired && (s.counters.playerFiredTurn ?? -99) >= s.turn - 1 && !mem().attacking) {
    s = setMemory(s, 'vane', 'attacking', 1);
    r.push(comms('vane', 'vaneReturnsFire'));
  }
  if (s.flags.lockedOnCruiser && (s.counters.lockedOnCruiserTurn ?? -99) === s.turn - 1 && !mem().attacking) {
    s = setMemory(s, 'vane', 'patience', (mem().patience ?? 0) - 2);
    if (temp === 'hardliner' && !mem().lockedOn) {
      s = lockOn(s, 'halcyon', r);
    } else r.push(comms('vane', 'vaneLockWarning'));
  }

  if (mem().attacking) {
    s = steer(s, 'approach', 'halcyon', 15000);
    s = patchShip(s, 'cruiser', { weapons: { state: 'locked', target: 'halcyon' } });
    if (range(s, 'cruiser', 'halcyon') <= BEAM_RANGE && !smoke) s = cruiserFires(s, 'halcyon', rng, r);
    return s;
  }

  // What does Vane make of the Halcyon's posture and motion?
  const view = vanePerceive(s);
  if (mem().hailed && s.turn > (mem().hailTurn ?? 0) && view.stance !== (mem().perceived ?? 0)) {
    s = setMemory(s, 'vane', 'perceived', view.stance);
    if (view.stance === 1 && !mem().saidPeaceful && !view.interposing) {
      s = setMemory(s, 'vane', 'saidPeaceful', 1);
      r.push(comms('vane', 'vaneSeesPeaceful'));
    } else if (view.stance === -1 && !mem().saidThreat) {
      s = setMemory(s, 'vane', 'saidThreat', 1);
      r.push(comms('vane', view.closingFast ? 'vaneSeesClosing' : 'vaneSeesThreat'));
    }
  }

  // A peaceful ship sitting squarely between his guns and the freighter gets one acknowledgement.
  if (mem().hailed && view.stance === 1 && view.interposing && !mem().saidInterpose) {
    s = setMemory(s, 'vane', 'saidInterpose', 1);
    s = setMemory(s, 'vane', 'saidPeaceful', 1);
    r.push(comms('vane', 'vaneSeesPeacefulInterpose'));
  }

  // v0.5: time he granted on the channel ("you have ten minutes") is honoured: no pressure, no lock.
  const grace = !!commitment(s, 'cruiser', 'grace');
  // Patience erodes while the Halcyon stays near the quarry; how fast depends on how she looks.
  if (mem().hailed && s.turn > (mem().hailTurn ?? 0) && !grace) {
    const complying = range(s, 'halcyon', 'kestrel') > 30000 && !s.flags.passengerAboard;
    if (!complying) {
      let loss = 1;
      if (view.stance === 1) loss = temp === 'hardliner' ? s.turn % 2 : 0;
      else if (view.stance === -1) loss = 2;
      // A promise to keep weapons cold that is being kept softens him a little.
      if (loss && activePromise(s, 'cruiser', 'weaponsDown') && s.ships.halcyon.weapons.state === 'safe') loss -= 1;
      if (loss) s = setMemory(s, 'vane', 'patience', (mem().patience ?? 0) - loss);
    }
  }

  if ((mem().patience ?? 0) <= 0 && !mem().lockedOn && !grace && !commitment(s, 'cruiser', 'releasedLock') && range(s, 'cruiser', hunt) <= 30000) {
    if (smoke) r.push(say('tactical', 'vaneBlind'));
    // He will not fire on the ship carrying his quarry, so he threatens the interfering Halcyon instead.
    else s = lockOn(s, hunt === believedHolder(s) && hunt === 'kestrel' ? 'halcyon' : hunt, r);
  }
  return s;
}

/** Point the cruiser's helm at a new guidance goal (kept if unchanged so "reached" survives). */
function steer(s: WorldState, intent: ManeuverIntent, target: NavRef, rangeKm: number | null, speedFactor = 1): WorldState {
  const cur = s.ships.cruiser.nav;
  if (cur && cur.intent === intent && cur.target === target && cur.rangeKm === rangeKm && cur.speedFactor === speedFactor) return s;
  const nav: NavGoal = { intent, target, second: null, rangeKm, speedFactor, offset: null, orderId: null, reached: false, startedTurn: s.turn };
  return patchShip(s, 'cruiser', { nav });
}

export interface VaneView {
  /** 1 peaceful, 0 wary, −1 threatening. */
  stance: 1 | 0 | -1;
  score: number;
  interposing: boolean;
  closingFast: boolean;
}

/**
 * Vane's reading of the Halcyon from what his sensors show: shield and weapon
 * state, whether she is locked on, how fast she is closing on him, whether she
 * is sitting between him and the Kestrel, and any posture the captain has
 * declared over an open channel.
 */
export function vanePerceive(s: WorldState): VaneView {
  const h = s.ships.halcyon;
  const c = s.ships.cruiser;
  let score = 0;
  if (!h.shields.raised) score += 1;
  else score -= 1;
  if (h.weapons.state === 'armed') score -= 1;
  if (h.weapons.state === 'locked' && h.weapons.target === 'cruiser') score -= 3;
  const toC = sub(c.position, h.position);
  const closing = dot(sub(h.velocity, c.velocity), unit(toC));
  const ownClosing = dot(h.velocity, unit(toC));
  const closingFast = len(toC) < 100000 && ownClosing > 150 && closing > 150;
  if (closingFast) score -= 2;
  if (s.posture.stance === 'nonHostile' && (s.counters.postureHeardTurn ?? -1) >= s.posture.since) score += 1;
  if (s.posture.stance === 'assertive') score -= 1;
  const interposing = !!s.flags.interposing;
  if (interposing) score += score >= 2 ? 0 : -1;
  return { stance: score >= 2 ? 1 : score <= -2 ? -1 : 0, score, interposing, closingFast };
}

/** Where Vane believes his quarry is (he will not destroy that ship unless he is in a fight). */
export function believedHolder(s: WorldState): ShipId | null {
  const p = s.characters.passenger;
  if (p.status === 'dead' || p.ship === 'cruiser') return null;
  if (p.ship === 'halcyon' && s.flags.vaneSawPassengerMoved) return 'halcyon';
  return s.ships.kestrel.destroyed ? null : 'kestrel';
}

function lockOn(s: WorldState, target: ShipId, r: Report[]): WorldState {
  s = setMemory(s, 'vane', 'lockedOn', 1);
  s = setFlag(s, target === 'kestrel' ? 'cruiserLockedKestrel' : 'cruiserLockedHalcyon');
  s = patchShip(s, 'cruiser', { weapons: { state: 'locked', target }, disposition: 'hostile' });
  s = addTension(s, 15);
  s = schedule(s, 'cruiserFire', 1, { target });
  r.push(comms('vane', target === 'kestrel' ? 'vaneUltimatumKestrel' : 'vaneUltimatumHalcyon'));
  return s;
}

function cruiserFires(s: WorldState, target: ShipId, rng: Rng, r: Report[]): WorldState {
  let actual = target;
  let protectedBy: 'tractorShield' | 'shieldExtend' | null = null;
  if (target === 'kestrel' && s.flags.interposing && !s.ships.halcyon.destroyed) {
    actual = 'halcyon';
    r.push(say('tactical', 'interposeTookHit'));
  }
  const tsActive = (s.counters.tractorShieldUntil ?? -1) >= s.turn;
  if (tsActive && (actual === 'halcyon' || s.counters.tractorShieldCoversKestrel)) protectedBy = 'tractorShield';
  else if (actual === 'kestrel' && (s.counters.shieldExtendUntil ?? -1) >= s.turn) protectedBy = 'shieldExtend';
  s = setFlag(s, 'cruiserFired');
  s = setCounter(s, 'firedTurn_cruiser', s.turn);
  s = addTension(s, 10);
  const res = resolveAttack(s, 'cruiser', actual, 'beams', rng, { protectedBy });
  s = res.state;
  r.push(say('tactical', res.hit ? (protectedBy ? 'cruiserHitDeflected' : 'cruiserHit') : 'cruiserMissed', { target: s.ships[actual].name, damage: res.hullDamage, by: protectedBy ?? '', shields: s.ships[actual].shields.strength, raised: s.ships[actual].shields.raised ? 1 : 0 }));
  r.push(...res.reports);
  return s;
}

// ------------------------------------------------------------- Kestrel/Arden ---

function ardenAgent(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  const a = s.characters.arden;
  if (a.status === 'dead' || s.ships.kestrel.destroyed) return s;
  const onKestrel = a.ship === 'kestrel';
  if (onKestrel && !s.flags.kestrelStable && turnsToBreach(s) <= 3 && !a.memory.urgent) {
    s = setMemory(s, 'arden', 'urgent', 1);
    r.push(comms('arden', 'ardenUrgent', { turns: turnsToBreach(s) }));
  }
  if (onKestrel && s.characters.vane.memory.lockedOn && s.ships.cruiser.weapons.target === 'kestrel' && !a.memory.panic) {
    s = setMemory(s, 'arden', 'panic', 1);
    r.push(comms('arden', 'ardenPanic'));
  }
  s = ardenPointDefence(s, r);
  if (s.characters.arden.trust >= 30 && !s.flags.compartmentOpen && knows(s, 'compartment_exists')) {
    s = setFlag(s, 'compartmentOpen');
    r.push(comms('arden', 'ardenCodes'));
  }
  if (s.characters.arden.trust >= 45 && !a.memory.revealed && knows(s, 'compartment_exists') && !knows(s, 'passenger_identity')) {
    s = setMemory(s, 'arden', 'revealed', 1);
    s = revealFact(s, 'passenger_identity');
    s = setFlag(s, 'compartmentOpen');
    r.push(comms('arden', 'ardenVolunteers', { name: s.characters.passenger.name, kind: s.variant.passenger }));
  }
  return s;
}

/**
 * Arden's nerve: the Kestrel carries a single point-defence mount. He powers it up
 * (no draw on the RNG; the threshold comes from the scenario seed) when someone
 * locks on to his ship, or when the cruiser closes inside his nerve range. A
 * Concord ship physically between him and the cruiser halves that range.
 */
export function kestrelNerveKm(s: WorldState): number {
  return 12000 + (Math.abs(s.seed) % 19) * 1000;
}

function ardenPointDefence(s: WorldState, r: Report[]): WorldState {
  const k = s.ships.kestrel;
  if (k.destroyed || k.weapons.state !== 'safe' || s.characters.arden.ship !== 'kestrel') return s;
  const h = s.ships.halcyon;
  const cr = s.ships.cruiser;
  const cruiserHere = !cr.destroyed && !s.flags.cruiserGone && cr.detected;
  const lockedByHalcyon = (h.weapons.state === 'locked' && h.weapons.target === 'kestrel');
  const lockedByCruiser = cruiserHere && cr.weapons.state === 'locked' && cr.weapons.target === 'kestrel';
  const nerve = s.flags.interposing ? kestrelNerveKm(s) / 2 : kestrelNerveKm(s);
  const tooClose = cruiserHere && range(s, 'kestrel', 'cruiser') <= nerve;
  if (!lockedByHalcyon && !lockedByCruiser && !tooClose) return s;
  const target: ShipId = lockedByHalcyon && !lockedByCruiser ? 'halcyon' : 'cruiser';
  s = patchShip(s, 'kestrel', { weapons: { state: 'armed', target } });
  r.push(comms('arden', target === 'halcyon' ? 'ardenArmsAgainstHalcyon' : 'ardenArms'));
  return s;
}

// --------------------------------------------------------------- passenger ---

function passengerAgent(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  const p = s.characters.passenger;
  if (p.status === 'dead' || p.status === 'stasis' || p.ship !== 'halcyon') return s;
  if (!p.memory.asked) {
    s = setMemory(s, 'passenger', 'asked', 1);
    s = revealFact(s, 'passenger_identity');
    r.push(comms('passenger', 'passengerAsksAsylum', { kind: s.variant.passenger }));
    return s;
  }
  if (s.variant.passenger === 'sibling' && s.characters.vane.memory.attacking && !p.memory.offered) {
    s = setMemory(s, 'passenger', 'offered', 1);
    s = revealFact(s, 'prefect_sibling');
    r.push(comms('passenger', 'passengerOffersToTalk'));
  }
  return s;
}

// ------------------------------------------------------------------ events ---

function resolveEvents(s: WorldState, rng: Rng, r: Report[]): WorldState {
  const due = s.pending.filter((e) => e.dueTurn <= s.turn);
  if (!due.length && s.turn < s.variant.reinforcementTurn - 3) return s;
  s = { ...s, pending: s.pending.filter((e) => e.dueTurn > s.turn) };
  for (const e of due) s = handleEvent(s, e, rng, r);

  // Reinforcements: a delayed consequence of lingering in the Reach.
  if (s.turn === s.variant.reinforcementTurn - 3 && !s.flags.cruiserGone && !s.ships.cruiser.destroyed) {
    s = revealFact(s, 'reinforcements');
    r.push(say('sensors', 'reinforcementsDetected', { turns: 3 }));
  }
  if (s.turn >= s.variant.reinforcementTurn && !s.flags.reinforcementsArrived) {
    s = setFlag(s, 'reinforcementsArrived');
    r.push(narrate(s.flags.agreement || s.flags.cruiserGone || s.ships.cruiser.destroyed ? 'reinforcementsHoldOff' : 'reinforcementsArrive'));
  }
  return s;
}

function handleEvent(s: WorldState, e: PendingEvent, rng: Rng, r: Report[]): WorldState {
  const vane = s.characters.vane;
  switch (e.kind) {
    case 'cruiserFire': {
      const target = e.data.target as ShipId;
      if (s.ships.cruiser.destroyed || s.flags.cruiserGone || s.flags.cruiserRetreating || vane.memory.agreement || !vane.memory.lockedOn) return s;
      if (s.ships[target].destroyed) return s;
      if ((s.counters.smokescreenUntil ?? -1) >= s.turn) {
        r.push(say('tactical', 'vaneBlind'));
        return schedule(s, 'cruiserFire', 1, { target });
      }
      if (vane.memory.attacking) return s; // the running battle handles his fire
      if (target === believedHolder(s)) {
        // Coercion, not murder: he needs the passenger alive.
        if (!vane.memory.heldFire) r.push(comms('vane', 'vaneHoldsFire', { name: s.characters.passenger.name }));
        return setMemory(s, 'vane', 'heldFire', 1);
      }
      s = cruiserFires(s, target, rng, r);
      const temp = s.variant.temperament;
      const keepFiring = temp === 'hardliner' || (temp === 'pragmatic' && (s.characters.vane.memory.patience ?? 0) <= -2);
      if (keepFiring && !s.ships[target].destroyed) s = schedule(s, 'cruiserFire', 1, { target });
      else {
        s = setMemory(s, 'vane', 'lockedOn', 0);
        s = setMemory(s, 'vane', 'patience', 1);
        if (!s.ships[target].destroyed) r.push(comms('vane', 'vaneAfterWarningShot'));
      }
      return s;
    }
    case 'bluffCheck': {
      let p = { hardliner: 0.7, pragmatic: 0.6, cautious: 0.4 }[s.variant.temperament];
      if ((s.counters.ghostUntil ?? -1) >= s.turn) p -= 0.2;
      if (s.flags.cruiserGone || s.ships.cruiser.destroyed || vane.memory.agreement) return s;
      if (rng.next() < p) {
        s = setFlag(s, 'bluffExposed');
        s = addTension(s, 10);
        s = patchCharacterTrust(s, -30);
        s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - 2);
        r.push(comms('vane', 'vaneBluffExposed'));
      } else {
        s = setMemory(s, 'vane', 'bluffUntil', s.turn + 2);
        r.push(say('sensors', 'bluffHolding'));
      }
      return s;
    }
  }
  return s;
}

function patchCharacterTrust(s: WorldState, delta: number): WorldState {
  return patchCharacter(s, 'vane', (c) => ({ trust: c.trust + delta }));
}

// ------------------------------------------------------------- bridge crew ---

function officerAgent(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  const once = (key: string, cond: boolean, report: Report): boolean => {
    if (!cond || s.flags[`advice_${key}`]) return false;
    s = setFlag(s, `advice_${key}`);
    r.push(report);
    return true;
  };
  const k = s.ships.kestrel;
  const h = s.ships.halcyon;
  const breach = turnsToBreach(s);
  const vaneLocked = !!s.characters.vane.memory.lockedOn;
  void (
    once('breach', !k.destroyed && k.souls > 0 && !s.flags.kestrelStable && breach <= 2, say('engineering', 'adviseBreach', { turns: breach })) ||
    once('shields', (vaneLocked || !!s.characters.vane.memory.attacking) && !h.shields.raised, say('tactical', 'adviseShields')) ||
    once('restraint', !!s.flags.lockedOnCruiser && !s.flags.shotsFired, say('xo', 'adviseRestraint')) ||
    once('damage', h.hull < 50, say('engineering', 'adviseDamage', { hull: h.hull })) ||
    once('weakness', knows(s, 'cruiser_weakness') && !!s.characters.vane.memory.attacking, say('tactical', 'adviseWeakness')) ||
    once('reinforce', knows(s, 'reinforcements') && s.variant.reinforcementTurn - s.turn <= 3 && !s.flags.reinforcementsArrived, say('xo', 'adviseReinforcements')) ||
    once('compartment', knows(s, 'compartment_exists') && !knows(s, 'passenger_identity') && range(s, 'halcyon', 'kestrel') <= 15000, say('sensors', 'adviseCompartment')) ||
    once('scan', s.turn >= 3 && k.scanLevel < 2 && !k.destroyed, say('sensors', 'adviseScan')) ||
    once('options', s.turn >= 5 && (s.counters.rescued ?? 0) === 0 && !s.flags.kestrelStable && !k.destroyed, say('xo', 'adviseOptions'))
  );
  return s;
}

