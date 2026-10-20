/**
 * Independent agents and world events for Quarantine at Tallis Gate. Runs once per simulated
 * minute after the captain's orders resolve.
 *
 * - The sickness: spreads (fever), keeps poisoning (toxin) or stays frightening but harmless (panic).
 * - Captain Sabeth (the liner): runs the quarantine line when her patience runs out, unless she
 *   has been given a reason to wait; she docks if the line is lifted.
 * - Warden-Commander Marr (the picket): warns, locks on and fires on a liner inside the line,
 *   unless the line is lifted or she has promised to hold fire; she defends her ship if attacked.
 * - The Halcyon's medical work: diagnosis, the antiviral, exposure of her own people.
 */
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { NavGoal, PendingEvent, ShipId, WorldState } from '../../engine/types';
import { destroyShip, resolveAttack } from '../../engine/combat';
import { TRACTOR_RANGE, range, transportRange } from '../../engine/rules';
import { addTension, cancelEvents, knows, patchShip, revealFact, schedule, setCounter, setFlag, setMemory } from '../../engine/state';
import { DOCK_KM, LINE_KM, tallis } from './setup';

export const picketPresent = (s: WorldState) => !s.ships.cruiser.destroyed && !s.flags.cruiserGone;
export const linerAlive = (s: WorldState) => !s.ships.kestrel.destroyed;
export const lifted = (s: WorldState) => !!s.characters.marr.memory.lifted;
/** True while Halcyon people have been exposed to Ilun fever and it has not been contained. */
export const exposurePending = (s: WorldState) => !!s.flags.exposed && !s.flags.exposureContained && !s.flags.cured;
/** A ward or screened transporter stops fever crossing to the Halcyon. */
export const protectedTransfer = (s: WorldState) => !!s.flags.isolationWard || !!s.flags.transporterFilter;

export function simulate(s: WorldState, rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, rng: Rng, r: Report[]) => WorldState) => {
    if (s.outcome || s.ships.halcyon.destroyed) return;
    s = fn(s, rng, reports);
  };
  run(medicalWork);
  run(sickness);
  run(sabethAgent);
  run(marrAgent);
  run(resolveEvents);
  const t = s.ships.halcyon.tractor.target;
  if (t && (s.ships[t].destroyed || range(s, 'halcyon', t) > TRACTOR_RANGE * 1.5)) {
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    reports.push(say('helm', 'tractorFailed'));
  }
  return { state: s, reports };
}

// --------------------------------------------------------------- sickness ---

function kill(s: WorldState, n: number, r: Report[]): WorldState {
  const k = s.ships.kestrel;
  n = Math.min(n, k.souls);
  if (n <= 0) return s;
  s = patchShip(s, 'kestrel', { souls: k.souls - n });
  s = setCounter(s, 'kestrelDead', (s.counters.kestrelDead ?? 0) + n);
  s = setCounter(s, 'sick', Math.max(0, (s.counters.sick ?? 0) - n));
  r.push(say('medical', 'pilgrimsDied', { n, total: s.counters.kestrelDead ?? 0 }));
  return s;
}

function sickness(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (!linerAlive(s) || s.ships.kestrel.souls === 0) return s;
  const v = tallis(s);
  const k = s.ships.kestrel;
  const sick = s.counters.sick ?? 0;
  const team = !!s.flags.medicalSent;
  if (v.cause === 'fever') {
    if (s.flags.cured) return s;
    s = setCounter(s, 'sick', Math.min(k.souls, sick + 3));
    const every = team ? 4 : 2;
    if (s.turn >= 4 && s.turn % every === 0) s = kill(s, sick >= 40 ? 2 : 1, r);
  } else if (v.cause === 'toxin') {
    if (s.flags.recyclerFixed) return s;
    s = setCounter(s, 'sick', Math.min(k.souls, sick + 2));
    if (!team && s.turn >= 5 && s.turn % 3 === 0) s = kill(s, 1, r);
  } else if (s.flags.calmed && sick > 0) s = setCounter(s, 'sick', Math.max(0, sick - 10));
  return s;
}

// ---------------------------------------------------------- medical work ---

