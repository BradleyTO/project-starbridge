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
import { COMMS_SECONDS, channelOf, commsOf, openChannel } from './comms';
import { dot, effectivePerf, len, sub } from './kinematics';
import { assessFire } from './roe';
import { bridgeSeconds } from './bridge';

export interface Validation {
  status: 'accepted' | 'partial' | 'rejected';
  action: ProposedAction;
  reasons: Report[];
  /** Does this action consume a turn (60 s)? */
  timeCost: 0 | 1;
  /** v0.5: sub-minute time cost in seconds (dialogue, hails, channel operations). */
  seconds?: number;
  /** The order is already satisfied (e.g. "keep shields down" while they are down): confirm, change nothing. */
  noop?: boolean;
  /** v0.5: an officer refused on principle; recorded so "why?" can be answered. */
  refusal?: { officer: 'tactical' | 'helm' | 'xo' | 'comms' | 'sensors' | 'engineering' | 'medical'; order: string; reasons: string[] };
}
const confirm = (action: ProposedAction, reasons: Report[]): Validation => ({ status: 'accepted', action, reasons, timeCost: 0, noop: true });

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
        if (h.shields.raised) return confirm(action, [say('tactical', 'shieldsAlready', { state: 'up' })]);
        if (h.shields.strength <= 0) return no(action, [say('tactical', 'shieldsDepleted')]);
      } else if (!h.shields.raised) return confirm(action, [say('tactical', 'shieldsAlready', { state: 'down' })]);
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
      const talk = (a: ProposedAction): Validation => ({ status: 'accepted', action: a, reasons: [], timeCost: 0, seconds: action.intent === 'open' ? COMMS_SECONDS.hail : COMMS_SECONDS.legacyMessage });
      if (!usable(h, 'comms', 0.1)) return no(action, [say('comms', 'systemUnavailable', { system: 'communications', status: h.systems.comms.status })]);
      if (action.target === 'passenger') {
        const p = s.characters.passenger;
        if (!knows(s, 'passenger_identity')) return no(action, [say('comms', 'unknownPassenger')]);
        if (p.status === 'dead') return no(action, [say('xo', 'passengerDead', { name: p.name })]);
        if (p.status === 'stasis') return no(action, [say('comms', 'passengerStasis', { name: p.name })]);
        return talk(action);
      }
      if (action.target === 'all') {
        const reachable = (['kestrel', 'cruiser'] as const).filter((t) => validate(s, { ...action, target: t }).status !== 'rejected');
        if (!reachable.length) return no(action, [say('comms', 'nobodyToHail')]);
        return talk(action);
      }
      // v0.5: on the idle bridge the contact slot is empty unless first contact is under way.
      if (s.scenarioId === 'bridge' && !s.ships[action.target].detected) return no(action, [say('comms', 'bridgeNobodyToHail')]);
      if (action.target === 'kestrel') {
        const arden = s.characters.arden;
        if (arden.status === 'dead') return no(action, [say('comms', 'nobodyAnswers', { ship: 'Kestrel' })]);
        if (arden.ship === 'kestrel' && s.ships.kestrel.systems.comms.health <= 0) return no(action, [say('comms', 'nobodyAnswers', { ship: 'Kestrel' })]);
        return talk(action);
      }
      if (!present(s, 'cruiser')) return no(action, [say('comms', 'noContact', { target: 'cruiser' })]);
      if (action.intent === 'trade' && action.offer === 'passenger' && !knows(s, 'passenger_identity'))
        return no(action, [say('xo', 'cannotOfferUnknown')]);
      return talk(action);
    }

    case 'speak': {
      if (!usable(h, 'comms', 0.1)) return no(action, [say('comms', 'systemUnavailable', { system: 'communications', status: h.systems.comms.status })]);
      const v = validate(s, { type: 'communicate', target: action.to, intent: 'ask', onScreen: false });
      if (v.status === 'rejected') return v.reasons.length ? { ...v, action } : no(action, [say('comms', 'noChannel')]);
      return { status: 'accepted', action, reasons: [], timeCost: 0, seconds: action.relayed ? COMMS_SECONDS.relay : COMMS_SECONDS.speak };
    }

    case 'channel': {
      const c = commsOf(s);
      if (action.op === 'open') {
        if (!action.party) return no(action, [say('comms', 'channelWho')]);
        const v = validate(s, { type: 'communicate', target: action.party, intent: 'open', onScreen: false });
        return v.status === 'rejected' ? { ...v, action } : { status: 'accepted', action, reasons: [], timeCost: 0, seconds: COMMS_SECONDS.hail };
      }
      if (action.op === 'resume') {
        const held = action.party ? channelOf(s, action.party) : c.channels.find((x) => x.state === 'hold');
        if (!held) return no(action, [say('comms', 'noHeldChannel')]);
      } else if (action.op === 'unmute') {
        if (!c.channels.some((x) => x.state === 'muted')) return no(action, [say('comms', 'notMuted')]);
      } else {
        const target = action.party ? channelOf(s, action.party) : openChannel(s) ?? c.channels[0];
        if (!target) return no(action, [say('comms', 'noChannel')]);
      }
      return { status: 'accepted', action, reasons: [], timeCost: 0, seconds: COMMS_SECONDS.channelOp };
    }

    case 'maneuver': {
      const reasons: Report[] = [];
      if (action.intent === 'allStop' || (action.intent === 'holdStation' && !action.target)) return ok(action, 1);
      if (!usable(h, 'engines', 0.1)) return no(action, [say('helm', 'systemUnavailable', { system: 'impulse engines', status: h.systems.engines.status })]);
      if (action.intent === 'flee') return s.landmarks.border ? ok(action, 1) : no(action, [say('helm', 'noBorder')]);
      if (action.intent === 'evasive' || (action.intent === 'face' && !action.target)) return ok(action, 1);
      if (action.intent === 'interpose') {
        const a = action.target;
        const b = action.second;
        if (!a || !b || a === b) return no(action, [say('helm', 'cannotInterpose')]);
        for (const ref of [a, b]) {
          if (ref === 'border') continue;
          if (!present(s, ref)) return no(action, [say('helm', 'noContact', { target: ref })]);
        }
        return ok(action, 1);
      }
      const target = action.target;
      if (!target) return no(action, [say('helm', 'needTarget')]);
      if (target === 'border') return ok({ ...action, intent: 'flee', target: undefined }, 1);
      if (!present(s, target)) return no(action, [say('helm', 'noContact', { target })]);
      const min = target === 'cruiser' ? 2000 : 500;
      if (action.rangeKm !== undefined && action.rangeKm < min && action.intent !== 'retreat') {
        return partial({ ...action, rangeKm: min }, 1, [say('helm', 'rangeClamped', { km: km(min) })]);
      }
      // Feasibility: a faster target that is opening the range cannot be caught.
      if (action.intent === 'intercept' || action.intent === 'follow') {
        const t = s.ships[target];
        const perf = effectivePerf(s, 'halcyon');
        const opening = dot(sub(t.position, h.position), t.velocity) > 0;
        if (opening && len(t.velocity) > perf.maxSpeed * 1.05) reasons.push(say('helm', 'cannotCatch', { target: t.name, theirs: Math.round(len(t.velocity)), ours: Math.round(perf.maxSpeed) }));
      }
      if (s.posture.stance === 'nonHostile' && target === 'cruiser' && (action.intent === 'intercept' || action.intent === 'block'))
        reasons.push(say('xo', 'postureConflict'));
      return reasons.length ? { status: 'accepted', action, reasons, timeCost: 1 } : ok(action, 1);
    }

    case 'posture':
      return ok(action, 0);

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
      if (action.mode === 'safe') return h.weapons.state === 'safe' ? confirm(action, [say('tactical', 'weaponsAlreadySafe')]) : ok(action, 0);
      if (!usable(h, 'weapons')) return no(action, [say('tactical', 'systemUnavailable', { system: 'weapons', status: h.systems.weapons.status })]);
      if (action.mode === 'arm') return h.weapons.state !== 'safe' ? no(action, [say('tactical', 'weaponsAlreadyArmed')]) : ok(action, 0);
      const target = action.target;
      if (!target) return no(action, [say('tactical', 'needTarget')]);
      if (!present(s, target)) return no(action, [say('tactical', 'noContact', { target })]);
      // v0.5: rules of engagement from world conditions (civilian / life signs / threat / surrender).
      const roe = assessFire(s, target, { warning: action.warning });
      if (roe.refuse)
        return { ...no(action, [say('tactical', 'refuseCivilian', { souls: roe.souls, name: s.ships[target].name })]), refusal: { officer: 'tactical', order: action.mode === 'lock' ? `lock on the ${s.ships[target].name}` : `fire on the ${s.ships[target].name}`, reasons: roe.reasons } };
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
          return partial({ type: 'maneuver', intent: 'retreat', target: present(s, 'cruiser') ? 'cruiser' : 'kestrel', speed: 'full', persistent: false }, 1, [say('helm', 'jumpDownImpulseOnly')]);
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

    case 'bridge':
      return { ...ok(action, 0), seconds: bridgeSeconds(action) };

    case 'standing':
    case 'restrict':
    case 'learn':
      return validateStanding(s, action);
  }
}

/** Standing orders, prohibitions and taught phrases (applied in standing.ts / turn.ts). */
function validateStanding(s: WorldState, action: ProposedAction): Validation {
  const trig = action.type === 'standing' ? action.trigger : action.type === 'restrict' ? action.until : undefined;
  if (trig && trig.kind !== 'helmDone' && !present(s, trig.ship)) return no(action, [say('xo', 'standingNoShip', { ship: s.ships[trig.ship].name })]);
  if (action.type === 'standing' && trig?.kind === 'helmDone' && !s.ships.halcyon.nav) return no(action, [say('xo', 'standingNoHelm')]);
  return ok(action, 0);
}

/** Helper for UIs/tests: the efficiency of a Halcyon system as a 0–100 percentage. */
export function systemPercent(s: WorldState, id: Parameters<typeof efficiency>[1]): number {
  return Math.round(efficiency(s.ships.halcyon, id) * 100);
}
