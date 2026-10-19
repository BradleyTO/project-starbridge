/**
 * Validator: checks a ProposedAction against ship systems, power, range,
 * knowledge and preconditions. Pure; never changes state.
 *
 *   accepted  — apply as proposed
 *   partial   — apply the adjusted action (reasons explain the adjustment)
 *   rejected  — nothing happens (reasons explain why, in character)
 */
import type { ProposedAction } from './schema';
import type { Report } from './report';
import { say, sys } from './report';
import type { ShipId, WorldState } from './types';
import { weaponRange } from './combat';
import { TRACTOR_RANGE, efficiency, km, range, systemLabel, transportRange, usable } from './rules';
import { knows } from './state';

export interface Validation {
  status: 'accepted' | 'partial' | 'rejected';
  action: ProposedAction;
  reasons: Report[];
  /** Does this action consume a turn (60 s)? */
  timeCost: 0 | 1;
}

const ok = (action: ProposedAction, timeCost: 0 | 1, reasons: Report[] = []): Validation => ({ status: 'accepted', action, reasons, timeCost });
const partial = (action: ProposedAction, timeCost: 0 | 1, reasons: Report[]): Validation => ({ status: 'partial', action, reasons, timeCost });
const no = (action: ProposedAction, reasons: Report[]): Validation => ({ status: 'rejected', action, reasons, timeCost: 0 });

function present(s: WorldState, id: ShipId): boolean {
  const sh = s.ships[id];
  return sh.detected && !sh.destroyed && !(id === 'cruiser' && s.flags.cruiserGone);
}