function medicalWork(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  const v = tallis(s);
  // The engineering team on the liner's recycler (the shared "repair the contact" order sets kestrelStable).
  if (s.flags.kestrelStable && !s.flags.recyclerChecked) {
    s = setFlag(s, 'recyclerChecked');
    if (v.cause === 'toxin') {
      s = setFlag(s, 'recyclerFixed');
      s = revealFact(s, 'cause_known');
      s = patchShip(s, 'kestrel', (k) => ({ systems: { ...k.systems, lifeSupport: { health: 95, power: 100, status: 'online' } } }));
      r.push(say('engineering', 'recyclerFound'));
      if (s.characters.marr.memory.persuaded && !lifted(s) && picketPresent(s)) {
        // She asked for the water to be fixed first; now it is.
        s = setMemory(s, 'marr', 'lifted', 1);
        s = setMemory(s, 'marr', 'holdFire', 1);
        s = setFlag(s, 'quarantineLifted');
        s = patchShip(s, 'cruiser', { weapons: { state: 'safe', target: null }, disposition: 'neutral' });
        r.push(comms('marr', 'marrLiftsAfterRepair'));
      }
    } else r.push(say('engineering', 'recyclerClean'));
  }
  // A medical team aboard the liner.
  if (s.flags.medicalSent && s.counters.teamTurn === undefined) {
    s = setCounter(s, 'teamTurn', s.turn);
    s = setMemory(s, 'sabeth', 'runAt', (s.characters.sabeth.memory.runAt ?? 0) + 6);
    if (v.cause === 'fever' && !knows(s, 'cause_known') && !protectedTransfer(s)) s = expose(s, 'team', r);
    s = schedule(s, 'diagnosis', 1);
    if (v.cause === 'panic') s = setFlag(s, 'calmed');
  }
  // Evacuating sick pilgrims to the Halcyon.
  if ((s.counters.rescued ?? 0) > 0 && v.cause === 'fever' && !s.flags.cured && !protectedTransfer(s)) s = expose(s, 'evac', r);
  // The antiviral.
  const cureAt = s.counters.cureAt;
  if (cureAt !== undefined && s.turn >= cureAt && !s.flags.cured && linerAlive(s)) {
    const inReach = range(s, 'halcyon', 'kestrel') <= transportRange(s) && !s.ships.halcyon.shields.raised;
    const onHalcyon = s.ships.kestrel.souls === 0;
    if (inReach || onHalcyon) s = cure(s, 'halcyon', r);
    else if (!s.flags.cureReadyReported) {
      s = setFlag(s, 'cureReadyReported');
      r.push(say('medical', 'cureReady'));
    }
  }
  return s;
}

function expose(s: WorldState, how: 'team' | 'evac', r: Report[]): WorldState {
  if (s.flags.exposed) return s;
  s = setFlag(s, 'exposed');
  s = schedule(s, 'halcyonOutbreak', 4);
  r.push(say('medical', how === 'team' ? 'teamExposed' : 'evacExposed'));
  return s;
}

export function startCure(s: WorldState, r: Report[]): WorldState {
  if (s.counters.cureAt !== undefined || s.flags.cured) return s;
  s = setCounter(s, 'cureAt', s.turn + 4);
  r.push(say('medical', 'cureStarted', { turns: 4 }));
  return s;
}

function cure(s: WorldState, by: 'halcyon' | 'colony', r: Report[]): WorldState {
  s = setFlag(s, 'cured');
  s = setFlag(s, by === 'colony' ? 'colonyDoses' : 'cureDelivered');
  s = setCounter(s, 'sick', Math.round((s.counters.sick ?? 0) / 3));
  s = cancelEvents(s, 'halcyonOutbreak');
  r.push(by === 'colony' ? comms('marr', 'marrDosesArrive') : say('medical', 'cureDelivered', { exposed: s.flags.exposed ? 1 : 0 }));
  return s;
}

// ----------------------------------------------------------------- Sabeth ---

function steer(s: WorldState, id: ShipId, nav: Partial<NavGoal> | null): WorldState {
  if (!nav) return s.ships[id].nav ? patchShip(s, id, { nav: { intent: 'allStop', target: null, second: null, rangeKm: null, speedFactor: 1, offset: null, orderId: null, reached: false, startedTurn: s.turn } }) : s;
  const cur = s.ships[id].nav;
  if (cur && cur.intent === nav.intent && cur.target === nav.target && cur.rangeKm === nav.rangeKm) return s;
  return patchShip(s, id, { nav: { intent: 'approach', target: null, second: null, rangeKm: null, speedFactor: 1, offset: null, orderId: null, reached: false, startedTurn: s.turn, ...nav } });
}

