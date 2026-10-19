/**
 * Reducer: applies one VALIDATED action to the world. Pure: returns a new
 * state plus structured Reports for the narrator. Scenario-specific meaning
 * (what a scan reveals, how an NPC reacts to words, how an improvised tactic
 * plays out) is delegated to ScenarioHooks.
 */
import type { ProposedAction } from './schema';
import type { Rng } from './rng';
import type { Report } from './report';
import { say } from './report';
import type { ShipId, SystemId, WorldState } from './types';
import { resolveAttack } from './combat';
import { clamp, efficiency, km, range, systemLabel } from './rules';
import { addTension, adjustTrust, knows, patchCharacter, patchShip, patchSystem, setCounter, setFlag } from './state';

export interface Applied {
  state: WorldState;
  reports: Report[];
}

export interface ScenarioHooks {
  scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon', rng: Rng): Applied;
  communicate(s: WorldState, action: Extract<ProposedAction, { type: 'communicate' }>, rng: Rng): Applied;
  improvise(s: WorldState, action: Extract<ProposedAction, { type: 'improvise' }>, rng: Rng): Applied;
  query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied;
}

const DONOR_ORDER: SystemId[] = ['weapons', 'tractor', 'sensors', 'transporter', 'jumpDrive', 'comms'];

