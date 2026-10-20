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
import type { NavGoal, ShipId, SystemId, WorldState } from './types';
import { resolveAttack } from './combat';
import { clamp, efficiency, km, range, systemLabel } from './rules';
import { addOrder, getOrder, goalLabel, refName, updateOrder } from './orders';
import { estimateEta, guidanceFor, headingOf, sub } from './kinematics';
import { etaText, roundEta } from './motion';
import { addTension, adjustTrust, knows, patchCharacter, patchShip, patchSystem, setCounter, setFlag } from './state';
import type { DialogueProvider } from './dialogue';
import { channelOf, closeChannel, commsOf, declare, openChannel, openChannelTo, patchComms, recordLine, setChannelState } from './comms';
import { explainRefusal } from './roe';
import type { Party } from './schema';

export interface Applied {
  state: WorldState;
  reports: Report[];
}

export interface ScenarioHooks {
  scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon', rng: Rng): Applied;
  communicate(s: WorldState, action: Extract<ProposedAction, { type: 'communicate' }>, rng: Rng): Applied;
  improvise(s: WorldState, action: Extract<ProposedAction, { type: 'improvise' }>, rng: Rng): Applied;
  query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied;
  /** v0.5: two-way conversation on open channels (offline provider today; AI later). */
  dialogue?: DialogueProvider;
}

const names = (s: WorldState, d: DialogueProvider | undefined, party: Party) => ({ speaker: d?.speakerName(s, party) ?? party, vessel: d?.vesselName(s, party) ?? party });

/** Open a channel and let the other party answer (the comms officer reports it first). */
function hailParty(s: WorldState, party: Party, rng: Rng, hooks: ScenarioHooks, priv: boolean, reports: Report[]): WorldState {
  const d = hooks.dialogue;
  const cur = openChannel(s);
  if (cur?.party === party && (!priv || cur.private)) {
    reports.push(say('comms', 'channelAlreadyOpen', names(s, d, party)));
    return s;
  }
  const held = channelOf(s, party)?.state === 'hold';
  if (cur && cur.party !== party) reports.push(say('comms', 'channelHoldOther', names(s, d, cur.party)));
  s = openChannelTo(s, party, { private: priv });
  const at = reports.length;
  if (d && !held) {
    const g = d.greet(s, party, rng, { private: priv });
    s = g.state;
    reports.push(...g.reports);
  }
  // The comms officer announces who answered (named once they have identified themselves).
  reports.splice(at, 0, say('comms', held ? 'channelResumed' : priv ? 'channelOpenedPrivate' : 'channelOpened', names(s, d, party)));
  return s;
}

const DONOR_ORDER: SystemId[] = ['weapons', 'tractor', 'sensors', 'transporter', 'jumpDrive', 'comms'];