export function stopLiner(s: WorldState): WorldState {
  s = setMemory(s, 'sabeth', 'running', 0);
  return steer(s, 'kestrel', null);
}

function sabethAgent(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  const k = s.ships.kestrel;
  const sab = s.characters.sabeth;
  if (!linerAlive(s) || k.souls === 0 || sab.status === 'dead' || sab.ship !== 'kestrel') return s;
  const towed = s.ships.halcyon.tractor.target === 'kestrel';
  if (towed) {
    if (sab.memory.running) s = stopLiner(s);
    if (!sab.memory.towNoted) {
      s = setMemory(s, 'sabeth', 'towNoted', 1);
      r.push(comms('sabeth', s.flags.sabethAcceptsTow ? 'sabethTowAccepted' : 'sabethTowProtest'));
    }
    return s;
  }
  const mem = () => s.characters.sabeth.memory;
  // Cleared to dock.
  if (lifted(s) && picketPresent(s)) {
    if (mem().running !== 2) {
      s = setMemory(s, 'sabeth', 'running', 2);
      r.push(comms('sabeth', 'sabethDocking'));
    }
    s = steer(s, 'kestrel', { intent: 'approach', target: 'cruiser', rangeKm: 2500 });
  } else if (!mem().running && !s.flags.cured && picketPresent(s)) {
    const runAt = mem().runAt ?? 99;
    if (s.turn === runAt - 2 && !mem().warned) {
      s = setMemory(s, 'sabeth', 'warned', 1);
      r.push(comms('sabeth', 'sabethWarning', { sick: s.counters.sick ?? 0, dead: s.counters.kestrelDead ?? 0 }));
    }
    if (s.turn >= runAt) {
      s = setMemory(s, 'sabeth', 'running', 1);
      s = setFlag(s, 'linerRan');
      s = steer(s, 'kestrel', { intent: 'approach', target: 'cruiser', rangeKm: 2500 });
      r.push(comms('sabeth', 'sabethRuns', { dead: s.counters.kestrelDead ?? 0 }));
    }
  }
  if (s.flags.cured && mem().running === 1 && !lifted(s)) {
    s = stopLiner(s);
    r.push(comms('sabeth', 'sabethStandsDown'));
  }
  if (picketPresent(s)) {
    const d = range(s, 'kestrel', 'cruiser');
    if (d <= LINE_KM && !s.flags.linerCrossed) {
      s = setFlag(s, 'linerCrossed');
      if (!lifted(s)) r.push(say('sensors', 'linerCrossed'));
    }
    if (d <= DOCK_KM && mem().running) s = setFlag(s, 'linerDocked');
  }
  return s;
}

// ------------------------------------------------------------------- Marr ---