export function applyAction(s: WorldState, action: ProposedAction, rng: Rng, hooks: ScenarioHooks): Applied {
  const reports: Report[] = [];
  const h = s.ships.halcyon;

  switch (action.type) {
    case 'query':
      return hooks.query(s, action.topic);

    case 'setAlert': {
      s = { ...s, alert: action.level };
      if (action.level === 'red' && !h.shields.raised && efficiency(h, 'shields') > 0 && h.shields.strength > 0) {
        s = patchShip(s, 'halcyon', { shields: { ...h.shields, raised: true } });
        reports.push(say('tactical', 'redAlert'));
      } else if (action.level === 'green') {
        s = patchShip(s, 'halcyon', { shields: { ...h.shields, raised: false }, weapons: { state: 'safe', target: null } });
        reports.push(say('xo', 'standDown'));
      } else reports.push(say('xo', 'alertSet', { level: action.level }));
      return { state: s, reports };
    }

    case 'shields':
      s = patchShip(s, 'halcyon', { shields: { ...h.shields, raised: action.raise } });
      return { state: s, reports: [say('tactical', action.raise ? 'shieldsUp' : 'shieldsDown', { strength: h.shields.strength })] };

    case 'scan':
      return hooks.scan(s, action.target, rng);

    case 'communicate':
      return hooks.communicate(s, action, rng);

    case 'move': {
      if (action.mode === 'hold') {
        s = { ...s, orders: { ...s.orders, helm: null } };
        return { state: s, reports: [say('helm', 'holding')] };
      }
      if (action.mode === 'evasive') {
        s = setCounter(s, 'evasive_halcyon', s.turn + 1);
        return { state: s, reports: [say('helm', 'evasive')] };
      }
      const target: ShipId | null = action.mode === 'interpose' ? 'kestrel' : (action.target ?? null);
      s = { ...s, orders: { ...s.orders, helm: { mode: action.mode, target, rangeKm: action.rangeKm ?? null } } };
      const vars: Record<string, string | number> = { target: target ? s.ships[target].name : '', km: action.rangeKm ? km(action.rangeKm) : '', now: target ? km(range(s, 'halcyon', target)) : '' };
      return { state: s, reports: [say('helm', `helm_${action.mode}`, vars)] };
    }

    case 'power': {
      const { to } = action;
      let from = action.from;
      let amount = action.amount;
      if (to && !from) from = DONOR_ORDER.find((d) => d !== to && h.systems[d].power >= amount && !(d === 'weapons' && h.weapons.state !== 'safe')) ?? DONOR_ORDER.find((d) => d !== to && h.systems[d].power > 0);
      if (from) amount = Math.min(amount, h.systems[from].power);
      if (from) s = patchSystem(s, 'halcyon', from, { power: h.systems[from].power - amount });
      if (to) s = patchSystem(s, 'halcyon', to, { power: h.systems[to].power + amount });
      return {
        state: s,
        reports: [say('engineering', 'powerShift', { amount, to: to ? systemLabel(to) : 'reserve', from: from ? systemLabel(from) : 'reserve', toPct: to ? s.ships.halcyon.systems[to].power : 0 })],
      };
    }

    case 'weapons': {
      if (action.mode === 'safe') {
        s = patchShip(s, 'halcyon', { weapons: { state: 'safe', target: null } });
        return { state: s, reports: [say('tactical', 'weaponsSafe')] };
      }
      if (action.mode === 'arm') {
        s = patchShip(s, 'halcyon', { weapons: { state: 'armed', target: null } });
        return { state: s, reports: [say('tactical', 'weaponsArmed')] };
      }
      const target = action.target!;
      if (action.mode === 'lock') {
        s = patchShip(s, 'halcyon', { weapons: { state: 'locked', target } });
        if (target === 'cruiser') {
          s = setFlag(s, 'lockedOnCruiser');
          s = setCounter(s, 'lockedOnCruiserTurn', s.turn);
          s = addTension(s, 12);
          s = patchShip(s, 'cruiser', { disposition: 'hostile' });
        }
        return { state: s, reports: [say('tactical', 'weaponsLocked', { target: s.ships[target].name })] };
      }
      // fire
      s = patchShip(s, 'halcyon', { weapons: { state: 'locked', target } });
      s = setFlag(s, 'shotsFired');
      s = setCounter(s, 'playerFiredTurn', s.turn + 1);
      if (action.warning) {
        s = addTension(s, 10);
        s = { ...s, fx: [...s.fx, { kind: 'beam', from: 'halcyon', to: target }] };
        return { state: s, reports: [say('tactical', 'warningShot', { target: s.ships[target].name })] };
      }
      if (action.weapon === 'torpedoes') s = setCounter(s, 'torpedoes', Math.max(0, (s.counters.torpedoes ?? 0) - 1));
      const aim = target === 'cruiser' && knows(s, 'cruiser_weakness');
      s = addTension(s, 25);
      if (target === 'cruiser') s = patchShip(s, 'cruiser', { disposition: 'hostile' });
      const r = resolveAttack(s, 'halcyon', target, action.weapon, rng, { aimAtWeakness: aim });
      reports.push(say('tactical', r.hit ? (aim && action.weapon === 'torpedoes' ? 'hitWeakness' : 'hit') : 'miss', { target: s.ships[target].name, weapon: action.weapon, damage: r.hullDamage, torps: r.state.counters.torpedoes ?? 0, shields: r.state.ships[target].shields.strength }));
      return { state: r.state, reports: [...reports, ...r.reports] };
    }

    case 'tractor': {
      if (!action.engage) {
        s = patchShip(s, 'halcyon', { tractor: { target: null } });
        return { state: s, reports: [say('helm', 'tractorReleased')] };
      }
      const target = action.target ?? 'kestrel';
      s = patchShip(s, 'halcyon', { tractor: { target } });
      if (target === 'cruiser') s = addTension(s, 8);
      return { state: s, reports: [say('helm', target === 'kestrel' ? 'tractorKestrel' : 'tractorCruiser')] };
    }

    case 'transport':
      return transport(s, action, rng);

    case 'repair': {
      if (action.ship === 'kestrel') {
        const chance = 0.6 + (s.ships.kestrel.containment > 15 ? 0.15 : 0) - (s.variant.complication === 'coolantLeak' ? 0.15 : 0);
        s = adjustTrust(s, 'arden', 10);
        if (rng.next() < chance) {
          s = setFlag(s, 'kestrelStable');
          s = patchShip(s, 'kestrel', (k) => ({ containment: Math.max(k.containment, 20) }));
          return { state: s, reports: [say('engineering', 'kestrelStabilised')] };
        }
        s = patchShip(s, 'kestrel', (k) => ({ containment: clamp(k.containment - 4, 0, 100) }));
        return { state: s, reports: [say('engineering', 'kestrelStabiliseFailed', { containment: s.ships.kestrel.containment })] };
      }
      const cur = h.systems[action.system].health;
      const gain = rng.int(15, 25);
      s = patchSystem(s, 'halcyon', action.system, { health: Math.min(100, cur + gain) });
      return { state: s, reports: [say('engineering', 'repaired', { system: systemLabel(action.system), health: s.ships.halcyon.systems[action.system].health })] };
    }

    case 'jump': {
      if (action.mode === 'charge') {
        s = { ...s, orders: { ...s.orders, jumpCharging: true } };
        return { state: s, reports: [say('helm', 'jumpCharging', { charge: Math.round(h.jump.charge) })] };
      }
      if (action.mode === 'engage') {
        const towing = h.tractor.target === 'kestrel' && efficiency(h, 'tractor') >= 0.5 && !s.ships.kestrel.destroyed;
        s = setFlag(s, 'jumped');
        if (towing) s = setFlag(s, 'kestrelTowedOut');
        s = { ...s, orders: { helm: null, jumpCharging: false } };
        return { state: s, reports: [say('helm', towing ? 'jumpWithKestrel' : 'jumpEngaged')] };
      }
      // withdraw: start charging and open the range
      const threat: ShipId = s.ships.cruiser.detected && !s.ships.cruiser.destroyed && !s.flags.cruiserGone ? 'cruiser' : 'kestrel';
      s = { ...s, orders: { jumpCharging: true, helm: { mode: 'away', target: threat, rangeKm: null } } };
      return { state: s, reports: [say('helm', 'withdrawing', { charge: Math.round(h.jump.charge) })] };
    }

    case 'improvise':
      return hooks.improvise(s, action, rng);

    case 'wait':
      return { state: s, reports: [say('xo', 'waiting')] };
  }
}