export function applyAction(s: WorldState, action: ProposedAction, rng: Rng, hooks: ScenarioHooks): Applied {
  const reports: Report[] = [];
  const h = s.ships.halcyon;

  switch (action.type) {
    case 'query':
      if (action.topic === 'why') return { state: s, reports: explainRefusal(s, action.officer) };
      return hooks.query(s, action.topic);

    case 'setAlert': {
      s = { ...s, alert: action.level };
      const holdDown = s.restrictions.some((r) => r.subject === 'raiseShields');
      const holdUp = s.restrictions.some((r) => r.subject === 'lowerShields');
      if (action.level === 'red' && !h.shields.raised && holdDown) {
        reports.push(say('tactical', 'redAlertShieldsHeld'));
      } else if (action.level === 'red' && !h.shields.raised && efficiency(h, 'shields') > 0 && h.shields.strength > 0) {
        s = patchShip(s, 'halcyon', { shields: { ...h.shields, raised: true } });
        reports.push(say('tactical', 'redAlert'));
      } else if (action.level === 'green') {
        s = patchShip(s, 'halcyon', { shields: { ...h.shields, raised: holdUp ? h.shields.raised : false }, weapons: { state: 'safe', target: null } });
        reports.push(say('xo', 'standDown'));
      } else reports.push(say('xo', 'alertSet', { level: action.level }));
      return { state: s, reports };
    }

    case 'shields':
      s = patchShip(s, 'halcyon', { shields: { ...h.shields, raised: action.raise } });
      return { state: s, reports: [say('tactical', action.raise ? 'shieldsUp' : 'shieldsDown', { strength: h.shields.strength })] };

    case 'scan':
      return hooks.scan(s, action.target, rng);

    case 'communicate': {
      // A declared non-hostile posture colours a plain hail: the channel opens with reassurance.
      const intent = action.intent === 'open' && s.posture.stance === 'nonHostile' ? 'reassure' : action.intent;
      const targets = action.target === 'all' ? (['kestrel', 'cruiser'] as const).filter((t) => commReachable(s, t)) : [action.target];
      if (action.onScreen) reports.push(say('comms', targets.length > 1 ? 'onScreenSplit' : 'onScreen'));
      const d = hooks.dialogue;
      for (const t of targets) {
        if (d && t !== 'passenger') {
          // v0.5: a hail opens a persistent session (the passenger is spoken to in person, no channel); a message to a closed channel opens one first.
          const was = openChannel(s)?.party === t;
          if (action.intent === 'open' && intent === 'open') {
            s = hailParty(s, t, rng, hooks, false, reports);
            continue;
          }
          if (!was) {
            if (openChannel(s)) reports.push(say('comms', 'channelHoldOther', names(s, d, openChannel(s)!.party)));
            s = openChannelTo(s, t);
            reports.push(say('comms', 'channelOpened', names(s, d, t)));
          }
          s = recordLine(s, { from: 'captain', intents: [intent === 'open' ? 'greet' : intent === 'reassure' ? 'declarePeaceful' : intent === 'warn' ? 'warn' : intent === 'ask' ? 'ask' : (intent as never)], text: intent });
          if (intent === 'reassure' || intent === 'humanitarian') s = declare(s, intent === 'humanitarian' ? 'rescue' : 'peaceful');
        }
        const r = hooks.communicate(s, { ...action, target: t, intent }, rng);
        s = r.state;
        reports.push(...r.reports);
      }
      // With two ships hailed at once the Prefect stays on the main channel; the Kestrel waits.
      if (d && targets.length > 1 && targets.includes('cruiser')) s = openChannelTo(s, 'cruiser');
      if (s.posture.stance !== 'neutral' && targets.includes('cruiser')) s = setCounter(s, 'postureHeardTurn', s.turn);
      return { state: s, reports };
    }

    case 'speak': {
      const d = hooks.dialogue;
      if (!d) return { state: s, reports: [say('comms', 'noDialogue')] };
      const ch = channelOf(s, action.to);
      if (ch?.state === 'muted') return { state: recordLine(s, { from: 'captain', intents: action.intents, text: action.text }), reports: [say('comms', 'mutedNoTransmit', names(s, d, action.to))] };
      if (!ch || ch.state === 'hold' || openChannel(s)?.party !== action.to) {
        const cur = openChannel(s);
        if (cur && cur.party !== action.to) reports.push(say('comms', 'channelHoldOther', names(s, d, cur.party)));
        reports.push(say('comms', ch ? 'channelResumed' : 'channelOpened', names(s, d, action.to)));
        s = openChannelTo(s, action.to);
      }
      if (action.relayed) reports.push(say('comms', 'relaying', names(s, d, action.to)));
      s = recordLine(s, { from: 'captain', intents: action.intents, text: action.text });
      if (action.to === 'cruiser' && (action.intents.includes('declarePeaceful') || action.intents.includes('humanitarian'))) s = setCounter(s, 'postureHeardTurn', s.turn);
      const r = d.respond(s, action, rng);
      return { state: r.state, reports: [...reports, ...r.reports] };
    }

    case 'channel': {
      const d = hooks.dialogue;
      const c = commsOf(s);
      const party = action.party ?? (action.op === 'resume' ? c.channels.find((x) => x.state === 'hold')?.party : (c.active ?? c.channels[0]?.party));
      if (!party) return { state: s, reports: [say('comms', 'noChannel')] };
      switch (action.op) {
        case 'open':
          return { state: hailParty(s, party, rng, hooks, action.private, reports), reports };
        case 'close':
          reports.push(say('comms', 'channelClosed', names(s, d, party)));
          return { state: closeChannel(s, party), reports };
        case 'hold':
          reports.push(say('comms', 'channelOnHold', names(s, d, party)));
          return { state: setChannelState(s, party, 'hold'), reports };
        case 'resume': {
          const cur = openChannel(s);
          if (cur && cur.party !== party) reports.push(say('comms', 'channelHoldOther', names(s, d, cur.party)));
          reports.push(say('comms', 'channelResumed', names(s, d, party)));
          return { state: openChannelTo(s, party), reports };
        }
        case 'mute':
          reports.push(say('comms', 'channelMuted', names(s, d, party)));
          return { state: setChannelState(s, party, 'muted'), reports };
        case 'unmute':
          reports.push(say('comms', 'channelUnmuted', names(s, d, party)));
          return { state: patchComms(setChannelState(s, party, 'open'), {}), reports };
      }
      return { state: s, reports };
    }

    case 'maneuver':
      return setHelmGoal(s, action);

    case 'posture': {
      s = { ...s, posture: { stance: action.stance, since: s.turn } };
      return { state: s, reports: [say('xo', `posture_${action.stance}`)] };
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
        s = addOrder(s, 'helm', 'Charge jump drive', 'underway').state;
        return { state: s, reports: [say('helm', 'jumpCharging', { charge: Math.round(h.jump.charge) })] };
      }
      if (action.mode === 'engage') {
        const towing = h.tractor.target === 'kestrel' && efficiency(h, 'tractor') >= 0.5 && !s.ships.kestrel.destroyed;
        s = setFlag(s, 'jumped');
        if (towing) s = setFlag(s, 'kestrelTowedOut');
        s = { ...s, orders: { ...s.orders, jumpCharging: false } };
        return { state: s, reports: [say('helm', towing ? 'jumpWithKestrel' : 'jumpEngaged')] };
      }
      // withdraw: start charging and open the range
      const threat: ShipId = s.ships.cruiser.detected && !s.ships.cruiser.destroyed && !s.flags.cruiserGone ? 'cruiser' : 'kestrel';
      s = { ...s, orders: { ...s.orders, jumpCharging: true } };
      s = addOrder(s, 'helm', 'Charge jump drive (withdraw)', 'underway').state;
      const r = setHelmGoal(s, { type: 'maneuver', intent: 'retreat', target: threat, speed: 'full', persistent: false }, true);
      return { state: r.state, reports: [say('helm', 'withdrawing', { charge: Math.round(h.jump.charge) })] };
    }

    case 'improvise':
      return hooks.improvise(s, action, rng);

    case 'wait':
      return { state: s, reports: [say('xo', 'waiting')] };

    case 'learn':
      return { state: s, reports: [say('xo', 'learnAck', { phrase: action.phrase, meaning: action.meaning })] };
    case 'standing':
    case 'restrict':
      // Applied by the turn pipeline (standing.ts), which owns their order tracking.
      return { state: s, reports };
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


function commReachable(s: WorldState, t: 'kestrel' | 'cruiser'): boolean {
  const sh = s.ships[t];
  if (!sh.detected || sh.destroyed || (t === 'cruiser' && s.flags.cruiserGone)) return false;
  if (t === 'kestrel') {
    const arden = s.characters.arden;
    if (!arden || arden.status === 'dead') return false;
    if (arden.ship === 'kestrel' && sh.systems.comms.health <= 0) return false;
  }
  return true;
}

const SPEED: Record<'slow' | 'half' | 'full', number> = { slow: 0.3, half: 0.55, full: 1 };

/** Replace the Halcyon's helm goal with a new manoeuvre, superseding the previous order. */
export function setHelmGoal(s: WorldState, action: Extract<ProposedAction, { type: 'maneuver' }>, quiet = false): Applied {
  const reports: Report[] = [];
  const h = s.ships.halcyon;
  const prev = h.nav;
  const prevOrder = prev ? getOrder(s, prev.orderId) : undefined;
  if (prevOrder && (prevOrder.status === 'acknowledged' || prevOrder.status === 'underway' || prevOrder.maintaining)) {
    s = updateOrder(s, prevOrder.id, { status: prevOrder.status === 'completed' ? 'completed' : 'superseded', maintaining: false });
    if (!quiet) reports.push(say('helm', 'helmSuperseded', { label: prevOrder.label }));
  }
  let offset: NavGoal['offset'] = null;
  if (action.intent === 'holdStation' && action.target && action.target !== 'border') offset = sub(h.position, s.ships[action.target].position);
  if (action.intent === 'face' && !action.target) offset = { x: (h.heading + 180) % 360, y: 0 };
  const draft: NavGoal = {
    intent: action.intent,
    target: action.target ?? null,
    second: action.second ?? null,
    rangeKm: action.rangeKm ?? null,
    speedFactor: SPEED[action.speed ?? 'full'],
    offset,
    orderId: null,
    reached: false,
    startedTurn: s.turn,
  };
  const label = goalLabel(s, draft);
  const tmp = patchShip(s, 'halcyon', { nav: draft });
  const eta = roundEta(estimateEta(tmp, 'halcyon', draft));
  const added = addOrder(s, 'helm', action.persistent ? `${label} (no matter what)` : label, 'acknowledged', '', eta);
  s = patchShip(added.state, 'halcyon', { nav: { ...draft, orderId: added.id } });
  if (action.persistent) s = updateOrder(s, added.id, { persistent: true });
  if (action.intent === 'evasive') s = setCounter(s, 'evasive_halcyon', s.turn + 1);
  const g = guidanceFor(s, 'halcyon', draft);
  const course = g.point ? headingOf(sub(g.point, h.position)) : g.heading ?? h.heading;
  const vars: Record<string, string | number> = {
    label,
    target: refName(s, draft.target),
    second: refName(s, draft.second),
    km: draft.rangeKm !== null ? km(draft.rangeKm) : '',
    now: draft.target && draft.target !== 'border' ? km(range(s, 'halcyon', draft.target)) : '',
    eta: etaText(eta),
    course: String(Math.round(course) % 360).padStart(3, '0'),
  };
  if (!quiet) reports.push(say('helm', `helmAck_${action.intent}`, vars));
  if (!quiet && action.persistent) reports.push(say('helm', 'helmPersistent'));
  // Simulator familiarity colours the crew's voice; it is never treated as a real event.
  const drills = s.familiarity?.drilled?.[action.intent] ?? 0;
  if (!quiet && drills >= 3 && !s.counters[`drillnote_${action.intent}`]) {
    s = setCounter(s, `drillnote_${action.intent}`, 1);
    reports.push(say('helm', s.provenance.timeline === 'canonical' ? 'helmDrilledReal' : 'helmDrilledSim', { n: drills }));
  }
  return { state: s, reports };
}