function marrAgent(s: WorldState, rng: Rng, r: Report[]): WorldState {
  const c = s.ships.cruiser;
  if (!picketPresent(s) || !c.detected) return s;
  const v = tallis(s);
  const mem = () => s.characters.marr.memory;
  // Badly hurt: she breaks off to the colony's defences.
  if (c.hull <= 35) {
    s = setFlag(s, 'cruiserGone');
    s = patchShip(s, 'cruiser', { detected: false, weapons: { state: 'safe', target: null }, nav: null });
    r.push(comms('marr', 'marrWithdraws'));
    return s;
  }
  // Attacked: she defends herself.
  // (Her hull and shields start at 80: any loss means the Halcyon's fire has hit her.)
  const hitByHalcyon = !!s.flags.shotsFired && s.ships.halcyon.weapons.target === 'cruiser' && (c.hull < 80 || c.shields.strength < 80);
  if (hitByHalcyon || mem().firing === 2) {
    if (mem().firing !== 2) r.push(comms('marr', 'marrReturnsFire'));
    s = setMemory(s, 'marr', 'firing', 2);
    if (range(s, 'cruiser', 'halcyon') <= 40000) s = picketFires(s, 'halcyon', 'beams', rng, r);
    return s;
  }
  if (lifted(s) || s.flags.cured) {
    if (c.weapons.state !== 'safe') s = patchShip(s, 'cruiser', { weapons: { state: 'safe', target: null }, disposition: 'neutral' });
    return s;
  }
  const inside = linerAlive(s) && s.ships.kestrel.souls > 0 && s.flags.linerCrossed && range(s, 'kestrel', 'cruiser') <= LINE_KM;
  if (!inside) {
    if (c.weapons.target === 'kestrel') {
      s = patchShip(s, 'cruiser', { weapons: { state: 'armed', target: null } });
      r.push(comms('marr', 'marrStandsDown'));
    }
    return s;
  }
  if (mem().holdFire) {
    if (!mem().holdNoted) {
      s = setMemory(s, 'marr', 'holdNoted', 1);
      r.push(comms('marr', 'marrHoldsFire'));
    }
    return s;
  }
  if (!mem().warned) {
    s = setMemory(s, 'marr', 'warned', 1);
    s = setFlag(s, 'cruiserLockedKestrel');
    s = patchShip(s, 'cruiser', { weapons: { state: 'locked', target: 'kestrel' }, disposition: 'hostile' });
    s = addTension(s, 15);
    r.push(comms('marr', 'marrWarnsLiner'));
    return s;
  }
  // A ship between her and the liner.
  if (s.flags.interposing && v.warden !== 'strict') {
    s = setMemory(s, 'marr', 'holdFire', 1);
    r.push(comms('marr', 'marrWontFireThroughYou'));
    return s;
  }
  if (v.warden === 'humane' && !mem().warningShot) {
    s = setMemory(s, 'marr', 'warningShot', 1);
    s = { ...s, fx: [...s.fx, { kind: 'beam', from: 'cruiser', to: 'kestrel' }] };
    r.push(comms('marr', 'marrWarningShot'));
    return s;
  }
  return picketFires(s, 'kestrel', v.warden === 'strict' ? 'torpedoes' : 'beams', rng, r);
}

function picketFires(s: WorldState, target: ShipId, weapon: 'beams' | 'torpedoes', rng: Rng, r: Report[]): WorldState {
  let actual = target;
  if (target === 'kestrel' && s.flags.interposing && !s.ships.halcyon.destroyed) {
    actual = 'halcyon';
    r.push(say('tactical', 'interposeTookHit'));
  }
  const protectedBy = actual === 'kestrel' && (s.counters.shieldExtendUntil ?? -1) >= s.turn ? 'shieldExtend' : (s.counters.tractorShieldUntil ?? -1) >= s.turn ? 'tractorShield' : null;
  s = setFlag(s, 'cruiserFired');
  s = setMemory(s, 'marr', 'firing', Math.max(1, s.characters.marr.memory.firing ?? 0));
  s = addTension(s, 10);
  const res = resolveAttack(s, 'cruiser', actual, weapon, rng, { protectedBy });
  s = res.state;
  r.push(say('tactical', res.hit ? (protectedBy ? 'picketHitDeflected' : 'picketHit') : 'picketMissed', { target: s.ships[actual].name, damage: res.hullDamage, weapon }));
  r.push(...res.reports);
  return s;
}

// ----------------------------------------------------------------- events ---

function resolveEvents(s: WorldState, rng: Rng, r: Report[]): WorldState {
  const due = s.pending.filter((e) => e.dueTurn <= s.turn);
  if (!due.length) return s;
  s = { ...s, pending: s.pending.filter((e) => e.dueTurn > s.turn) };
  for (const e of due) s = handleEvent(s, e, rng, r);
  return s;
}

function handleEvent(s: WorldState, e: PendingEvent, _rng: Rng, r: Report[]): WorldState {
  const v = tallis(s);
  switch (e.kind) {
    case 'diagnosis':
      if (!linerAlive(s)) return s;
      s = revealFact(s, 'cause_known');
      s = revealFact(s, 'liner_status');
      r.push(say('medical', `diagnosis_${v.cause}`));
      if (v.cause === 'fever') s = startCure(s, r);
      return s;
    case 'colonyDoses':
      if (!linerAlive(s) || s.flags.cured) return s;
      return cure(s, 'colony', r);
    case 'halcyonOutbreak':
      if (!exposurePending(s)) return s;
      s = setFlag(s, 'halcyonOutbreak');
      r.push(say('medical', 'halcyonOutbreak'));
      return s;
  }
  return s;
}

export { destroyShip };