function transport(s: WorldState, action: Extract<ProposedAction, { type: 'transport' }>, rng: Rng): Applied {
  const reports: Report[] = [];
  const h = s.ships.halcyon;
  const k = s.ships.kestrel;
  s = { ...s, fx: [...s.fx, { kind: 'transport', from: 'kestrel', to: 'halcyon' }] };
  const cruiserWatching = () =>
    s.ships.cruiser.detected && !s.ships.cruiser.destroyed && !s.flags.cruiserGone && range(s, 'cruiser', 'kestrel') <= 80000 && (s.counters.smokescreenUntil ?? -1) < s.turn + 1;

  switch (action.payload) {
    case 'crew': {
      const capacity = Math.max(5, Math.round(25 * efficiency(h, 'transporter')));
      const movable = k.souls - (s.counters.trapped ?? 0);
      const moved = Math.min(capacity, movable);
      s = patchShip(s, 'kestrel', { souls: k.souls - moved });
      s = patchShip(s, 'halcyon', { souls: h.souls + moved });
      s = setCounter(s, 'rescued', (s.counters.rescued ?? 0) + moved);
      s = adjustTrust(s, 'arden', 15);
      const left = s.ships.kestrel.souls;
      if (left - (s.counters.trapped ?? 0) <= 0 && s.characters.arden.ship === 'kestrel' && left === 0) s = patchCharacter(s, 'arden', { ship: 'halcyon' });
      if (left === 0) s = patchShip(s, 'kestrel', { disposition: 'evacuated' });
      reports.push(say('xo', left === 0 ? 'evacComplete' : 'evacPartial', { moved, left, trapped: s.counters.trapped ?? 0 }));
      return { state: s, reports };
    }
    case 'passenger': {
      const watched = cruiserWatching();
      s = patchCharacter(s, 'passenger', (p) => ({ ship: 'halcyon', status: 'active', memory: { ...p.memory, awake: 1 } }));
      s = setFlag(s, 'passengerAboard');
      if (watched) s = setFlag(s, 'vaneSawPassengerMoved');
      reports.push(say('xo', 'passengerAboard', { name: s.characters.passenger.name, watched: watched ? 1 : 0 }));
      return { state: s, reports };
    }
    case 'cargo':
      s = setCounter(s, 'cargo', 0);
      s = setFlag(s, 'cargoAboard');
      return { state: s, reports: [say('xo', 'cargoAboard')] };
    case 'rescueTeam': {
      const ok = rng.next() < 0.85;
      if (ok) s = setCounter(s, 'trapped', 0);
      return { state: s, reports: [say('xo', ok ? 'trappedFreed' : 'trappedNotYet')] };
    }
    case 'medicalTeam':
      s = adjustTrust(s, 'arden', 10);
      s = setFlag(s, 'medicalSent');
      return { state: s, reports: [say('medical', 'medicalTeam')] };
  }
}