export function validate(s: WorldState, action: ProposedAction): Validation {
  const h = s.ships.halcyon;
  if (s.outcome) return no(action, [sys('simEnded')]);
  if (h.destroyed) return no(action, [sys('shipLost')]);

  switch (action.type) {
    case 'query':
      return ok(action, 0);

    case 'setAlert':
      if (s.alert === action.level) return no(action, [say('xo', 'alreadyAlert', { level: action.level })]);
      return ok(action, 0);

    case 'shields':
      if (action.raise) {
        if (!usable(h, 'shields')) return no(action, [say('tactical', 'systemUnavailable', { system: 'shields', status: h.systems.shields.status })]);
        if (h.shields.raised) return no(action, [say('tactical', 'shieldsAlready', { state: 'up' })]);
        if (h.shields.strength <= 0) return no(action, [say('tactical', 'shieldsDepleted')]);
      } else if (!h.shields.raised) return no(action, [say('tactical', 'shieldsAlready', { state: 'down' })]);
      return ok(action, 0);

    case 'scan': {
      if (!usable(h, 'sensors', 0.1)) return no(action, [say('sensors', 'systemUnavailable', { system: 'sensors', status: h.systems.sensors.status })]);
      if (action.target === 'area' || action.target === 'halcyon') return ok(action, action.target === 'halcyon' ? 0 : 1);
      if (action.target === 'compartment') {
        if (!knows(s, 'compartment_exists')) return no(action, [say('sensors', 'noCompartmentKnown')]);
        if (s.ships.kestrel.destroyed) return no(action, [say('sensors', 'targetDestroyed', { ship: 'Kestrel' })]);
        return ok(action, 1);
      }
      if (!present(s, action.target)) return no(action, [say('sensors', 'noContact', { target: action.target })]);
      return ok(action, 1);
    }

    case 'communicate': {
      if (!usable(h, 'comms', 0.1)) return no(action, [say('comms', 'systemUnavailable', { system: 'communications', status: h.systems.comms.status })]);
      if (action.target === 'passenger') {
        const p = s.characters.passenger;
        if (!knows(s, 'passenger_identity')) return no(action, [say('comms', 'unknownPassenger')]);
        if (p.status === 'dead') return no(action, [say('xo', 'passengerDead', { name: p.name })]);
        if (p.status === 'stasis') return no(action, [say('comms', 'passengerStasis', { name: p.name })]);
        return ok(action, 1);
      }
      if (action.target === 'kestrel') {
        const arden = s.characters.arden;
        if (arden.status === 'dead') return no(action, [say('comms', 'nobodyAnswers', { ship: 'Kestrel' })]);
        if (arden.ship === 'kestrel' && s.ships.kestrel.systems.comms.health <= 0) return no(action, [say('comms', 'nobodyAnswers', { ship: 'Kestrel' })]);
        return ok(action, 1);
      }
      if (!present(s, 'cruiser')) return no(action, [say('comms', 'noContact', { target: 'cruiser' })]);
      if (action.intent === 'trade' && action.offer === 'passenger' && !knows(s, 'passenger_identity'))
        return no(action, [say('xo', 'cannotOfferUnknown')]);
      return ok(action, 1);
    }

    case 'move': {
      if (action.mode === 'hold') return ok(action, 0);
      if (!usable(h, 'engines', 0.1)) return no(action, [say('helm', 'systemUnavailable', { system: 'impulse engines', status: h.systems.engines.status })]);
      if (action.mode === 'evasive') return ok(action, 1);
      if (action.mode === 'interpose') {
        if (!present(s, 'kestrel') || !present(s, 'cruiser')) return no(action, [say('helm', 'cannotInterpose')]);
        return ok(action, 1);
      }
      const target = action.target;
      if (!target) return no(action, [say('helm', 'needTarget')]);
      if (!present(s, target)) return no(action, [say('helm', 'noContact', { target })]);
      if (action.mode === 'range') {
        const want = action.rangeKm ?? 10000;
        const min = target === 'cruiser' ? 2000 : 500;
        if (want < min) return partial({ ...action, rangeKm: min }, 1, [say('helm', 'rangeClamped', { km: km(min) })]);
      }
      return ok(action, 1);
    }

    case 'power': {
      const { to, from } = action;
      if (!to && !from) return no(action, [say('engineering', 'powerWhich')]);
      if (to === 'reactor' || from === 'reactor') return no(action, [say('engineering', 'powerReactor')]);
      if (to && from && to === from) return no(action, [say('engineering', 'powerSame')]);
      if (to && h.systems[to].health <= 0) return no(action, [say('engineering', 'powerDestroyed', { system: systemLabel(to) })]);
      if (to && h.systems[to].power >= 150) return no(action, [say('engineering', 'powerMaxed', { system: systemLabel(to) })]);
      let amount = action.amount;
      const reasons: Report[] = [];
      if (to) amount = Math.min(amount, 150 - h.systems[to].power);
      if (from) {
        if (h.systems[from].power <= 0) return no(action, [say('engineering', 'powerEmpty', { system: systemLabel(from) })]);
        amount = Math.min(amount, h.systems[from].power);
      }
      if (amount !== action.amount) {
        reasons.push(say('engineering', 'powerAdjusted', { amount }));
        return partial({ ...action, amount }, 0, reasons);
      }
      return ok(action, 0);
    }

    case 'weapons': {
      if (action.mode === 'safe') return h.weapons.state === 'safe' ? no(action, [say('tactical', 'weaponsAlreadySafe')]) : ok(action, 0);
      if (!usable(h, 'weapons')) return no(action, [say('tactical', 'systemUnavailable', { system: 'weapons', status: h.systems.weapons.status })]);
      if (action.mode === 'arm') return h.weapons.state !== 'safe' ? no(action, [say('tactical', 'weaponsAlreadyArmed')]) : ok(action, 0);
      const target = action.target;
      if (!target) return no(action, [say('tactical', 'needTarget')]);
      if (!present(s, target)) return no(action, [say('tactical', 'noContact', { target })]);
      if (target === 'kestrel' && s.ships.kestrel.souls > 0 && !action.warning)
        return no(action, [say('tactical', 'refuseCivilian', { souls: s.ships.kestrel.souls + (s.characters.passenger.ship === 'kestrel' ? 1 : 0) })]);
      if (action.mode === 'lock') {
        if (h.weapons.state === 'locked' && h.weapons.target === target) return no(action, [say('tactical', 'alreadyLocked')]);
        return ok(action, 0);
      }
      // fire
      const d = range(s, 'halcyon', target);
      if (action.weapon === 'torpedoes' && (s.counters.torpedoes ?? 0) <= 0) {
        if (d <= weaponRange('beams')) return partial({ ...action, weapon: 'beams' }, 1, [say('tactical', 'noTorpedoesUseBeams')]);
        return no(action, [say('tactical', 'noTorpedoes')]);
      }
      if (d > weaponRange(action.weapon)) {
        if (action.weapon === 'beams' && d <= weaponRange('torpedoes') && (s.counters.torpedoes ?? 0) > 0)
          return partial({ ...action, weapon: 'torpedoes' }, 1, [say('tactical', 'outOfBeamRangeUseTorpedoes', { km: km(d) })]);
        return no(action, [say('tactical', 'outOfRange', { km: km(d), weapon: action.weapon })]);
      }
      return ok(action, 1);
    }

    case 'tractor': {
      if (!action.engage) return h.tractor.target ? ok(action, 0) : no(action, [say('helm', 'tractorAlreadyOff')]);
      if (!usable(h, 'tractor', 0.3)) return no(action, [say('helm', 'systemUnavailable', { system: 'tractor beam', status: h.systems.tractor.status })]);
      const target = action.target ?? 'kestrel';
      if (!present(s, target)) return no(action, [say('helm', 'noContact', { target })]);
      if (h.tractor.target === target) return no(action, [say('helm', 'tractorAlready')]);
      const d = range(s, 'halcyon', target);
      if (d > TRACTOR_RANGE) return no(action, [say('helm', 'tractorRange', { km: km(d), need: km(TRACTOR_RANGE) })]);
      return ok({ ...action, target }, 0);
    }

    case 'transport': {
      if (!usable(h, 'transporter', 0.2)) return no(action, [say('xo', 'systemUnavailable', { system: 'transporter', status: h.systems.transporter.status })]);
      const k = s.ships.kestrel;
      if (k.destroyed) return no(action, [say('xo', 'targetDestroyed', { ship: 'Kestrel' })]);
      const tr = transportRange(s);
      const d = range(s, 'halcyon', 'kestrel');
      if (d > tr) return no(action, [say('xo', 'transportRange', { km: km(d), need: km(tr) })]);
      if (h.shields.raised) return no(action, [say('xo', 'transportShields')]);
      switch (action.payload) {
        case 'crew':
          if (k.souls <= 0) return no(action, [say('xo', 'kestrelEmpty')]);
          if (k.souls - (s.counters.trapped ?? 0) <= 0) return no(action, [say('xo', 'crewTrapped', { n: s.counters.trapped })]);
          return ok(action, 1);
        case 'passenger': {
          const p = s.characters.passenger;
          if (!knows(s, 'compartment_exists') && !knows(s, 'passenger_identity')) return no(action, [say('xo', 'unknownPassenger')]);
          if (p.status === 'dead') return no(action, [say('xo', 'passengerDead', { name: p.name })]);
          if (p.ship !== 'kestrel') return no(action, [say('xo', 'passengerAlreadyMoved')]);
          if (!s.flags.compartmentOpen && s.characters.arden.trust < 30) return no(action, [say('xo', 'compartmentShielded')]);
          return ok(action, 1);
        }
        case 'cargo':
          if ((s.counters.cargo ?? 0) <= 0) return no(action, [say('xo', 'noCargo')]);
          return ok(action, 1);
        case 'rescueTeam':
          if ((s.counters.trapped ?? 0) <= 0) return no(action, [say('xo', 'noneTrapped')]);
          return ok(action, 1);
        case 'medicalTeam':
          if (k.souls <= 0) return no(action, [say('medical', 'kestrelEmpty')]);
          return ok(action, 1);
      }
      return no(action, []);
    }

    case 'repair': {
      if (action.ship === 'kestrel') {
        const k = s.ships.kestrel;
        if (k.destroyed) return no(action, [say('engineering', 'targetDestroyed', { ship: 'Kestrel' })]);
        if (action.system !== 'reactor') return no(action, [say('engineering', 'kestrelRepairScope')]);
        if (s.flags.kestrelStable) return no(action, [say('engineering', 'kestrelAlreadyStable')]);
        if (!usable(h, 'transporter', 0.2)) return no(action, [say('engineering', 'systemUnavailable', { system: 'transporter', status: h.systems.transporter.status })]);
        const d = range(s, 'halcyon', 'kestrel');
        if (d > transportRange(s)) return no(action, [say('engineering', 'teamRange', { km: km(d) })]);
        if (h.shields.raised) return no(action, [say('engineering', 'teamShields')]);
        return ok(action, 1);
      }
      const st = h.systems[action.system];
      if (st.health <= 0) return no(action, [say('engineering', 'beyondRepair', { system: systemLabel(action.system) })]);
      if (st.health >= 100) return no(action, [say('engineering', 'noRepairNeeded', { system: systemLabel(action.system) })]);
      return ok(action, 1);
    }

    case 'jump': {
      if (!usable(h, 'jumpDrive', 0.2)) {
        if (action.mode === 'withdraw' && usable(h, 'engines', 0.1))
          return partial({ type: 'move', mode: 'away', target: present(s, 'cruiser') ? 'cruiser' : 'kestrel' }, 1, [say('helm', 'jumpDownImpulseOnly')]);
        return no(action, [say('helm', 'systemUnavailable', { system: 'jump drive', status: h.systems.jumpDrive.status })]);
      }
      if (action.mode === 'charge') return h.jump.charge >= 100 ? no(action, [say('helm', 'jumpReadyAlready')]) : ok(action, 0);
      if (h.jump.charge >= 100) return ok({ ...action, mode: 'engage' }, 1);
      return action.mode === 'withdraw' ? ok(action, 1) : partial({ ...action, mode: 'withdraw' }, 1, [say('helm', 'jumpNotReady', { charge: Math.round(h.jump.charge) })]);
    }

    case 'improvise': {
      const m = action.method;
      if (m === 'tractorShield' && !usable(h, 'tractor', 0.3)) return no(action, [say('engineering', 'systemUnavailable', { system: 'tractor beam', status: h.systems.tractor.status })]);
      if (m === 'plasmaVent' && h.systems.engines.health < 20) return no(action, [say('engineering', 'ventTooDamaged')]);
      if (m === 'sensorGhost' && !usable(h, 'sensors', 0.3)) return no(action, [say('sensors', 'systemUnavailable', { system: 'sensors', status: h.systems.sensors.status })]);
      if (m === 'shieldExtend') {
        if (!usable(h, 'shields', 0.3)) return no(action, [say('tactical', 'systemUnavailable', { system: 'shields', status: h.systems.shields.status })]);
        if (s.ships.kestrel.destroyed) return no(action, [say('tactical', 'targetDestroyed', { ship: 'Kestrel' })]);
        const d = range(s, 'halcyon', 'kestrel');
        if (d > 2500) return no(action, [say('tactical', 'extendRange', { km: km(d) })]);
      }
      if (m === 'ejectCore') {
        const k = s.ships.kestrel;
        if (k.destroyed) return no(action, [say('engineering', 'targetDestroyed', { ship: 'Kestrel' })]);
        if (s.flags.kestrelStable) return no(action, [say('engineering', 'kestrelAlreadyStable')]);
        const d = range(s, 'halcyon', 'kestrel');
        if (d > transportRange(s)) return no(action, [say('engineering', 'teamRange', { km: km(d) })]);
        if (h.shields.raised) return no(action, [say('engineering', 'teamShields')]);
      }
      if (m === 'other') return partial(action, 1, [say('xo', 'improviseUnclear')]);
      return ok(action, 1);
    }

    case 'wait':
      return ok(action, 1);
  }
}

/** Helper for UIs/tests: the efficiency of a Halcyon system as a 0–100 percentage. */
export function systemPercent(s: WorldState, id: Parameters<typeof efficiency>[1]): number {
  return Math.round(efficiency(s.ships.halcyon, id) * 100);
}
